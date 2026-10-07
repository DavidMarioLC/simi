# Proposal

## Why

Las validaciones actuales dependen de que cada desarrollador las ejecute manualmente. Automatizarlas antes del commit, del push y en GitHub permite detectar errores antes de integrar cambios.

## What Changes

- Pre-commit: comprobación de tipos y pruebas unitarias.
- Pre-push: compilación y suite completa de Playwright.
- GitHub Actions: ejecutar tipos, compilación y todas las pruebas en cada push y pull request.
- Instalar hooks versionados automáticamente durante la instalación local y documentar requisitos y comandos.

## Capabilities

### New Capabilities

Ninguna: este cambio configura herramientas de desarrollo. Se declara `skip_specs: true`.

### Modified Capabilities

Ninguna: el comportamiento de la extensión permanece igual.

## Impact

Afecta a `package.json`, hooks versionados, un instalador local, `.github/workflows/ci.yml` y README. Reutiliza las pruebas y dependencias existentes. La prueba nativa de traducción sigue siendo manual; no se publican paquetes ni se configuran reglas de protección de ramas.
