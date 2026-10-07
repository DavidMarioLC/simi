import { chromium, expect } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const urls = [
  'https://github.com/bokeh/bokeh-notebooks/blob/main/tutorial/06%20-%20Linking%20and%20Interactions.ipynb',
  'https://github.com/bokeh/bokeh-notebooks/blob/main/tutorial/07%20-%20Bar%20and%20Categorical%20Data%20Plots.ipynb',
];
const profile = await mkdtemp(join(tmpdir(), 'simi-notebooks-native-'));
let context;
const report = { date: new Date().toISOString(), simulated: false, results: [] };
await mkdir('test-results', { recursive: true });
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome', headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--disable-component-update'],
    args: ['--enable-unsafe-extension-debugging', '--enable-caret-browsing'],
    viewport: { width: 1100, height: 850 },
  });
  report.version = context.browser().version();
  const installation = await context.browser().newBrowserCDPSession();
  const { id } = await installation.send('Extensions.loadUnpacked', { path: resolve('.output/chrome-mv3') });
  const page = context.pages()[0];
  const session = await context.newCDPSession(page);
  const worlds = [];
  session.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context));
  session.on('Runtime.executionContextsCleared', () => worlds.splice(0));
  await session.send('Runtime.enable');
  const result = page.getByTestId('translation-result');
  const status = page.getByRole('region', { name: 'Traducción al español' }).getByRole('status');
  async function finish(item, method) {
    const viewerFrame = page.frames().find(frame => frame.url().startsWith('https://notebooks.githubusercontent.com/view/ipynb'));
    const selected = await viewerFrame.evaluate(() => getSelection()?.toString());
    if (item.samples.length) await expect(result).not.toHaveText(item.samples.at(-1).translation);
    const activate = page.getByRole('button', { name: 'Activar traducción' });
    const retry = page.getByRole('button', { name: 'Reintentar' });
    await result.or(activate).or(retry).or(status.filter({ hasText: /no permite|no está disponible/ })).waitFor({ timeout: 60000 });
    if (await status.filter({ hasText: /no permite|no está disponible/ }).isVisible()) {
      item.limitation = await status.innerText();
      throw new Error(item.limitation);
    }
    const neededActivation = await activate.isVisible();
    if (neededActivation) await activate.click();
    let retries = 0;
    for (;;) {
      await result.or(retry).waitFor({ timeout: 120000 });
      if (await result.isVisible()) break;
      if (++retries > 2) throw new Error(await status.innerText());
      await retry.click();
    }
    const sample = { method, selected, neededActivation, retries, translation: await result.innerText() };
    item.samples.push(sample);
    console.log(JSON.stringify(sample));
  }
  for (const url of urls) {
    const item = { url, samples: [] }; report.results.push(item);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('simi-translator[data-ready=true]').waitFor({ state: 'attached' });
    const iframe = page.locator('iframe[src^="https://notebooks.githubusercontent.com/view/ipynb"]');
    await iframe.waitFor({ timeout: 60000 });
    item.viewer = await iframe.getAttribute('src');
    const { frameTree } = await session.send('Page.getFrameTree');
    const world = worlds.find(c => c.origin === `chrome-extension://${id}` && c.auxData?.frameId === frameTree.frame.id);
    const capability = await session.send('Runtime.evaluate', { contextId: world.id, awaitPromise: true, returnByValue: true,
      expression: "(async()=>({secure:isSecureContext,api:typeof Translator,availability:typeof Translator==='undefined'?null:await Translator.availability({sourceLanguage:'en',targetLanguage:'es'})}))()" });
    item.capabilities = capability.result.value;
    console.log(JSON.stringify({ url, capabilities: item.capabilities }));
    const paragraph = page.frameLocator('iframe[src^="https://notebooks.githubusercontent.com/view/ipynb"]').locator('p').filter({ hasText: /[a-zA-Z]{4}/ }).first();
    await paragraph.waitFor({ timeout: 60000 });
    item.original = await paragraph.innerText();
    await paragraph.scrollIntoViewIfNeeded();
    const box = await paragraph.boundingBox();
    await page.mouse.move(box.x + 2, box.y + Math.min(10, box.height / 2));
    await page.mouse.down();
    await page.mouse.move(box.x + Math.min(180, box.width - 2), box.y + Math.min(10, box.height / 2), { steps: 12 });
    await page.mouse.up();
    await finish(item, 'mouse');
    await expect(paragraph).toHaveText(item.original);
    const before = await page.getByRole('region', { name: 'Traducción al español' }).boundingBox();
    await page.evaluate(() => window.scrollBy(0, 20));
    await expect.poll(async () => (await page.getByRole('region', { name: 'Traducción al español' }).boundingBox())?.y).toBeLessThan(before.y);
    item.scroll = true;
    await page.screenshot({ path: 'test-results/native-notebook.png' });
    // Preparar el cursor en el párrafo y extender la selección con teclado real.
    await paragraph.evaluate(element => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const node = walker.nextNode();
      const range = document.createRange(); range.setStart(node, 0); range.collapse(true);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    });
    await iframe.focus();
    await page.keyboard.press('Shift+ArrowRight');
    await finish(item, 'keyboard');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('region', { name: 'Traducción al español' })).toHaveCount(0);
    item.escape = true;
  }
} catch (error) {
  report.failure = String(error);
  if (context) await context.pages()[0]?.screenshot({ path: 'test-results/native-notebook.png' }).catch(() => {});
  process.exitCode = 1;
} finally {
  await writeFile('test-results/native-notebooks.json', JSON.stringify(report, null, 2));
  await context?.close();
  await rm(profile, { recursive: true, force: true });
  console.log(report.failure ?? 'Comprobación de notebooks nativa completa.');
}
