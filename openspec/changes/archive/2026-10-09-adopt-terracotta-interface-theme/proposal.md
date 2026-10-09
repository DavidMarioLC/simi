# Proposal

## Why

Simi ya tiene un logo terracota, pero sus controles siguen usando índigo y el visor PDF conserva acentos azules. Extender la paleta del logo a las tres superficies dará continuidad a la identidad peruana y moderna elegida.

## What Changes

- Usar terracota `#C65335` como acento principal y terracota oscuro `#A8432A` en botones con texto blanco y enlaces.
- Sustituir acentos índigo en popup, burbuja y controles propios del visor PDF: acciones, interruptor activo, progreso y foco de teclado.
- Incorporar crema `#F5F0E8` en superficies suaves, conservando áreas de lectura blancas y texto oscuro.
- Centralizar los colores de marca y sus estados para compartirlos entre las tres superficies.
- Verificar contraste, estados interactivos y aislamiento de estilos respecto de las páginas visitadas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `extension-branding`: añadir una paleta coherente y legible para controles y superficies de la extensión, además del símbolo existente.

## Impact

Afecta a `assets/tailwind.css`, los estilos compartidos de marca, `entrypoints/popup/App.tsx`, `components/TranslationBubble.tsx`, `entrypoints/pdf/style.css` y `docs/branding.md`. La verificación utiliza las pruebas existentes de extensión y PDF. Se conservan logo, iconos exportados, estructura, permisos, traducción, preferencias y contenido de documentos; no se introduce un selector de temas ni modo oscuro.
