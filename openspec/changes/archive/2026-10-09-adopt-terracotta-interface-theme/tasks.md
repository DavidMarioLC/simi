# Tasks

## 1. Paleta compartida

- [x] 1.1 Definir variables de marca y estados en `assets/brand.css`, importarlas en `assets/tailwind.css` y exponer alias Tailwind; verificar con `npm run build` que las variables se incluyen tanto en páginas de extensión como en los estilos encapsulados.
- [x] 1.2 Documentar en `docs/branding.md` los roles de acento, acción, hover, activo, crema, texto y foco; calcular contraste de los pares propuestos y verificar al menos 4,5:1 para texto afectado y 3:1 para indicadores de foco.

## 2. Popup y burbuja

- [x] 2.1 Sustituir acentos índigo y aplicar superficies crema en el popup y acciones terracota en la burbuja, conservando su área de lectura blanca; verificar visualmente acciones, interruptor encendido y apagado, progreso, errores, hover, activo, foco y deshabilitado, con `npm run typecheck` sin errores.
- [x] 2.2 Ejecutar `npm run build` y `npx playwright test tests/extension.spec.ts`; inspeccionar estilos computados y capturas de popup y burbuja, incluyendo la página de prueba con estilos agresivos, para confirmar que las variables se resuelven y la página externa no cambia.

## 3. Visor PDF

- [x] 3.1 Usar la paleta compartida en marca, enlaces, foco y estados interactivos de controles propios de `entrypoints/pdf/style.css`, y crema en superficies suaves; comprobar visualmente la barra, mensajes, controles habilitados y deshabilitados, búsqueda y páginas blancas sin alterar contenido o resaltados de PDF.js.
- [x] 3.2 Ejecutar `npm run build` y `npx playwright test tests/pdf.spec.ts`; revisar la burbuja de traducción dentro del visor y verificar coherencia de colores y contraste computado en sus acciones, enlaces y foco.

## 4. Verificación integrada

- [x] 4.1 Recargar la extensión compilada en Chrome y registrar capturas de las tres superficies; confirmar que no quedan acentos índigo en controles propios y que logo, geometría, permisos y comportamiento mantienen su funcionamiento.
