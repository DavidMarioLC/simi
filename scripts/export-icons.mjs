import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = await readFile(new URL('../assets/simi-icon.svg', import.meta.url), 'utf8');
const output = new URL('../public/icon/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block}</style>${source}`);
    await page.screenshot({ path: fileURLToPath(new URL(`${size}.png`, output)), animations: 'disabled' });
    console.log(`Exportado ${size}×${size}`);
  }
} finally {
  await browser.close();
}
