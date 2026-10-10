# Proposal

## Why

En algunos sitios, el contenido superpuesto tapa parte de la burbuja de traducción. Su contenedor ya tiene un z-index elevado, pero pertenece al apilamiento normal de la página y no garantiza que la traducción quede visible.

## What Changes

- Mostrar la burbuja de páginas y notebooks mediante un popover manual en la capa superior del navegador.
- Conservar exactamente su apariencia compacta, posición junto a la selección y controles existentes.
- Verificar superposición real frente a cabeceras, contextos de apilamiento y popovers del sitio, además del cierre y reapertura.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `selection-translation`: exigir que la burbuja visible no quede tapada por capas del sitio que ya estén presentes al mostrarla, sin alterar su presentación.

## Impact

Cambios en `entrypoints/selection.content.tsx`, `assets/tailwind.css` y pruebas de integración en `tests/extension.spec.ts`. Se mantiene el componente compartido y el visor PDF propio. No se requieren permisos ni dependencias adicionales; el Chrome mínimo del proyecto admite Popover API.
