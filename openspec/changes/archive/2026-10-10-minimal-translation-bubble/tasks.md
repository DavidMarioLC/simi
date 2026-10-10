# Tasks

## 1. Presentación compartida

- [x] 1.1 Reorganizar `components/TranslationBubble.tsx` en logo, contenido y cierre, retirar la cabecera visual de idiomas y aplicar las dimensiones, borde y sombra de `design.md`; verificar en la extensión compilada que un resultado breve ocupa una fila y menos de 320 px.
- [x] 1.2 Implementar el ancho intrínseco con máximo de 320 px y límite al área visible, contenido flexible, saltos de línea y partición de cadenas largas; ajustar solo los estilos necesarios de la burbuja en `assets/tailwind.css` y verificar ausencia de desbordamiento horizontal con resultados breves y largos en una ventana estrecha.
- [x] 1.3 Conservar mensajes, progreso y botones existentes en la columna de contenido, añadir la descripción accesible de idiomas y mantener cierre permanente de 26 × 26 px, anuncios y foco visible; verificar activación, descarga, error y reintento, así como cierre con teclado y ratón.
- [x] 1.4 Ampliar `tests/extension.spec.ts` con comprobaciones del ancho que depende del contenido, fila única para una traducción breve, cadenas sin espacios, cierre visible y descripción accesible; verificar que pasan con `npm run build` y `npx playwright test tests/extension.spec.ts` junto con las regresiones existentes de estilos y capa superior.

## 2. Geometría en las superficies admitidas

- [x] 2.1 Verificar los cambios de tamaño de estado a resultado junto a los bordes, scroll y resize en páginas y notebooks, reutilizando `ResizeObserver` y `positionBubble`; incorporar a `tests/extension.spec.ts` la regresión necesaria para el ancho adaptable y comprobar que el panel permanece dentro del área visible sin reabrirse después del cierre.
- [x] 2.2 Verificar la presentación compartida en el visor PDF y sus límites de tamaño; ampliar `tests/pdf.spec.ts` para comprobar un resultado breve compacto, texto extenso con scroll y cierre accesible, ajustando los límites de presentación de `lib/pdf-selection.tsx` solo si hace falta; comprobar con `npm run build` y `npx playwright test tests/pdf.spec.ts`.

## 3. Verificación integrada

- [x] 3.1 Ejecutar `npm run typecheck`, `npm run build` y `npm test`; verificar que pasan los controles y las regresiones de selección, estados, superposición, cierre y visor PDF.
- [x] 3.2 Revisar capturas al 100 % de una palabra, una frase, varios párrafos y activación, incluyendo una ventana estrecha y ejemplos en página, notebook y PDF; verificar definición del logo de 16 px, protagonismo del resultado, sombra suave y controles legibles, y conservar la evidencia en `test-results/`.
