# Tasks

`design.md` se omite deliberadamente: el cambio consiste en medidas visuales locales de un único componente, sin nuevas dependencias, arquitectura o decisiones técnicas pendientes.

## 1. Compactar la burbuja compartida

- [x] 1.1 Ajustar las clases de `components/TranslationBubble.tsx`: logo de 22 × 22 px, etiqueta de 11 px, separación logo-etiqueta de 6 px, relleno de 12 px y margen inferior de cabecera de 8 px. Verificar visualmente un resultado breve y los estilos calculados; conservar resultado de 15 px, ancho nominal de 320 px y área de cierre actual.
- [x] 1.2 Ejecutar `npm run typecheck` y `npm run build`; verificar que ambos finalizan correctamente con el componente actualizado.

## 2. Verificar integración visual y comportamiento existente

- [x] 2.1 Revisar la burbuja en páginas, notebooks admitidos y el visor PDF, con resultado breve y extenso y en ventana estrecha; comprobar uniformidad, legibilidad, desplazamiento interno, posición visible y cierre. Revisar también activación, descarga y reintento para confirmar que mensajes y controles no se recortan; guardar evidencia visual de la presentación compacta.
- [x] 2.2 Ejecutar las pruebas existentes de `tests/extension.spec.ts` y `tests/pdf.spec.ts` contra la compilación actual; confirmar que conservan el posicionamiento, cierre e interacción de la burbuja compartida.
