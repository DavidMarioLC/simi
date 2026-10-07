import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Simi — inglés a español',
    description: 'Traduce el texto seleccionado junto a la selección con los modelos locales de Chrome.',
    minimum_chrome_version: '138',
    permissions: ['storage'],
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
