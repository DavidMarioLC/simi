# Design

## Context

Ver `proposal.md` para el problema. `selection.content.tsx` monta un Shadow DOM en body con posición fija y z-index 2147483647. `TranslationBubble` crea y retira la sección según el estado y llama a `position` desde un efecto de layout; `positionBubble` mide la sección y fija sus coordenadas. El visor PDF comparte el componente con un callback de posición propio. Chrome mínimo: 138.

## Goals / Non-Goals

**Goals:** desacoplar el apilamiento de la burbuja web del sitio conservando geometría, aislamiento visual, selección y controles existentes.

**Non-Goals:** rediseñar la burbuja, cambiar traducción o permisos, modificar el visor PDF propio o reordenar continuamente capas que el sitio abra después.

## Decisions

- Convertir la sección de la burbuja web en popover manual dentro del callback de posición y abrirla antes de medirla. El elemento permanece dentro del Shadow DOM, con los mismos estilos y eventos. Aumentar z-index o mover el host dentro del documento no resuelve elementos de la capa superior.
- Usar modo manual para conservar los cierres existentes y no cerrar popovers del sitio. Abrir solamente si no está abierto; las actualizaciones de traducción y geometría no reinician el popover. Retirar la sección al ocultar el estado elimina también su presencia en la capa superior.
- Restablecer inset, margen y overflow del popover y hacer su backdrop transparente y sin eventos. Mantener ancho, padding, borde, sombra, colores y posicionamiento actuales. No añadir semántica modal ni autofocus.
- Mantener la promoción exclusivamente en el callback web: cubre páginas y notebooks, mientras el visor PDF conserva su contenedor actual.
- Añadir regresiones que superpongan realmente una cabecera y un popover sobre la burbuja, comprobando hit testing y controles. Comparar estilos y geometría con una sección equivalente sin promoción, además de ejecutar las suites existentes de posición, cierre, notebooks y PDF.

## Risks / Trade-offs

- Estilos nativos de popover podrían centrar o recortar la sección → restablecerlos y comparar geometría y estilos en Chromium.
- Un popover abierto por el sitio después puede quedar encima → la apertura de cada nueva burbuja se ordena sobre las capas existentes; no se modifica continuamente la interfaz del sitio.
- Abrir un popover oculto altera su tamaño medido → abrir antes de llamar a `positionBubble`.
- Perder la selección o el foco impediría activar la traducción → conservar manejo de eventos, no usar autofocus y ejecutar pruebas de ratón y teclado.
