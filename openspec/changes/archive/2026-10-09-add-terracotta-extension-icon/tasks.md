# Tasks

## 1. Recursos de marca

- [x] 1.1 Crear el SVG maestro de la «S» escalonada terracota sobre crema y guardar la referencia corregida en documentación del proyecto; verificar visualmente que conserva su silueta y elimina el defecto central.
- [x] 1.2 Exportar los PNG de 16, 32, 48 y 128 píxeles a `public/icon/`; verificar sus dimensiones y revisar a tamaño real la separación de trazos en 16 y 32 píxeles.
- [x] 1.3 Documentar paleta, fuente geométrica y procedimiento reproducible de exportación en `docs/branding.md`; verificar que el procedimiento regenera los cuatro archivos desde el mismo maestro.

## 2. Integración en extensión

- [x] 2.1 Declarar iconos de instalación y de acción en `wxt.config.ts`; ejecutar `npm run build` y verificar que el manifiesto final conserva el popup y que todas las rutas de iconos existen en el paquete.
- [x] 2.2 Crear la representación compartida del símbolo y reemplazar las letras decorativas en `entrypoints/popup/App.tsx` y `components/TranslationBubble.tsx`; comprobar `npm run typecheck` y revisar contenedores de 40 y 28 píxeles, geometría coincidente y marca excluida del árbol accesible.

## 3. Verificación integrada

- [x] 3.1 Ejecutar `npm run build` y `npx playwright test tests/extension.spec.ts`; comprobar que el popup y las traducciones conservan su comportamiento.
- [x] 3.2 Cargar el paquete en Chrome y revisar barra, administrador, popup y burbuja; registrar evidencia visual de los iconos y comprobar que la marca carga sin conexión ni recursos externos.
