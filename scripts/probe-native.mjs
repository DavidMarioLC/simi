import { chromium, expect } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'node:http';

const fixture = `<!doctype html><html lang="en"><head><style>body{font:20px/1.6 system-ui;padding:160px 80px;max-width:650px}</style></head><body>
<p id="word">Hello</p><p id="phrase">Good morning, how are you?</p><div id="paragraphs"><p>The browser can translate text on this page.</p><p>Keep reading without leaving the page.</p></div></body></html>`;
const server = createServer((request, response) => {
  if (request.url === '/restricted') response.setHeader('Permissions-Policy', 'translator=()');
  response.setHeader('Content-Type', 'text/html'); response.end(fixture);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const local = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(join(tmpdir(), 'simi-native-'));
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chrome', headless: false,
  ignoreDefaultArgs: ['--disable-extensions', '--disable-component-update'],
  args: ['--enable-unsafe-extension-debugging'],
});
const report = { date: new Date().toISOString(), version: context.browser().version(), simulated: false, results: [] };
try {
  const page = context.pages()[0];
  const installation = await context.browser().newBrowserCDPSession();
  const { id } = await installation.send('Extensions.loadUnpacked', { path: resolve('.output/chrome-mv3') });
  report.extensionId = id;
  const session = await context.newCDPSession(page);
  const worlds = [];
  session.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context));
  session.on('Runtime.executionContextsCleared', () => worlds.splice(0));
  await session.send('Runtime.enable');
  // Contenido sintético servido en una URL HTTPS de prueba; la API sigue siendo la de Chrome.
  await page.route('https://example.com/**', route => route.fulfill({ contentType: 'text/html', body: fixture }));
  async function open(url, surface) {
    await page.goto(url);
    await page.locator('simi-translator[data-ready=true]').waitFor({ state: 'attached' });
    const world = worlds.find(c => c.origin === `chrome-extension://${id}`);
    const capabilities = await session.send('Runtime.evaluate', {
      contextId: world.id, awaitPromise: true, returnByValue: true,
      expression: "(async()=>({secure:isSecureContext,api:typeof Translator,availability:typeof Translator==='undefined'?null:await Translator.availability({sourceLanguage:'en',targetLanguage:'es'})}))()",
    });
    const item = { surface, capabilities: capabilities.result.value, samples: [] };
    report.results.push(item);
    console.log(surface, JSON.stringify(item.capabilities));
    return item;
  }
  async function select(selector) {
    await page.locator(selector).evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });
  }
  async function translate(item, selector) {
    await select(selector);
    const result = page.getByTestId('translation-result');
    const activate = page.getByRole('button', { name: 'Activar traducción' });
    await result.or(activate).or(page.getByRole('button', { name: 'Reintentar' })).waitFor({ timeout: 60000 });
    const neededActivation = await activate.isVisible();
    if (neededActivation) await activate.click();
    let retries = 0;
    for (;;) {
      const retry = page.getByRole('button', { name: 'Reintentar' });
      await result.or(retry).waitFor({ timeout: 90000 });
      if (await result.isVisible()) break;
      console.log('Preparación/traducción fallida; reintento explícito', ++retries);
      if (retries > 2) throw new Error('La traducción nativa falló tras los reintentos explícitos.');
      await retry.click();
    }
    const text = await result.innerText();
    item.samples.push({ selector, neededActivation, retries, translation: text });
    console.log(JSON.stringify(item.samples.at(-1)));
    return text;
  }
  const https = await open('https://example.com/', 'HTTPS / mundo aislado');
  await translate(https, '#word');
  await translate(https, '#phrase');
  await translate(https, '#paragraphs');
  expect(https.samples[1].neededActivation).toBe(false);
  expect(https.samples[2].neededActivation).toBe(false);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/native-bubble.png' });
  // Provocar un fallo recuperable desde CDP sin sustituir la API ni el modelo.
  const nativeWorld = worlds.find(c => c.origin === `chrome-extension://${id}`);
  await session.send('Runtime.evaluate', {
    contextId: nativeWorld.id,
    expression: "(()=>{const original=Translator.prototype.translate;Translator.prototype.translate=function(...args){Translator.prototype.translate=original;throw new DOMException('Synthetic recoverable test error','QuotaExceededError')}})()",
  });
  await translate(https, '#phrase');
  expect(https.samples.at(-1).retries).toBe(1);
  const http = await open(`${local}/`, 'HTTP local');
  await translate(http, '#word');
  const restricted = await open(`${local}/restricted`, 'HTTP local / translator=()');
  await select('#word');
  await expect(page.getByRole('status')).toContainText('no permite');
  restricted.status = await page.getByRole('status').innerText();
  expect(await page.getByRole('button', { name: 'Activar traducción' }).count()).toBe(0);
  const reloaded = await open('https://example.com/?simi=reload', 'HTTPS / nuevo documento');
  await translate(reloaded, '#word');
  await page.reload();
  await page.locator('simi-translator[data-ready=true]').waitFor({ state: 'attached' });
  const reload = { surface: 'HTTPS / recarga', samples: [] }; report.results.push(reload);
  await translate(reload, '#word');
  await writeFile('test-results/native-probe.json', JSON.stringify(report, null, 2));
  console.log('Comprobación nativa completa.');
} catch (error) {
  report.failure = String(error);
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/native-probe.json', JSON.stringify(report, null, 2));
  throw error;
} finally {
  await context.close();
  server.closeAllConnections();
  await new Promise(r => server.close(r));
  await rm(profile, { recursive: true, force: true });
}
