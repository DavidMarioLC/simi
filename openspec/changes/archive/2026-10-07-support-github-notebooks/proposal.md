# Proposal

## Why

Simi solo detecta selecciones en el documento principal y excluye explícitamente los iframes. Esta limitación impide traducir el contenido de notebooks `.ipynb` cuando el visor de GitHub lo presenta en un documento incrustado.

## What Changes

- Admitir palabras, frases y párrafos seleccionados en la vista renderizada de notebooks de repositorios de `github.com`, conservando el contenido original.
- Extender la detección al iframe del visor de notebooks, sin habilitar traducción en iframes arbitrarios.
- Mantener una única burbuja, la selección vigente, los cierres, las preferencias y la traducción local al pasar entre la página y el notebook.
- Verificar el visor real y añadir pruebas de selección, desplazamiento, navegación y políticas de traducción.
- Actualizar la documentación de compatibilidad para describir esta excepción al límite de documento principal.

Fuera del alcance: descargar o ejecutar notebooks, analizar su JSON, traducir archivos completos, editores de notebooks, GitHub Enterprise, otros visores y traducción remota.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `selection-translation`: ampliar las selecciones admitidas al visor de notebooks de GitHub y conservar el comportamiento de la burbuja entre documentos.

## Impact

Afecta a `entrypoints/selection.content.tsx`, a la configuración de inyección de WXT y a la comunicación entre documentos de la extensión si el visor usa un iframe de otro origen. Se prevé un relay interno mediante un background de Manifest V3, reutilizando `lib/translation.ts` en el documento principal. Afecta también a `tests/extension.spec.ts`, `scripts/probe-native.mjs`, README y la evidencia de compatibilidad. No se prevén dependencias nuevas ni servicios externos.
