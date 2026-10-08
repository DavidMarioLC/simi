# Visor PDF opcional

Simi incorpora un visor propio basado en PDF.js 6.4.299, empaquetado con su worker, mapas de caracteres, fuentes estándar y recursos WASM. La apertura es explícita: no registra un manejador MIME ni sustituye el visor predeterminado de Chrome.

## Uso

Para un PDF de internet abierto como documento en una pestaña HTTP/HTTPS, abre el popup de Simi y pulsa «Abrir en Simi». El visor se abre en otra pestaña; el original permanece disponible. También se admiten URLs sin sufijo `.pdf` si devuelven un PDF válido. Para un archivo local, pulsa «Abrir PDF local» y elige el archivo desde el selector del visor; no necesitas habilitar acceso a URLs `file://`.

El visor ofrece páginas, zoom y búsqueda con navegación entre coincidencias. Selecciona texto en inglés con ratón o teclado: aparece la burbuja junto al fragmento. Cuando Chrome necesita un gesto para preparar el modelo, la burbuja ofrece «Activar traducción». El traductor se reutiliza mientras la pestaña permanece activa. Al dejarla o desactivar Simi, se libera para evitar agotar los servicios locales de Chrome; una nueva selección vuelve a prepararlo. Escape, clic fuera y el botón de cierre ocultan la burbuja. La preferencia de traducción automática del popup se aplica también a los visores abiertos.

La burbuja sigue la selección mientras conserve rangos visibles. Si el zoom vuelve a renderizar el texto, se cierra; selecciona de nuevo sobre la página renderizada. La selección de varias páginas traduce lo realmente seleccionado, sin reconstruir automáticamente el orden semántico de columnas ni corregir cortes de línea del PDF.

## Acceso y privacidad

`activeTab` permite conocer el destino al abrir el popup. El visor comprueba el permiso del origen antes de cargar un PDF remoto y, si falta, ofrece solicitarlo mediante una acción del usuario. Las solicitudes llevan las credenciales que Chrome permita; no se copian cookies ni se solicita el permiso `cookies`. El permiso de una página para content scripts no garantiza que una descarga desde el visor esté permitida.

Algunos sitios no permiten repetir la descarga: sesión restringida, enlaces de un solo uso, solicitudes POST y PDFs `blob:` no son universales. Si falla la carga, puedes abrir el original o descargar tú una copia y elegirla en el visor. Una respuesta HTML de login se rechaza como PDF. Las redirecciones se someten a las reglas de acceso del navegador y se comprueba el permiso del origen final antes de procesar el documento.

El archivo local se lee en memoria. Simi no guarda documentos, URLs, selecciones ni traducciones en storage, historial propio o logs, y no los sube a proveedores. Descargar el PDF de su origen y preparar los modelos locales de Chrome sí puede requerir conexión. La URL remota se entrega mediante una sesión efímera, sin incluirla en la dirección del visor; recargarlo requiere repetir la apertura o elegir un archivo. El navegador conserva su propio historial de la pestaña original.

## Límites

- Se requiere texto seleccionable; páginas escaneadas sin texto se pueden leer, pero no traducir por selección. No hay OCR.
- Los documentos que requieren contraseña muestran un error y se pueden abrir en el original; esta versión no incorpora entrada de contraseñas.
- Se admiten PDFs abiertos directamente en una pestaña y archivos locales elegidos. No se extraen documentos desde visores externos incrustados ni otras extensiones.
- Translator API se comprueba en cada documento. Si no está disponible, el PDF se puede leer y la burbuja comunica la limitación.
- La preparación inicial del modelo y PDFs muy grandes pueden tardar; no se trunca silenciosamente la selección ni el documento.

## Evidencia

El 8 de octubre de 2026 se comprobó en Chrome 154.0.8037.98, perfil temporal, que `Translator` está presente en `pdf.html`, con contexto seguro y disponibilidad inicial `downloadable`. Una instancia creada mediante un clic real tradujo «Hello world» y «Good morning» sin sustituir API ni modelo. También se verificaron selecciones en el PDF local, una segunda selección, nueva selección tras zoom, liberación al cambiar de pestaña con recuperación al volver y cierre al desplazar; el flujo remoto tradujo «Hello world» y conservó la pestaña original. Se cargó el PDF público de ejemplo de Mozilla (14 páginas). La evidencia está en `docs/pdf-verification.json` y la captura en `docs/pdf-preview.png`.

Las pruebas de Playwright usan PDFs sintéticos con offsets y xref reales, el visor PDF.js de producción y un proveedor de traducción simulado únicamente en pruebas. Esa simulación no demuestra la traducción nativa; sus resultados se separan de `npm run probe:pdf`, que utiliza Chrome instalado, modelo real y perfil temporal.

Los fixtures remotos de Playwright comprobaron una URL sin sufijo, acceso con cookie de sesión sintética, rechazo sin sesión, redirección a otro origen, respuesta HTML de login y sustitución durante una carga lenta. Los PDFs locales cubren cancelación del selector, documento inválido, PDF cifrado con contraseña, página sin texto, selección real con ratón y teclado y selección entre páginas. Los controles del proyecto comprueban también las regresiones de páginas web y notebooks.

Para automatizar las descargas remotas, el probe nativo usa una copia temporal del paquete con el origen del servidor sintético y Mozilla preautorizados; el fixture de Playwright preautoriza solo sus dos orígenes locales. El paquete de producción conserva permisos opcionales. Se prueba su estado sin permiso y la acción que solicita acceso, pero la aceptación del diálogo nativo de Chrome no se automatiza. No se afirma compatibilidad con otros sitios autenticados sin evidencia.

La observación de solicitudes de la aplicación durante el probe registró únicamente GET sin cuerpo para descargar documentos. Los recursos PDF.js se cargan desde el paquete local. No se observaron escrituras de contenido en storage y el código de producción del visor no incluye registros de texto/documentos. Las descargas internas del modelo gestionadas por Chrome no se confunden con solicitudes de la aplicación.

## Incidencia con AI Engineering Guidebook.pdf

Se reprodujo el 8 de octubre de 2026 con el documento local indicado por el usuario (384 páginas). El archivo carga y ofrece texto seleccionable. En el perfil habitual, `Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' })` devolvió `unavailable`, aunque el paquete de idiomas figuraba instalado. Al comprobar la creación con una frase sintética, Chrome mostró **The translation service count exceeded the limitation.** No es un error de lectura del PDF ni de su selección.

Chrome limita sus servicios simultáneos de traducción y mantiene un tiempo de inactividad antes de cerrarlos ([implementación de Chromium](https://github.com/chromium/chromium/blob/main/components/on_device_translation/features.cc)). Simi libera ahora su traductor al dejar la pestaña (mediante `tabs.onActivated` en el visor, ya que Chrome puede conservar `visibilityState=visible` en una página de extensión inactiva), al desactivarse y al invalidarse la extensión, incluidas preparaciones pendientes. Reutiliza la instancia entre selecciones mientras la pestaña está activa. La burbuja ofrece «Reintentar» para volver a comprobar la disponibilidad, sin intentar crear un modelo cuando Chrome sigue indicando indisponibilidad.

Para recuperar servicios retenidos por una versión anterior, recarga la extensión y las pestañas donde se usó Simi; Chrome puede tardar en liberar los servicios inactivos. Si el bloqueo persiste, guarda el trabajo y reinicia Chrome. No se modifica ninguna bandera ni política del navegador. En perfiles temporales, el documento pudo traducirse con el modelo real; también se observaron fallos transitorios de preparación inicial, recuperados mediante reintentos explícitos. El documento y sus traducciones no se incluyen en las evidencias del repositorio.
