# Proposal

## Why

La validación previa a publicar Simi 0.1.0 se detiene en `probe:native` porque espera el texto «no permite», que ya no corresponde al mensaje actual de indisponibilidad. Esto impide verificar navegación y recarga aunque la traducción real en páginas, PDFs y notebooks se haya observado correctamente.

## What Changes

- Corregir la comprobación del contexto con `Permissions-Policy: translator=()` en `scripts/probe-native.mjs` para verificar indisponibilidad y ausencia de resultado y de activación, sin depender de la frase antigua.
- Conservar las comprobaciones de traducción real, reutilización, recuperación, navegación y recarga, así como los límites actuales de reintento.
- Ejecutar el probe completo y revisar su reporte; registrar cualquier fallo de preparación del modelo como fallo real de la ejecución, sin sustituirlo por resultados simulados.
- Confirmar que el ZIP de 0.1.0 corresponde a la salida compilada validada.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Es una corrección de herramientas de verificación; no modifica los requisitos ni el comportamiento de la extensión. Se declara `skip_specs: true`.

## Impact

- Archivo de implementación previsto: `scripts/probe-native.mjs`.
- Evidencia generada: `test-results/native-probe.json` y la captura del probe.
- Validación de entrega mediante las herramientas existentes de `scripts/release.mjs`.
- Sin cambios en permisos, dependencias, interfaz, modelos o versión del producto; sin publicación en Chrome Web Store ni GitHub.
- Se omite `design.md`: la corrección es local, sin nuevas decisiones arquitectónicas, dependencias ni migraciones.
