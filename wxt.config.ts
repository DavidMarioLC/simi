import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Simi — inglés a español',
    description: 'Traduce el texto seleccionado junto a la selección con los modelos locales de Chrome.',
    minimum_chrome_version: '138',
    icons: { 16: '/icon/16.png', 32: '/icon/32.png', 48: '/icon/48.png', 128: '/icon/128.png' },
    action: { default_icon: { 16: '/icon/16.png', 32: '/icon/32.png', 48: '/icon/48.png', 128: '/icon/128.png' } },
    permissions: ['storage', 'activeTab'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    content_security_policy: { extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'" },
  },
  hooks: {
    'build:done': (wxt) => {
      for (const folder of ['cmaps', 'standard_fonts', 'wasm']) {
        cpSync(resolve('node_modules/pdfjs-dist', folder), resolve(wxt.config.outDir, 'pdfjs', folder), { recursive: true });
      }
      cpSync(resolve('node_modules/pdfjs-dist/LICENSE'), resolve(wxt.config.outDir, 'pdfjs/LICENSE'));
    },
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
