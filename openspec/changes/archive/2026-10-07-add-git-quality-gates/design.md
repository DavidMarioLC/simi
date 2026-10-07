# Design

## Context

Simi usa npm, WXT y TypeScript. Ya existen scripts `typecheck`, `build`, `test:unit` y `test`. Las pruebas de extensión requieren `.output/chrome-mv3` y Chromium completo en modo headless. No hay hooks ni workflow de CI. Ver la motivación en `proposal.md`.

## Goals / Non-Goals

**Goals:** centralizar validaciones en scripts npm, activarlas automáticamente en clones locales y ejecutar la misma suite en GitHub.

**Non-Goals:** añadir lint o formateo, publicar la extensión, modificar traducciones o automatizar la descarga de modelos nativos.

## Decisions

- Usar `.githooks` y `core.hooksPath` local, con instalador Node ejecutado desde `prepare`. Evita añadir Husky para dos hooks sencillos. El instalador omite CI y copias sin Git, comprueba que el repositorio coincide con el proyecto y no reemplaza una ruta de hooks diferente sin intervención explícita.
- `check:commit` ejecuta tipos y unitarias; `check:push` compila y ejecuta todas las pruebas; `check:ci` ejecuta tipos y `check:push`. Se detienen al primer error. Los hooks comprueban el árbol de trabajo actual; no alteran el staging ni generan commits.
- GitHub Actions usa Ubuntu, Node 24, caché npm, `npm ci` y `playwright install --with-deps chromium`. Se activa en todos los pushes y pull requests. Permisos de lectura, tiempo límite y cancelación de ejecuciones anteriores de la misma referencia. Conservar resultados de pruebas para diagnosticar fallos.
- Mantener `probe:native` manual: necesita Chrome instalado y recursos de traducción reales. CI usa las simulaciones existentes.

## Risks / Trade-offs

- Los hooks pueden omitirse con Git y no inspeccionan una instantánea exclusiva del staging → CI comprueba el commit recibido.
- Pre-push necesita Chromium instalado → documentar instalación inicial y fallar si falta el navegador.
- Una ruta de hooks previa puede entrar en conflicto → fallar con instrucciones claras, sin reemplazarla silenciosamente.
- La suite se valida localmente en macOS; la primera ejecución en GitHub confirma la compatibilidad del runner Linux → instalar dependencias oficiales de Playwright.

## Migration Plan

Instalar dependencias o ejecutar `npm run hooks:install` en clones existentes. Versionar los hooks con permisos de ejecución y el workflow. Para revertir, retirar la configuración añadida y ejecutar `git config --local --unset core.hooksPath` si apunta a `.githooks`.
