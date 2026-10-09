# Proposal

## Why

La cabecera de la burbuja de traducción tiene demasiado protagonismo y espacio interior para resultados breves. Una reducción moderada del logo, la etiqueta de idiomas y los márgenes permitirá una presentación más compacta conservando la legibilidad del resultado.

## What Changes

- Reducir el logo de 28 a 22 px y la etiqueta de idiomas de 12 a 11 px.
- Reducir la separación entre logo y etiqueta de 8 a 6 px.
- Reducir el relleno interior de 16 a 12 px y la separación entre cabecera y contenido de 10 a 8 px.
- Aplicar la presentación a todas las superficies que usan la burbuja compartida.
- Conservar el resultado a 15 px, el ancho de 320 px, la identidad visual y los controles actuales.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `selection-translation`: añadir una presentación compacta de la cabecera y del espacio interior de la burbuja.

## Impact

El ajuste se concentra en las clases de `components/TranslationBubble.tsx`, compartido por páginas, notebooks admitidos y el visor PDF. Se verificará visualmente y con las comprobaciones existentes pertinentes. No requiere nuevas dependencias ni cambios en la traducción, el posicionamiento, el popup o los recursos de marca.
