# Tasks

## 1. Superposición y conservación visual

- [x] 1.1 Promover la burbuja web a popover manual antes de medirla y neutralizar estilos nativos; añadir y ejecutar regresiones de cabecera, contexto de apilamiento, popover del sitio, apariencia, controles y reapertura.

## 2. Integración

- [x] 2.1 Ejecutar typecheck, build, la suite completa y validación estricta de OpenSpec; confirmar posición, cierres, notebooks y PDF sin regresiones.

Verificación: `npm run typecheck`, `npm run build`, `npx playwright test` (43 pruebas aprobadas) y `openspec validate fix-bubble-stacking --strict`. La regresión de cabecera falló antes de la corrección porque el botón no recibía los clics; pasa con la promoción a la capa superior.
