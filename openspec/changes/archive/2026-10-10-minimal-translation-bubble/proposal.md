# Proposal

## Why

La burbuja actual dedica una fila al logo y los idiomas y mantiene 320 px de ancho incluso para una traducción como «Correr». La dirección elegida, «Compacta con identidad», reduce la superficie que interrumpe la lectura y da protagonismo al resultado conservando el símbolo de Simi.

## What Changes

- Presentar logo pequeño, traducción y cierre en una sola fila para resultados breves.
- Eliminar la cabecera visual de idiomas y conservar el contexto de traducción para tecnologías de asistencia.
- Adaptar el ancho al contenido, con un máximo acotado al área visible; permitir varias líneas y desplazamiento interno en resultados extensos.
- Usar fondo blanco, borde gris neutro, sombra suave, esquinas menos redondeadas y cierre siempre visible.
- Aplicar la misma presentación en páginas, notebooks admitidos y visor PDF, incluidos los estados de preparación, descarga, activación y error.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `selection-translation`: sustituir las dimensiones y la cabecera obligatorias de la presentación compacta por la distribución «Compacta con identidad» y actualizar la conservación de apariencia al abrir, actualizar y cerrar la burbuja.

## Impact

- Implementación prevista en `components/TranslationBubble.tsx` y, si hace falta para dimensionar correctamente el popover, estilos de `assets/tailwind.css` limitados a la burbuja.
- Reutilización de `BrandIcon`, los tokens de marca y el posicionamiento compartido con `ResizeObserver`; comprobar sus consumidores en `entrypoints/selection.content.tsx` y `lib/pdf-selection.tsx`.
- Verificación de geometría, estados y controles mediante las pruebas existentes de `tests/extension.spec.ts` y `tests/pdf.spec.ts`, con cobertura adicional centrada en el ancho adaptable y los cambios de tamaño.
- La identidad definida en `extension-branding` sigue siendo aplicable: mismo símbolo local, paleta y nombres accesibles. No requiere un delta propio.
- Sin nuevas dependencias, permisos ni cambios al motor de traducción. El popup, la barra del visor PDF y la publicación de versiones quedan fuera de alcance.
