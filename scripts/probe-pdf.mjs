import { chromium, expect } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm, cp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'node:http';
import { pdfFixture } from './pdf-fixture.mjs';

const profile = await mkdtemp(join(tmpdir(), 'simi-pdf-native-'));
const report = { date: new Date().toISOString(), simulated: false, samples: [] };
let context;
const server = createServer((request, response) => {
  response.setHeader('Content-Type', 'application/pdf'); response.end(pdfFixture());
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const sourceUrl = `http://127.0.0.1:${server.address().port}/document`;
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome', headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--disable-component-update', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'],
    args: ['--enable-unsafe-extension-debugging'],
  });
  report.version = context.browser().version();
  const requests = [];
  context.on('request', request => {
    if (/^https?:/.test(request.url())) requests.push({ origin: new URL(request.url()).origin, method: request.method(), hasBody: request.postData() != null });
  });
  const extensionPath = join(profile, 'extension');
  await cp(resolve('.output/chrome-mv3'), extensionPath, { recursive: true });
  const manifestPath = join(extensionPath, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.host_permissions = ['http://127.0.0.1/*', 'https://mozilla.github.io/*'];
  await writeFile(manifestPath, JSON.stringify(manifest));
  report.testPermissions = 'Copia temporal del paquete con origen del fixture y PDF público preautorizados; no valida el diálogo de concesión de Chrome.';
  const installation = await context.browser().newBrowserCDPSession();
  const { id } = await installation.send('Extensions.loadUnpacked', { path: extensionPath });
  let page = await context.newPage();
  await page.goto(`chrome-extension://${id}/pdf.html`);
  report.context = 'Página de extensión / pdf.html / mundo principal';
  report.capabilities = await page.evaluate(async () => ({
    secure: isSecureContext,
    api: typeof Translator,
    availability: typeof Translator === 'undefined' ? null : await Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' }),
  }));
  console.log(JSON.stringify(report.capabilities));
  if (report.capabilities.api === 'undefined' || report.capabilities.availability === 'unavailable') {
    throw new Error('Translator API no está disponible en la página de extensión del visor.');
  }
  // El botón del probe aporta un gesto real, sin sustituir API ni modelo.
  await page.evaluate(() => {
    const button = document.createElement('button'); button.textContent = 'Comprobar traducción nativa';
    button.addEventListener('click', () => {
      globalThis.__pdfProbe = Translator.create({ sourceLanguage: 'en', targetLanguage: 'es', monitor: monitor => monitor.addEventListener('downloadprogress', event => console.log('Model progress', event.loaded)) }).then(async translator => {
        try { return [await translator.translate('Hello world'), await translator.translate('Good morning')]; }
        finally { translator.destroy(); }
      }).then(samples => ({ samples }), error => ({ error: String(error) }));
    });
    document.body.append(button);
  });
  await page.getByRole('button', { name: 'Comprobar traducción nativa' }).click();
  let result = await page.evaluate(() => globalThis.__pdfProbe);
  for (let retry = 0; result.error && retry < 2; retry++) {
    console.log('Reintento explícito de preparación nativa:', retry + 1);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Comprobar traducción nativa' }).click();
    result = await page.evaluate(() => globalThis.__pdfProbe);
  }
  if (result.error) throw new Error(result.error);
  report.samples = result.samples;
  expect(report.samples).toHaveLength(2);
  for (const sample of report.samples) expect(sample.trim().length).toBeGreaterThan(0);
  console.log('Traducciones nativas:', JSON.stringify(report.samples));
  await page.getByRole('button', { name: 'Comprobar traducción nativa' }).evaluate(element => element.remove());
  const initialPage = page;
  const localPopup = await context.newPage(); await localPopup.goto(`chrome-extension://${id}/popup.html`);
  const localOpened = context.waitForEvent('page'); localOpened.catch(() => {});
  await localPopup.getByRole('button', { name: 'Abrir PDF local', exact: true }).click();
  page = await localOpened; await page.waitForLoadState(); await initialPage.close();
  await page.getByLabel('Archivo PDF local').setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: pdfFixture() });
  await expect(page.locator('.textLayer:not([hidden])').first()).toContainText('Hello world');
  async function selectAndTranslate(target, text) {
    await target.bringToFront();
    const span = target.locator('.textLayer:not([hidden]) span').filter({ hasText: text }).first();
    await span.evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });
    const result = target.getByTestId('translation-result');
    const activate = target.getByRole('button', { name: 'Activar traducción', exact: true });
    const retry = target.getByRole('button', { name: 'Reintentar', exact: true });
    await result.or(activate).or(retry).waitFor({ timeout: 60000 });
    if (await activate.isVisible()) await activate.click();
    for (let attempt = 0; attempt < 3; attempt++) {
      await result.or(retry).waitFor({ timeout: 90000 });
      if (await result.isVisible()) return result.innerText();
      await retry.click();
    }
    throw new Error('No se pudo traducir la selección PDF con el modelo nativo.');
  }
  report.local = { first: await selectAndTranslate(page, 'Hello world'), second: await selectAndTranslate(page, 'Good morning') };
  await page.getByRole('button', { name: 'Aumentar zoom' }).click();
  await expect(page.getByTestId('translation-result')).toHaveCount(0);
  await expect(page.locator('.textLayer:not([hidden])').first()).toContainText('Hello world');
  report.local.afterZoom = await selectAndTranslate(page, 'Hello world');
  const otherOpened = context.waitForEvent('page'); otherOpened.catch(() => {});
  await page.evaluate(async () => {
    const current = await chrome.tabs.getCurrent();
    await chrome.tabs.create({ windowId: current.windowId, url: 'about:blank', active: true });
  });
  const otherTab = await otherOpened;
  await expect.poll(() => page.evaluate(async () => (await chrome.tabs.getCurrent()).active)).toBe(false);
  await expect(page.getByTestId('translation-result')).toHaveCount(0);
  report.local.tabSwitchCloses = true;
  report.local.afterTabSwitch = await selectAndTranslate(page, 'Good morning');
  await otherTab.close();
  await page.locator('.pdf-container').evaluate(element => { element.scrollTop = 500; });
  await expect(page.getByTestId('translation-result')).toHaveCount(0);
  report.local.scrollCloses = true;
  await page.locator('.pdf-container').evaluate(element => { element.scrollTop = 0; });
  await selectAndTranslate(page, 'Good morning');
  await page.screenshot({ path: 'test-results/native-pdf.png' });
  const original = await context.newPage(); await original.goto(sourceUrl);
  const { targetInfos } = await installation.send('Target.getTargets', { filter: [{ type: 'tab', exclude: false }] });
  const targetInfo = targetInfos.find(target => target.url === sourceUrl);
  if (!targetInfo) throw new Error('No se encontró el target tab del PDF original.');
  await installation.send('Extensions.triggerAction', { id, targetId: targetInfo.targetId });
  // El popup nativo no es una Page de Playwright. Se usa la misma página compilada con activeTab ya concedido por la acción real.
  const popup = await context.newPage(); await popup.goto(`chrome-extension://${id}/popup.html`);
  const tabs = await popup.evaluate(() => chrome.tabs.query({ currentWindow: true }));
  const originalTab = tabs.find(tab => tab.url === sourceUrl);
  if (!originalTab) throw new Error('activeTab no permite leer el destino del PDF original.');
  await popup.evaluate(tabId => chrome.tabs.update(tabId, { active: true }), originalTab.id);
  const opened = context.waitForEvent('page'); opened.catch(() => {});
  await popup.getByRole('button', { name: 'Abrir en Simi', exact: true }).click();
  const remote = await opened; await remote.waitForLoadState();
  await expect(remote.getByLabel('Estado del documento')).toContainText('Selecciona texto');
  report.remote = { first: await selectAndTranslate(remote, 'Hello world'), originalRetained: original.url() === sourceUrl, sourceUrlExcludedFromViewer: !remote.url().includes(sourceUrl) };
  const publicOpened = context.waitForEvent('page'); publicOpened.catch(() => {});
  await popup.evaluate(() => chrome.runtime.sendMessage({ channel: 'simi-pdf-v1', kind: 'open', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' }));
  const publicPdf = await publicOpened;
  await expect(publicPdf.getByLabel('Estado del documento')).toContainText('Selecciona texto', { timeout: 30000 });
  report.publicPdf = { source: 'PDF de ejemplo público de Mozilla PDF.js', pages: await publicPdf.getByLabel('Página', { exact: true }).getAttribute('max') };
  report.storage = await page.evaluate(() => chrome.storage.local.get(null));
  report.appNetwork = requests;
  expect(requests.every(request => request.method === 'GET' && !request.hasBody)).toBe(true);
  console.log('Flujos PDF local y remoto comprobados.');
} catch (error) {
  report.failure = String(error);
  process.exitCode = 1;
  console.error(report.failure);
} finally {
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/native-pdf-probe.json', JSON.stringify(report, null, 2));
  if (!report.failure) {
    await writeFile('docs/pdf-verification.json', JSON.stringify(report, null, 2));
    await cp('test-results/native-pdf.png', 'docs/pdf-preview.png');
  }
  await context?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(profile, { recursive: true, force: true });
}
