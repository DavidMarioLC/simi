# Tasks

## 1. Validación inicial del contexto PDF

- [x] 1.1 Preparar una página mínima de extensión y un probe reproducible con Chrome instalado y perfil temporal; verificar presencia de Translator API, disponibilidad inglés a español, creación mediante gesto y dos traducciones reales consecutivas. Entregar evidencia con versión y contexto, sin contenido privado; si falla, informar y revisar el diseño antes de continuar la integración de traducción.
- [x] 1.2 Fijar e integrar PDF.js y sus recursos locales con WXT; verificar `npm run typecheck`, `npm run build` y renderizado de un PDF sintético con capa de texto y worker bajo la CSP de producción.
- [x] 1.3 Comprobar carga remota pública, URL sin sufijo `.pdf`, fixture con sesión y redirección a otro origen, y lectura de un archivo local; registrar permisos y límites observados en documentación de compatibilidad, distinguiendo evidencia nativa de pruebas con fixtures.

## 2. Apertura y carga de documentos

- [x] 2.1 Añadir las acciones «Abrir en Simi» y «Abrir PDF local» al popup y los permisos mínimos; verificar que la acción remota lee la URL de la pestaña activa sin inyectar código en el visor nativo, abre una pestaña nueva y conserva la original. Cubrir pestañas no admitidas y ausencia de redirección automática en pruebas de extensión.
- [x] 2.2 Implementar el traspaso efímero del destino remoto mediante handshake vinculado a la pestaña del visor; verificar rechazo de remitentes/destinos inválidos, consumo único y estado inicial recuperable tras pérdida de sesión, sin guardar URLs en storage o en el query del visor.
- [x] 2.3 Implementar carga HTTP/HTTPS con validación del PDF, acceso por origen y solicitud opcional de permisos desde una acción del usuario; probar acceso permitido y denegado, sesión disponible y fallida, redirecciones y respuestas HTML de login, mostrando errores y opciones de recuperación.
- [x] 2.4 Implementar el selector local y la sustitución de documento con cancelación y limpieza; verificar cancelación del selector, archivo inválido, archivo protegido no admitido y reemplazo durante una carga lenta mediante pruebas del visor.
- [x] 2.5 Documentar las dos rutas de apertura, permisos y alternativa local ante fallos remotos en README; verificar las instrucciones usando un PDF público y un archivo sintético local.

## 3. Lectura y controles del visor

- [x] 3.1 Incorporar navegación por páginas, indicador de página actual/total y zoom sobre el visor PDF.js; verificar cambio de página, zoom y controles con teclado en pruebas con PDF multipágina.
- [x] 3.2 Incorporar búsqueda de texto y navegación entre coincidencias; verificar resultados encontrados, ausencia de coincidencias y exclusión de los campos de búsqueda de la captura de traducción.
- [x] 3.3 Añadir estados de carga y mensajes para páginas sin texto seleccionable; verificar un PDF escaneado sintético y una página aún en carga, conservando la lectura y sin ofrecer OCR. Documentar ese límite y los controles de lectura.

## 4. Burbuja automática y traducción local

- [x] 4.1 Extraer las partes compartidas de selección/posicionamiento necesarias y montar la burbuja con el controlador existente en el visor; verificar selección real con ratón y teclado sobre texto PDF y exclusión de controles, sin regresiones en las pruebas existentes de web y notebooks.
- [x] 4.2 Ajustar el anclaje al área visible de lectura y recalcular con scroll, resize y zoom; probar selecciones de varias líneas y páginas, bordes, desaparición de la selección y reemplazo de nodos por renderizado, sin reabrir rangos inválidos.
- [x] 4.3 Aplicar cierre, preferencia persistente e invalidación por selección/documento; probar Escape, botón, clic fuera, selección B durante traducción lenta de A, cambio de PDF, desactivación y reactivación entre popup y visores abiertos.
- [x] 4.4 Cubrir en pruebas con proveedor simulado los estados de activación, descarga, indisponibilidad y reintento; verificar reutilización de traductor por documento y que un fallo de traducción no impide leer el PDF. Confirmar que la simulación no entra en el paquete de producción.
- [x] 4.5 Documentar la burbuja automática y la activación inicial cuando sea necesaria; verificar el flujo real en el visor con Translator API nativa, incluyendo zoom, scroll y una segunda selección, y guardar evidencia con texto sintético.

## 5. Verificación integral

- [x] 5.1 Verificar los recorridos completos popup → PDF remoto → selección → traducción y popup → archivo local → selección → traducción en Chrome real; comprobar que el visor predeterminado sigue funcionando sin accionar Simi y que el original permanece intacto.
- [x] 5.2 Revisar el paquete y observar almacenamiento, logs y red durante carga/traducción; verificar recursos PDF.js locales, ausencia de persistencia de documentos/URLs/textos, ausencia de envío de texto a servicios remotos y limpieza al cambiar/cerrar documentos. Distinguir descarga del PDF/modelo de envío de contenido.
- [x] 5.3 Ejecutar `npm run check:ci` y revisar la evidencia nativa y documentación de compatibilidad; verificar aprobación de los controles existentes y nuevos, sin declarar probados sitios autenticados fuera de la evidencia disponible.

## 6. Corrección de agotamiento de servicios de traducción

- [x] 6.1 Reproducir el fallo comunicado con el PDF local y diagnosticar la disponibilidad en el perfil habitual sin persistir el documento ni sus textos.
- [x] 6.2 Liberar traductores al ocultar/desactivar la pestaña o invalidar la extensión, descartar preparaciones obsoletas y ofrecer recomprobación de indisponibilidad; verificar regresiones de reutilización, selección y recuperación.
