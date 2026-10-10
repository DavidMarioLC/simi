# Tasks

## 1. Política y metadatos de entrega

- [x] 1.1 Crear `CHANGELOG.md` en español con sección pendiente y bloque `0.1.0` que resuma el producto actual sin inventar fechas de publicación; comprobar sus afirmaciones contra README e historial y mantener las versiones existentes.
- [x] 1.2 Documentar en README la fuente de versión, sincronización del lockfile, política PATCH/MINOR durante `0.x`, incompatibilidades y agrupación de commits; verificar ejemplos para corrección, funcionalidad y cambio solo de documentación.
- [x] 1.3 Implementar un validador y extractor de notas con Node.js sin dependencias nuevas; verificar con pruebas aisladas tag válido, límites numéricos, formato inválido, versiones divergentes del lockfile, notas ausentes, vacías o duplicadas y extracción sin incluir otra versión. Integrar estas pruebas en los controles existentes para que CI las ejecute.

## 2. Workflow de GitHub Releases

- [x] 2.1 Crear `.github/workflows/release.yml` con evento de tags, checkout del commit etiquetado, concurrencia por tag y job de preparación con lectura; verificar estructura YAML, filtro del evento y rechazo de tags que no coinciden con los metadatos usando el validador del grupo 1.
- [x] 2.2 Incorporar Node.js 24, `npm ci`, Chromium, `typecheck`, `zip` y `test` sobre la salida final; validar el manifiesto y los recursos del ZIP y transportar exclusivamente ZIP y notas al job siguiente. Comprobar localmente el flujo de preparación y casos de manifiesto divergente, ZIP ausente o selección ambigua, sin publicar.
- [x] 2.3 Añadir job de publicación dependiente con `contents: write`, descarga del artefacto de la misma ejecución y `gh release create --verify-tag --notes-file`; verificar con una interfaz de GitHub simulada que fallos previos impiden publicar, que una Release existente no se modifica y que errores de acceso no se confunden con ausencia. No crear tags ni Releases reales durante estas pruebas.
- [x] 2.4 Documentar en README requisitos de permisos, comandos explícitos para preparar/enviar un tag anotado, reintento tras fallo y tratamiento de publicación parcial; revisar que ejemplos y comportamiento del workflow coincidan y que no se requieran secretos npm o Chrome.
- [x] 2.5 Documentar instalación y actualización desde el ZIP compilado de Releases, distinguiéndolo del ZIP de fuentes de GitHub; verificar carga descomprimida del artefacto local y mantener las advertencias sobre recarga de pestañas y probes nativos manuales.

## 3. Verificación integrada

- [x] 3.1 Ejecutar los controles del proyecto incluidos los nuevos casos de validación, y verificar que ZIP, manifiesto, versión, lockfile y notas corresponden a `0.1.0`; registrar resultados y cualquier limitación de comprobación remota sin presentar las simulaciones como publicación real.
- [x] 3.2 Revisar el diff completo y confirmar que no incorpora publicación en tiendas, Packages, cambios funcionales ni tags o Releases creados; entregar el procedimiento concreto para el primer lanzamiento como paso posterior.

## Workflow follow-up

- Después de integrar y revisar la implementación, crear y enviar explícitamente `v0.1.0` sobre el commit elegido para iniciar la primera publicación; comprobar en GitHub la Release y descargar su ZIP compilado.
- Archivar el cambio cuando la implementación y sus verificaciones estén completas, conforme al flujo del proyecto.

## Verificación realizada

- `npm run test:release`: 12 pruebas aprobadas, incluidas versiones, notas, recursos, igualdad del ZIP y simulaciones de GitHub.
- `npm run typecheck`: aprobado.
- `npm run zip`: generado `simi-0.1.0-chrome.zip` (aproximadamente 2.98 MB).
- `npm test`: 43 pruebas aprobadas sobre la salida final; se requirió ejecutar fuera del sandbox para permitir Chromium y servidores de prueba locales.
- `node scripts/release.mjs bundle v0.1.0 .output/release-bundle`: aprobado; ZIP y notas preparados. Se volvió a comprobar que el archivo del bundle coincide byte por byte con la carpeta cargada por las pruebas.
- Workflow parseado como YAML y comprobadas dependencia de publicación, permisos, evento y concurrencia. `git diff --check`: aprobado.
- No se ejecutó el workflow en GitHub ni se comprobaron sus políticas de permisos remotas. La API de GitHub se simuló en las pruebas; no se crearon commits, tags ni Releases. No se ejecutaron probes de modelos nativos porque no cambió el código de traducción.
- La primera publicación requiere integrar los archivos, seleccionar el commit y enviar explícitamente el tag anotado `v0.1.0`, según README.
