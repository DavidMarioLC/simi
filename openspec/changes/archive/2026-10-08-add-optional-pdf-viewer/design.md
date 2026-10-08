# Design

## Context

La motivación y el alcance están en `proposal.md`. Simi usa WXT, React y Manifest V3; `selection.content.tsx` combina captura y geometría con la burbuja, mientras `lib/translation.ts` administra Translator API por documento. El popup solo controla `enabled`. Las pruebas nativas existentes validan páginas web y notebooks, no páginas del visor de una extensión.

Este cambio añade una página de extensión propia. No intenta inyectar código en el visor integrado de Chrome. Los contratos se describen en `specs/pdf-viewer/spec.md` y `specs/selection-translation/spec.md`.

## Goals / Non-Goals

**Goals:**
- Compartir motor de traducción, interfaz y reglas de selección sin introducir un segundo comportamiento para la burbuja.
- Separar carga del documento, renderizado PDF y traducción para probar sus fallos independientemente.
- Mantener documentos y selecciones en memoria con limpieza explícita por sesión.

**Non-Goals:**
- Registrar `mime_types_handler`, interceptar navegaciones o modificar el visor de otras extensiones.
- Garantizar acceso a cualquier PDF autenticado, enlaces de un solo uso, documentos servidos por POST o URLs `blob:` de otras páginas.
- Incorporar servicios de OCR o traducción remotos.

## Decisions

### 1. Página de visor opcional con PDF.js empaquetado

Crear una página del visor accesible desde el popup. Para un PDF HTTP/HTTPS, «Abrir en Simi» crea una pestaña nueva; «Abrir PDF local» abre el visor con el selector de archivos. La pestaña original sigue disponible. No se exige elevar Chrome 138 a 151 porque no se utiliza `mimeHandler`.

Empaquetar PDF.js, su worker, estilos y recursos necesarios dentro de la extensión, con versión fijada al implementar. Usar la capa de visor y texto de PDF.js para páginas, zoom, búsqueda y selección; no construir un lector completo desde un canvas sin capa de texto. El worker PDF procesa y renderiza; Translator API se ejecuta en el documento del visor, no en ese worker.

Alternativas consideradas: sustituir automáticamente el visor mediante `mimeHandler` contradice la elección de apertura opcional; un visor web remoto introduce una dependencia de servicio y acceso al contenido; reutilizar otra extensión requiere cooperación que no existe en este proyecto.

### 2. Entrada remota explícita y carga local sin permisos de archivos

El popup obtiene la URL HTTP/HTTPS de la pestaña mediante `activeTab` al ser abierto por el usuario; no inyecta scripts en el visor de Chrome. No decidir la validez solo por el sufijo `.pdf`: URLs sin extensión también pueden devolver PDFs. Validar respuesta y contenido al cargar, y rechazar páginas HTML de acceso o errores en lugar de tratarlas como documentos.

Para la carga remota, usar permisos de origen efectivos y solicitar acceso opcional al origen necesario desde el gesto del usuario cuando falte. No ampliar silenciosamente los permisos a todos los sitios. Si una redirección requiere un origen no autorizado, comunicarlo y permitir un reintento explícito con el permiso correspondiente. No transportar cookies manualmente ni pedir permisos de cookies. Utilizar credenciales del navegador cuando sus políticas lo permitan; un fallo de sesión produce el error especificado y la alternativa de elegir una copia local.

Transferir la URL mediante mensajería interna y un identificador de sesión efímero, vinculado a la pestaña del visor. No incluir URLs firmadas en el query del visor ni persistirlas en `storage`. Un handshake permite consumir el destino una vez; si el service worker se reinicia o una recarga pierde el destino, mostrar el estado inicial para elegir un documento o repetir «Abrir en Simi». Rechazar mensajes ajenos a la extensión y destinos distintos de HTTP/HTTPS. Las restricciones de permisos se validan antes de la carga.

Para archivos locales, usar un selector con `File`/`ArrayBuffer`; no navegar a `file://` ni requerir permisos generales del sistema de archivos. La lectura local continúa disponible cuando falla el acceso remoto. No guardar archivos, URLs, textos ni traducciones; el historial del navegador que resulta de la navegación original no es almacenamiento de Simi.

Alternativas: poner la URL completa en el query simplifica la recarga pero expone enlaces sensibles en la URL del visor; persistir el destino facilita recuperación pero contradice las reglas existentes de persistencia. Interceptar la respuesta original exige una arquitectura diferente y queda fuera.

### 3. Captura limitada a la capa de texto y burbuja reutilizable

Separar las partes reutilizables de captura y posicionamiento de `selection.content.tsx` sin ampliar el alcance de notebooks u otros iframes. El visor tiene su propia integración que acepta selecciones únicamente en la capa de texto del PDF, ignora controles y campos editables y utiliza `TranslationController` y `TranslationBubble` existentes. Mantener una instancia por documento y la preferencia `enabled` con sus eventos de actualización.

Capturar al finalizar selección con ratón o teclado, conservando texto y saltos de línea de la selección; no traducir en cada movimiento del arrastre. Calcular el anclaje con los rectángulos visibles dentro del área de lectura, respetando barras de herramientas y bordes. Coalescer recalculados al desplazar, redimensionar o cambiar zoom. Si PDF.js reemplaza los nodos de texto, cerrar e invalidar el rango; no reconstruirlo por coincidencias textuales que podrían anclar otro fragmento.

```text
Popup --> destino remoto efimero --> Visor Simi <-- archivo local
                                       |
                                  PDF.js + texto
                                       |
                                   Seleccion
                                       |
                          TranslationController --> Translator API
                                       |
                                TranslationBubble
```

Cancelar cargas anteriores y utilizar una generación de documento para impedir que un archivo o traducción anterior aparezca tras reemplazar el PDF. Destruir tareas/documentos PDF, revocar object URLs si se utilizan y liberar traductor/listeners al cambiar de archivo o cerrar. Identificar páginas sin texto tras obtener su capa de texto; no confundir una página aún en carga con un PDF escaneado.

Alternativa: duplicar toda la captura web acelera el primer prototipo pero hace divergir preferencias, cierre y descarte de resultados; reconstruir selecciones tras renderizar añade ambigüedad innecesaria.

### 4. Validación nativa antes de completar el visor

Primero comprobar con Chrome instalado y perfil temporal la disponibilidad, activación y traducción real de inglés a español en una página de extensión del visor. Verificar el empaquetado de PDF.js bajo CSP de Manifest V3 y carga de un PDF público y un archivo local. Comprobar también un fixture de acceso con sesión y redirecciones para delimitar permisos y credenciales sin usar documentos privados.

La viabilidad de Translator API en este contexto no está demostrada. Si falla, comunicar la limitación y revisar el diseño antes de continuar el flujo de traducción; no sustituirla por una simulación, un servicio remoto o una ruta oculta. La simulación se usa solo para pruebas deterministas de estados y concurrencia.

### 5. Permisos y errores acotados

Proponer `activeTab` para conocer el destino tras abrir el popup y permisos opcionales HTTP/HTTPS para lectura remota, además de `storage`. Validar si los permisos efectivos existentes bastan por origen antes de pedir otros. Mantener recursos PDF.js y traducción locales. El acceso a archivos elegidos por el usuario no requiere `file://`.

Presentar estados de carga, archivo no admitido, acceso denegado y PDF sin texto. Los documentos cifrados que requieran contraseña quedan como error explicable en esta versión; no se añade un flujo de contraseñas. El estado de traducción continúa independiente: un fallo del traductor no impide leer el documento.

## Risks / Trade-offs

- [Translator API no disponible en la página de extensión] → Validación nativa inicial y revisión del diseño si falla, sin declarar funcional el soporte.
- [Cookies, permisos, redirecciones o enlaces irrepetibles impiden repetir la descarga] → Errores explícitos, original intacto y apertura de archivo local como alternativa.
- [PDFs grandes consumen mucha memoria] → Renderizado progresivo de páginas y limpieza de tareas/documentos; no imponer un límite ni truncar silenciosamente sin evidencia.
- [Zoom o virtualización reemplazan la capa de texto] → Cerrar rangos inválidos y aceptar una nueva selección; probar páginas múltiples y desplazamiento.
- [PDF.js necesita recursos incompatibles con el paquete o CSP] → Prueba de empaquetado antes de desarrollar el lector completo y recursos locales compatibles.
- [Selección PDF incluye cortes de línea propios del diseño] → Conservar lo seleccionado y verificar ejemplos de varias líneas y columnas, sin prometer reconstrucción semántica del documento.

## Migration Plan

Añadir el visor al paquete WXT sin datos persistentes nuevos. Ejecutar pruebas existentes de web/notebooks y las nuevas de PDF; documentar permisos, carga de documentos y límites confirmados. Recargar la extensión para habilitar las nuevas acciones del popup. Revertir el cambio elimina el visor y sus acciones sin migrar preferencias; los documentos originales permanecen disponibles.

## References

- [PDF.js: capas y distribución](https://mozilla.github.io/pdf.js/getting_started/).
- [Translator API: activación y contextos](https://developer.chrome.com/docs/ai/translator-api).
- [Chrome: activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab).
- [Chrome: permisos opcionales](https://developer.chrome.com/docs/extensions/reference/api/permissions).
- [mimeHandler: alternativa de registro como visor](https://developer.chrome.com/docs/extensions/reference/api/mimeHandler).

## Corrección del ciclo de vida de los traductores

El diagnóstico con el PDF real confirmó agotamiento de servicios nativos en el perfil habitual de Chrome. El controlador compartido conserva la instancia entre selecciones de una pestaña activa, pero libera el traductor y aborta su preparación cuando la pestaña se oculta, Simi se desactiva o el contexto se invalida. Una generación de recursos descarta instancias y errores tardíos de preparaciones anteriores. La indisponibilidad ofrece una comprobación explícita con «Reintentar»; no se interpreta como incompatibilidad del PDF ni se fuerza la creación mientras Chrome la rechaza. La recuperación de recursos retenidos por versiones anteriores puede requerir recarga de pestañas o reinicio de Chrome.
