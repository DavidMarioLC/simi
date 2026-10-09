# Proposal

## Why

Simi utiliza una letra «S» genérica en el popup y la burbuja, y no declara iconos propios en la configuración del manifiesto. El concepto terracota elegido por el usuario permite identificar la extensión mediante una geometría moderna inspirada en textiles andinos.

## What Changes

- Crear un símbolo maestro vectorial de la «S» escalonada aprobada, con centro limpio y sin texto.
- Preparar iconos PNG de 16, 32, 48 y 128 píxeles, con símbolo terracota sobre fondo crema.
- Declarar los iconos de instalación y de la acción del navegador en el manifiesto generado por WXT.
- Sustituir las letras decorativas del popup y la burbuja por el mismo símbolo.
- Documentar la referencia, la paleta y la regeneración de los archivos.

## Capabilities

### New Capabilities

- `extension-branding`: identificación visual coherente de Simi en el navegador, el popup y la burbuja de traducción.

### Modified Capabilities

Ninguna.

## Impact

Afecta a `wxt.config.ts`, `entrypoints/popup/App.tsx`, `components/TranslationBubble.tsx` y nuevos recursos locales de marca. No requiere servicios externos en ejecución. El alcance se limita al icono: se conservan los colores de controles y el diseño del visor PDF.
