import { test, expect, chromium, type BrowserContext, type Page, type CDPSession } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer, type Server } from 'node:http';

const html = `<!doctype html><html lang="en"><head><style>
body{margin:0;padding:40px;font:18px/1.6 system-ui;min-height:2000px}
#top{position:absolute;top:0;left:10px} #word{margin-top:200px} #edge{position:absolute;right:8px;top:300px}
p{max-width:650px} button{background:red!important;color:yellow!important;font-size:48px!important}
</style></head><body><span id="top">Hello</span><p id="word">Hello world</p><p id="phrase">Good morning, how are you?</p>
<div id="paragraphs"><p>The browser can translate this paragraph.</p><p>Keep reading without leaving the page.</p></div>
<span id="edge">World</span><p id="slow">Slow request</p><p id="fast">Latest request</p>
<input id="input" value="Secret text"><div id="editable" contenteditable="true">Editable text</div><p id="spaces">   </p>
<iframe srcdoc="<p>Inside frame</p>"></iframe></body></html>`;

let server: Server;
let url: string;
test.beforeAll(async () => {
  server = createServer((_, response) => { response.setHeader('Content-Type', 'text/html'); response.end(html); });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
test.afterAll(async () => { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); });

type World = { id: number; origin: string; auxData?: { frameId?: string } };
async function attachMock(context: BrowserContext, page: Page, extensionId: string, mode = 'available', targetUrl = url) {
  const session = await context.newCDPSession(page);
  const worlds: World[] = [];
  session.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context));
  await session.send('Runtime.enable');
  await page.goto(targetUrl);
  await page.locator('simi-translator[data-ready=true]').waitFor({ state: 'attached' });
  const { frameTree } = await session.send('Page.getFrameTree');
  const world = worlds.find(c => c.origin === `chrome-extension://${extensionId}` && c.auxData?.frameId === frameTree.frame.id);
  expect(world).toBeTruthy();
  await session.send('Runtime.evaluate', { contextId: world!.id, expression: `
    Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { isActive: false } });
    globalThis.__simiMock = { mode: ${JSON.stringify(mode)}, calls: [], creates: 0, failOnce: false };
    globalThis.Translator = class {
      static async availability() { return __simiMock.mode === 'unavailable' ? 'unavailable' : __simiMock.mode === 'downloadable' ? 'downloadable' : 'available'; }
      static async create(options) {
        __simiMock.creates++;
        if (__simiMock.mode === 'create-error') throw new Error('download error');
        if (__simiMock.mode === 'downloadable') {
          const m = new EventTarget(); options.monitor(m);
          const event = new Event('downloadprogress'); Object.assign(event, { loaded: 0.5 }); m.dispatchEvent(event);
          await new Promise(r => setTimeout(r, 300));
        }
        return new this();
      }
      async translate(text) {
        __simiMock.calls.push(text);
        if (__simiMock.failOnce) { __simiMock.failOnce = false; throw new Error('quota'); }
        await new Promise(r => setTimeout(r, text.includes('Slow') ? 350 : 30));
        return __simiMock.mode === 'long' ? 'Traducción larga. '.repeat(500) : 'ES: ' + text;
      }
      destroy() {}
    };
    if (__simiMock.mode === 'absent') globalThis.Translator = undefined;
  ` });
  return { session, world: world!.id, worlds };
}

async function launch(profile: string) {
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: ['--enable-unsafe-extension-debugging', '--enable-caret-browsing'],
    ignoreDefaultArgs: ['--disable-extensions'],
    viewport: { width: 900, height: 700 },
  });
  const browserSession = await context.browser()!.newBrowserCDPSession();
  const { id } = await browserSession.send('Extensions.loadUnpacked', { path: resolve('.output/chrome-mv3') });
  return { context, id };
}

async function setup(mode = 'available') {
  const profile = await mkdtemp(join(tmpdir(), 'simi-e2e-'));
  const { context, id } = await launch(profile);
  const page = context.pages()[0]!;
  const mock = await attachMock(context, page, id, mode);
  return { context, page, id, profile, ...mock, cleanup: async () => { await context.close(); await rm(profile, { recursive: true, force: true }); } };
}

async function select(page: Page, selector: string, method: 'pointer' | 'keyboard' = 'pointer') {
  await page.locator(selector).evaluate((element, method) => {
    const selection = getSelection()!;
    const range = document.createRange(); range.selectNodeContents(element);
    selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(method === 'pointer' ? new PointerEvent('pointerup', { bubbles: true }) : new KeyboardEvent('keyup', { key: 'Shift', bubbles: true }));
  }, method);
}
const bubble = (page: Page) => page.getByRole('region', { name: 'Traducción al español' });
async function prepared(page: Page, selector = '#word') {
  await select(page, selector);
  const activate = page.getByRole('button', { name: 'Activar traducción' });
  await activate.click();
  await expect(page.getByTestId('translation-result')).toBeVisible();
}
async function mockValue(session: CDPSession, world: number, expression: string) {
  const value = await session.send('Runtime.evaluate', { contextId: world, expression, returnByValue: true });
  return value.result.value;
}

test('palabra, frase y párrafos: activación, selección vigente y original intacto', async () => {
  const f = await setup();
  try {
    await prepared(f.page);
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Hello world');
    await select(f.page, '#phrase', 'keyboard');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Good morning, how are you?');
    await select(f.page, '#paragraphs');
    await expect(f.page.getByTestId('translation-result')).toContainText('Keep reading');
    const calls = await mockValue(f.session, f.world, '__simiMock.calls');
    expect(calls[2]).toContain('\n');
    expect(await mockValue(f.session, f.world, '__simiMock.creates')).toBe(1);
    await expect(f.page.locator('#word')).toHaveText('Hello world');
    await f.page.screenshot({ path: 'test-results/bubble.png' });
  } finally { await f.cleanup(); }
});

test('selección real con ratón y teclado', async () => {
  const f = await setup();
  try {
    const box = (await f.page.locator('#word').boundingBox())!;
    await f.page.mouse.move(box.x + 1, box.y + 15);
    await f.page.mouse.down();
    await f.page.mouse.move(box.x + 103, box.y + 15, { steps: 8 });
    await f.page.mouse.up();
    await expect(bubble(f.page)).toBeVisible();
    await f.page.getByRole('button', { name: 'Activar traducción' }).click();
    await expect(f.page.getByTestId('translation-result')).toBeVisible();
    await f.page.keyboard.press('Escape');
    await f.page.locator('#phrase').evaluate(element => {
      const s = getSelection()!; const r = document.createRange(); r.setStart(element.firstChild!, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r);
    });
    await f.page.keyboard.press('Shift+ArrowRight');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: G');
  } finally { await f.cleanup(); }
});

test('posición arriba, debajo, borde lateral, scroll y estilos aislados', async () => {
  const f = await setup();
  try {
    await prepared(f.page);
    await expect(bubble(f.page)).toHaveAttribute('data-placement', 'above');
    expect(await bubble(f.page).evaluate(el => getComputedStyle(el).fontSize)).toBe('14px');
    await select(f.page, '#top');
    await expect(bubble(f.page)).toHaveAttribute('data-placement', 'below');
    await select(f.page, '#edge');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: World');
    const box = (await bubble(f.page).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(900);
    await select(f.page, '#word');
    const before = (await bubble(f.page).boundingBox())!.y;
    await f.page.evaluate(() => window.scrollTo(0, 50));
    await expect.poll(async () => (await bubble(f.page).boundingBox())?.y).toBeLessThan(before);
    await f.page.setViewportSize({ width: 400, height: 700 });
    const narrow = (await bubble(f.page).boundingBox())!;
    await expect.poll(async () => { const r = (await bubble(f.page).boundingBox())!; return r.x + r.width; }).toBeLessThanOrEqual(400);
    expect(narrow.width).toBeLessThanOrEqual(400);
    await f.page.evaluate(() => window.scrollTo(0, 1000));
    await expect(bubble(f.page)).toHaveCount(0);
    expect(await f.page.locator('button').count()).toBe(0);
  } finally { await f.cleanup(); }
});

test('resultados largos tienen scroll interno sin salir de la ventana', async () => {
  const f = await setup('long');
  try {
    await prepared(f.page);
    const result = f.page.getByTestId('translation-result');
    expect(await result.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    const r = (await bubble(f.page).boundingBox())!;
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.y + r.height).toBeLessThanOrEqual(700);
  } finally { await f.cleanup(); }
});

test('Escape, clic fuera, selección vacía y campos excluidos', async () => {
  const f = await setup();
  try {
    await prepared(f.page);
    await f.page.keyboard.press('Escape');
    await expect(bubble(f.page)).toHaveCount(0);
    await f.page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await expect(bubble(f.page)).toHaveCount(0);
    await select(f.page, '#phrase');
    await expect(bubble(f.page)).toBeVisible();
    await f.page.mouse.click(800, 650);
    await expect(bubble(f.page)).toHaveCount(0);
    await select(f.page, '#spaces');
    await expect(bubble(f.page)).toHaveCount(0);
    await select(f.page, '#editable');
    await expect(bubble(f.page)).toHaveCount(0);
    await f.page.locator('#input').focus();
    await f.page.keyboard.press('Meta+A');
    await expect(bubble(f.page)).toHaveCount(0);
    expect(await f.page.frameLocator('iframe').locator('simi-translator').count()).toBe(0);
  } finally { await f.cleanup(); }
});

test('nueva selección y cierre descartan traducciones lentas', async () => {
  const f = await setup();
  try {
    await prepared(f.page);
    await select(f.page, '#slow');
    await select(f.page, '#fast');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Latest request');
    await select(f.page, '#slow');
    await f.page.keyboard.press('Escape');
    await f.page.waitForTimeout(450);
    await expect(bubble(f.page)).toHaveCount(0);
  } finally { await f.cleanup(); }
});

test('activación accesible y progreso de descarga', async () => {
  const f = await setup('downloadable');
  try {
    await select(f.page, '#word');
    const activate = f.page.getByRole('button', { name: 'Activar traducción' });
    await activate.focus();
    await f.page.keyboard.press('Enter');
    await expect(f.page.getByRole('status')).toContainText('Descargando modelo… 50%');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Hello world');
    await f.page.keyboard.press('Escape');
    await expect(bubble(f.page)).toHaveCount(0);
  } finally { await f.cleanup(); }
});

for (const mode of ['unavailable', 'absent', 'create-error']) {
  test(`estado de error en contexto ${mode}`, async () => {
    const f = await setup(mode);
    try {
      await select(f.page, '#word');
      if (mode === 'create-error') {
        await f.page.getByRole('button', { name: 'Activar traducción' }).click();
        await expect(f.page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
        await mockValue(f.session, f.world, "__simiMock.mode = 'available'");
        await f.page.getByRole('button', { name: 'Reintentar' }).click();
        await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Hello world');
      } else {
        await expect(f.page.getByRole('status')).toContainText(mode === 'absent' ? 'no está disponible' : 'no permite');
        await expect(f.page.getByRole('button', { name: 'Activar traducción' })).toHaveCount(0);
      }
    } finally { await f.cleanup(); }
  });
}

test('preferencia en dos pestañas, solicitudes pendientes y persistencia de perfil', async () => {
  const f = await setup();
  let activeContext = f.context;
  try {
    await prepared(f.page);
    const second = await f.context.newPage();
    await attachMock(f.context, second, f.id);
    await prepared(second);
    await select(f.page, '#slow');
    const popup = await f.context.newPage();
    await popup.goto(`chrome-extension://${f.id}/popup.html`);
    const toggle = popup.getByRole('switch', { name: 'Traducción automática' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(bubble(f.page)).toHaveCount(0);
    await expect(bubble(second)).toHaveCount(0);
    await f.page.waitForTimeout(450);
    await expect(bubble(f.page)).toHaveCount(0);
    const storage = await popup.evaluate(() => (globalThis as any).chrome.storage.local.get(null));
    expect(storage).toEqual({ enabled: false });
    await popup.screenshot({ path: 'test-results/popup.png' });
    await f.context.close();
    const reopened = await launch(f.profile);
    activeContext = reopened.context;
    const p = activeContext.pages()[0]!;
    await p.goto(`chrome-extension://${reopened.id}/popup.html`);
    await expect(p.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    const content = await activeContext.newPage();
    await attachMock(activeContext, content, reopened.id);
    await select(content, '#word');
    await expect(bubble(content)).toHaveCount(0);
    await p.getByRole('switch').click();
    await expect(p.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await expect(bubble(content)).toHaveCount(0);
    await select(content, '#phrase');
    await expect(bubble(content)).toBeVisible();
  } finally { await activeContext.close(); await rm(f.profile, { recursive: true, force: true }); }
});

const notebookPageUrl = 'https://github.com/simi-fixture/notebooks/blob/main/lesson.ipynb';
const notebookViewerUrl = 'https://notebooks.githubusercontent.com/view/ipynb?nwo=simi-fixture%2Fnotebooks&path=lesson.ipynb#fixture-viewer';
const notebookHtml = `<!doctype html><html><body style="margin:0;padding:24px;font:18px/1.6 system-ui;min-height:1600px">
<p id="markdown">The browser can translate this notebook.</p><div id="cells"><p>Hello world</p><p>Keep reading without leaving the page.</p></div>
<p id="slow">Slow notebook request</p><p id="fast">Latest notebook request</p>
<input value="Secret"><div id="editable" contenteditable="true">Editable text</div>
<p id="bottom" style="margin-top:700px">Notebook bottom</p></body></html>`;
const notebookParentHtml = `<!doctype html><html><body style="margin:0;padding:40px;min-height:2000px;font:18px/1.6 system-ui">
<p id="word">Hello world</p><p id="phrase">Good morning</p><div id="clip" style="margin-top:100px"><iframe id="notebook" src="${notebookViewerUrl}" style="display:block;width:700px;height:400px;border:4px solid black" sandbox="allow-scripts allow-same-origin allow-top-navigation"></iframe></div>
<iframe id="other" src="https://other.example/frame"></iframe></body></html>`;

async function setupNotebook(mode = 'available', targetUrl = notebookPageUrl) {
  const profile = await mkdtemp(join(tmpdir(), 'simi-notebook-'));
  const { context, id } = await launch(profile);
  await context.route('https://github.com/simi-fixture/**', route => route.fulfill({ contentType: 'text/html', body: notebookParentHtml }));
  await context.route('https://notebooks.githubusercontent.com/**', route => route.fulfill({ contentType: 'text/html', body: notebookHtml }));
  await context.route('https://other.example/**', route => route.fulfill({ contentType: 'text/html', body: notebookHtml }));
  const page = context.pages()[0]!;
  const mock = await attachMock(context, page, id, mode, targetUrl);
  await page.frameLocator('#notebook').locator('#markdown').waitFor();
  return { context, page, id, profile, ...mock, cleanup: async () => { await context.close(); await rm(profile, { recursive: true, force: true }); } };
}

async function selectNotebook(page: Page, selector = '#markdown', method: 'pointer' | 'keyboard' = 'pointer') {
  await page.frameLocator('#notebook').locator(selector).evaluate((element, method) => {
    const selection = getSelection()!, range = document.createRange(); range.selectNodeContents(element);
    document.dispatchEvent(method === 'pointer' ? new PointerEvent('pointerdown', { bubbles: true }) : new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(method === 'pointer' ? new PointerEvent('pointerup', { bubbles: true }) : new KeyboardEvent('keyup', { key: 'Shift', bubbles: true }));
  }, method);
}
async function prepareNotebook(page: Page) {
  await selectNotebook(page);
  await page.getByRole('button', { name: 'Activar traducción' }).click();
  await expect(page.getByTestId('translation-result')).toHaveText('ES: The browser can translate this notebook.');
}

test('notebook: selección en iframe, teclado, párrafos e interfaz única en el principal', async () => {
  const f = await setupNotebook();
  try {
    await prepareNotebook(f.page);
    expect(await f.page.frameLocator('#notebook').locator('simi-translator').count()).toBe(0);
    await selectNotebook(f.page, '#cells', 'keyboard');
    await expect(f.page.getByTestId('translation-result')).toContainText('Keep reading');
    const calls = await mockValue(f.session, f.world, '__simiMock.calls');
    expect(calls[1]).toContain('\n');
    expect(await mockValue(f.session, f.world, '__simiMock.creates')).toBe(1);
    await expect(f.page.frameLocator('#notebook').locator('#markdown')).toHaveText('The browser can translate this notebook.');
    await selectNotebook(f.page, '#editable');
    await expect(bubble(f.page)).toHaveCount(0);
    await f.page.frameLocator('#other').locator('#markdown').evaluate(element => {
      const s = getSelection()!, r = document.createRange(); r.selectNodeContents(element); s.removeAllRanges(); s.addRange(r);
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });
    await expect(bubble(f.page)).toHaveCount(0);
  } finally { await f.cleanup(); }
});

test('notebook: selección real por ratón y teclado dentro del visor', async () => {
  const f = await setupNotebook();
  try {
    const box = (await f.page.frameLocator('#notebook').locator('#markdown').boundingBox())!;
    await f.page.mouse.move(box.x + 1, box.y + 15); await f.page.mouse.down();
    await f.page.mouse.move(box.x + 95, box.y + 15, { steps: 8 }); await f.page.mouse.up();
    await f.page.getByRole('button', { name: 'Activar traducción' }).click();
    await expect(f.page.getByTestId('translation-result')).toBeVisible();
    await f.page.frameLocator('#notebook').locator('#markdown').evaluate(element => {
      const s = getSelection()!, r = document.createRange(); r.setStart(element.firstChild!, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r);
    });
    // Devolver foco al frame sin modificar la selección desde la interfaz principal.
    await f.page.frameLocator('#notebook').locator('body').evaluate(element => (element as HTMLElement).focus());
    await f.page.locator('#notebook').focus();
    await f.page.keyboard.press('Shift+ArrowRight');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: T');
    await f.page.keyboard.press('Escape');
    await expect(bubble(f.page)).toHaveCount(0);
  } finally { await f.cleanup(); }
});

test('notebook: posición, scroll de ambos documentos, escala y recorte por contenedor', async () => {
  const f = await setupNotebook();
  try {
    await prepareNotebook(f.page);
    const before = (await bubble(f.page).boundingBox())!.y;
    await f.page.evaluate(() => window.scrollTo(0, 40));
    await expect.poll(async () => (await bubble(f.page).boundingBox())?.y).toBeLessThan(before);
    await f.page.frameLocator('#notebook').locator('body').evaluate(() => window.scrollTo(0, 10));
    await expect.poll(async () => (await bubble(f.page).boundingBox())?.y).toBeLessThan(before - 40);
    await f.page.locator('#notebook').evaluate(el => { (el as HTMLElement).style.transformOrigin = 'top left'; (el as HTMLElement).style.transform = 'scale(.6)'; });
    await expect(bubble(f.page)).toBeVisible();
    const box = (await bubble(f.page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(900);
    await f.page.locator('#clip').evaluate(el => { (el as HTMLElement).style.overflow = 'hidden'; (el as HTMLElement).style.height = '10px'; });
    await expect(bubble(f.page)).toHaveCount(0);
    await f.page.locator('#clip').evaluate(el => { (el as HTMLElement).style.height = '400px'; });
    await selectNotebook(f.page);
    await expect(bubble(f.page)).toBeVisible();
    await f.page.frameLocator('#notebook').locator('body').evaluate(() => window.scrollTo(0, 500));
    await expect(bubble(f.page)).toHaveCount(0);
  } finally { await f.cleanup(); }
});

test('notebook: selección vigente, cierre, preferencias y sustitución del visor', async () => {
  const f = await setupNotebook();
  try {
    await prepareNotebook(f.page);
    await selectNotebook(f.page, '#slow');
    await expect(f.page.getByRole('status')).toContainText('Traduciendo');
    await select(f.page, '#phrase');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Good morning');
    await selectNotebook(f.page, '#slow');
    await expect(f.page.getByRole('status')).toContainText('Traduciendo');
    await f.page.frameLocator('#notebook').locator('body').evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await expect(bubble(f.page)).toHaveCount(0);
    await selectNotebook(f.page, '#fast');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Latest notebook request');
    const popup = await f.context.newPage(); await popup.goto(`chrome-extension://${f.id}/popup.html`);
    await popup.getByRole('switch').click(); await expect(bubble(f.page)).toHaveCount(0);
    await selectNotebook(f.page); await expect(bubble(f.page)).toHaveCount(0);
    await popup.getByRole('switch').click();
    await selectNotebook(f.page); await expect(bubble(f.page)).toBeVisible();
    await f.page.locator('#notebook').evaluate(el => el.replaceWith(el.cloneNode(true)));
    await expect(bubble(f.page)).toHaveCount(0);
    await f.page.frameLocator('#notebook').locator('#markdown').waitFor();
    await selectNotebook(f.page); await expect(bubble(f.page)).toBeVisible();
    await f.page.mouse.click(850, 650); await expect(bubble(f.page)).toHaveCount(0);
    await selectNotebook(f.page); await expect(bubble(f.page)).toBeVisible();
    await f.page.evaluate(() => history.pushState({}, '', '/simi-fixture/notebooks/blob/main/README.md'));
    await expect(bubble(f.page)).toHaveCount(0);
    await selectNotebook(f.page); await expect(bubble(f.page)).toHaveCount(0);
  } finally { await f.cleanup(); }
});

test('notebook: relay aislado por pestaña, documentos obsoletos y reinicio del worker', async () => {
  const f = await setupNotebook();
  try {
    await prepareNotebook(f.page);
    const second = await f.context.newPage();
    const other = await attachMock(f.context, second, f.id, 'available', notebookPageUrl);
    await expect(bubble(second)).toHaveCount(0);
    const viewerFrame = f.page.frames().find(frame => frame.url().startsWith('https://notebooks.githubusercontent.com/'))!;
    const viewerSession = await f.context.newCDPSession(viewerFrame);
    const viewerWorlds: World[] = [];
    viewerSession.on('Runtime.executionContextCreated', ({ context }) => viewerWorlds.push(context));
    await viewerSession.send('Runtime.enable');
    const viewerWorld = viewerWorlds.find(c => c.origin === `chrome-extension://${f.id}`)!;
    const attempts = await viewerSession.send('Runtime.evaluate', { contextId: viewerWorld.id, awaitPromise: true, returnByValue: true, expression: `
      (async()=>{
        const bad = await chrome.runtime.sendMessage({channel:'simi-notebook-v1',kind:'begin',token:'unknown',revision:100,actionTime:Date.now()});
        const malformed = await chrome.runtime.sendMessage({channel:'simi-notebook-v1',kind:'selection',token:'unknown',revision:100,generation:1,text:'Forged',geometry:{width:1,height:1,rects:[{left:0,top:0,right:null,bottom:1}]}}).catch(()=>undefined);
        return {bad,malformed};
      })()
    ` });
    expect(attempts.result.value.bad.accepted).toBe(false);
    await viewerSession.send('Runtime.evaluate', { contextId: viewerWorld.id, expression: 'globalThis.Translator = undefined' });
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: The browser can translate this notebook.');
    expect(await mockValue(other.session, other.world, '__simiMock.calls.length')).toBe(0);
    await f.session.send('ServiceWorker.enable');
    await f.session.send('ServiceWorker.stopAllWorkers');
    await selectNotebook(f.page, '#cells');
    await expect(f.page.getByTestId('translation-result')).toContainText('Keep reading');
    await selectNotebook(second);
    await second.getByRole('button', { name: 'Activar traducción' }).click();
    await expect(second.getByTestId('translation-result')).toHaveText('ES: The browser can translate this notebook.');
    await expect(f.page.getByTestId('translation-result')).toContainText('Keep reading');
    await select(f.page, '#phrase');
    await expect(f.page.getByTestId('translation-result')).toHaveText('ES: Good morning');
    await selectNotebook(f.page, '#editable');
    await expect(bubble(f.page)).toHaveCount(0);
  } finally { await f.cleanup(); }
});

for (const mode of ['absent', 'unavailable']) {
  test(`notebook: API ${mode} en principal muestra indisponibilidad`, async () => {
    const f = await setupNotebook(mode);
    try {
      await selectNotebook(f.page);
      await expect(f.page.getByRole('status')).toContainText(mode === 'absent' ? 'no está disponible' : 'no permite');
      await expect(f.page.getByRole('button', { name: 'Activar traducción' })).toHaveCount(0);
      expect(await mockValue(f.session, f.world, '__simiMock.calls.length')).toBe(0);
    } finally { await f.cleanup(); }
  });
}

test('notebook: visor de origen admitido en una página ajena permanece excluido', async () => {
  const f = await setupNotebook('available', notebookPageUrl.replace('lesson.ipynb', 'README.md'));
  try {
    await selectNotebook(f.page);
    await f.page.waitForTimeout(150);
    await expect(bubble(f.page)).toHaveCount(0);
    expect(await mockValue(f.session, f.world, '__simiMock.calls.length')).toBe(0);
  } finally { await f.cleanup(); }
});
