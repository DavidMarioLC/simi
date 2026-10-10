# Proposal

## Why

Simi conserva sus cambios en Git, pero todas las compilaciones siguen identificándose como `0.1.0` y no existe un proceso de Releases con notas y ZIP descargable. Necesitamos asociar cada entrega deliberada con su código, versión y artefacto para poder instalarla, compararla y diagnosticar errores.

## What Changes

- Definir una política de versiones `MAJOR.MINOR.PATCH`, con `package.json` como fuente y sincronización del lockfile; WXT genera la versión del manifiesto.
- Documentar cómo agrupar commits en entregas: correcciones incrementan PATCH, funcionalidades incrementan MINOR y, durante `0.x`, cambios incompatibles incrementan MINOR con advertencia explícita.
- Incorporar un changelog en español, con notas por versión y una primera entrada `0.1.0` que describa el estado actual sin inventar publicaciones anteriores.
- Preparar un workflow de GitHub Releases activado por tags `vX.Y.Z`, que compruebe coherencia de versiones y notas, ejecute las validaciones existentes, empaquete la extensión y publique el ZIP compilado con las notas de esa versión.
- Impedir publicar cuando fallen los controles y rechazar una Release ya existente para evitar sustituir sus artefactos.
- Documentar preparación, primer lanzamiento, reintento tras fallo e instalación mediante ZIP descomprimido. La implementación prepara el mecanismo; no crea ni envía tags ni publica la primera Release por sí sola.

## Capabilities

### New Capabilities

Ninguna: este cambio configura herramientas y documentación de entrega; no modifica comportamientos de la extensión. Se declara `skip_specs: true`.

### Modified Capabilities

Ninguna.

## Impact

Afecta a `package.json` y `package-lock.json` solo si se requieren comandos auxiliares o futuras actualizaciones de versión, un nuevo workflow en `.github/workflows/`, scripts de validación y extracción de notas si son necesarios, `CHANGELOG.md` y README. Reutiliza Node.js 24, `npm ci`, Playwright, `npm run check:ci` y `npm run zip`; necesita escritura de contenidos mediante `GITHUB_TOKEN` exclusivamente para publicar.

Quedan fuera GitHub Packages, npm, Chrome Web Store, publicación automática por cada commit, generación automática de versiones mediante nuevas herramientas y cambios de funcionalidad. Se mantiene `private: true`. Los probes con modelos reales siguen siendo manuales y no se sustituyen por las pruebas simuladas de CI.
