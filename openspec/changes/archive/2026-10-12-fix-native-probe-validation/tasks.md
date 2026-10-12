# Tasks

## 1. Corrección y verificación del probe nativo

- [x] 1.1 Actualizar el caso `translator=()` de `scripts/probe-native.mjs`: comprobar disponibilidad `unavailable`, aviso visible de indisponibilidad, ausencia de resultado y ausencia de «Activar traducción», conservando el registro del mensaje real. Verificar que el diff no altera la extensión, el límite de reintentos ni las demás comprobaciones del probe.
- [x] 1.2 Ejecutar `npm run probe:native` sobre el paquete compilado y verificar código de salida cero, reporte sin `failure` y resultados reales en HTTPS, HTTP local, contexto restringido, nuevo documento y recarga, incluida la recuperación tras el error sintético. Si falla la preparación nativa, conservar el reporte y declarar la validación pendiente; no sustituir la API ni relajar las comprobaciones para obtener éxito.

## 2. Comprobación integrada de la entrega

- [x] 2.1 Ejecutar `npm run check:ci` y verificar pruebas de entrega, tipos, compilación y suite completa aprobados. Ejecutar `npm run zip` y `npm test` sobre la salida final; comprobar que las pruebas aprueban sin cambios del producto.
- [x] 2.2 Ejecutar `node scripts/release.mjs validate v0.1.0` y `node scripts/release.mjs bundle v0.1.0 <carpeta-temporal-nueva>`; verificar correspondencia del ZIP con los archivos compilados y versión `0.1.0`. Entregar el enlace al ZIP y el resultado del reporte nativo, distinguiendo comprobaciones completas de fallos del entorno. No crear tags ni publicar entregas.
