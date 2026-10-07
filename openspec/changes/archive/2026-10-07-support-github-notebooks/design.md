# Design

## Context

`entrypoints/selection.content.tsx` detecta selecciones con `getSelection()` y guarda un `Range` del documento principal. Crea allí la burbuja en Shadow DOM y un `TranslationController`; `allFrames: false` impide cualquier detección en documentos incrustados. Las pruebas comprueban que no se inyecta interfaz en iframes. Ver `proposal.md` para la motivación.

El 7 de octubre de 2026 se inspeccionó el [notebook de ejemplo enlazado por GitHub Docs](https://github.com/bokeh/bokeh-notebooks/blob/main/tutorial/06%20-%20Linking%20and%20Interactions.ipynb). Su vista previa carga `https://notebooks.githubusercontent.com/view/ipynb?...` en un iframe con `sandbox="allow-scripts allow-same-origin allow-top-navigation"` y sin atributo `allow`. Esto confirma el aislamiento entre documentos; no demuestra disponibilidad de Translator API ni traducción real en GitHub.

## Goals / Non-Goals

**Goals:**
- Reutilizar la interfaz y el controlador actuales en la página principal, con una única selección activa.
- Admitir el visor identificado sin activar los demás subdocumentos.
- Evitar que la geometría, la navegación dinámica o los resultados atrasados muestren una burbuja fuera de contexto.

**Non-Goals:**
- Ejecutar Translator API en el background o modificar políticas de GitHub.
- Leer JSON del notebook, ejecutar celdas o crear un editor.
- Dar acceso al texto a scripts de la página mediante un puente público.

## Decisions

### Captura limitada en un segundo content script

Mantener la inyección principal actual y añadir un script de captura con `allFrames: true` y coincidencia limitada a `https://notebooks.githubusercontent.com/view/ipynb*`. Validar origen y ruta mediante URL, y habilitar la captura únicamente tras el registro de un visor directo correspondiente al archivo `.ipynb` activo de `github.com`. Un visor abierto por sí solo o incrustado en otro sitio permanece fuera de la excepción. No usar coincidencias indiscriminadas ni habilitar `about:blank` o `srcdoc` por defecto.

La alternativa de cambiar únicamente `allFrames` habilita iframes ajenos y deja el traductor sujeto al contexto del visor; no resuelve coordinación ni recorte de la burbuja.

### Traductor y burbuja en el documento principal

El script del visor captura texto, rectángulos visibles, dimensiones de su viewport e identificadores de documento y revisión. La página principal integra esa selección en el mismo flujo que las selecciones locales y reutiliza `TranslationController`. Adaptar el anclaje para admitir un `Range` local o rectángulos remotos asociados a un iframe vigente.

La burbuja queda en la página principal para evitar recortes del iframe y ofrecer allí «Activar traducción». No asumir que el gesto dentro del visor habilita la creación tras mensajería asíncrona: si hace falta, se requiere el botón habitual. Si la página principal deniega Translator API, mostrar indisponibilidad; no alterar la política ni añadir un proveedor remoto.

### Relay privado de la extensión

Añadir un background que reenvíe mensajes de `runtime` entre el frame del visor y el frame principal de la misma pestaña. Obtener pestaña, frame y documento del remitente proporcionado por Chrome, no de campos arbitrarios del mensaje. Validar tipo de mensaje, estructura, números finitos y registro vigente. Asociar el registro del frame con el iframe esperado mediante un identificador efímero de su URL; no transmitir el texto con `window.postMessage`.

La página principal registra solo el iframe directo del visor del archivo activo, comprobando origen, ruta y correspondencia del notebook en su URL. Los mensajes no registrados o de documentos reemplazados se descartan. No habilitar mensajes externos, registrar contenido ni persistir texto, URLs o selecciones. El relay no conserva texto entre mensajes y debe recuperarse tras reiniciarse el service worker mediante registro renovable.

### Geometría y ciclo de vida

Convertir rectángulos del viewport del visor al viewport principal usando posición del iframe, borde y escala renderizada. Intersectar con las áreas visibles del visor, sus contenedores y la ventana. Elegir la primera línea visible y reutilizar los límites de posición de la burbuja actual. Actualizar desde ambos documentos al desplazar o redimensionar, agrupando eventos con animation frames.

Mantener una generación global de selección en el principal y revisiones por documento del visor. Cerrar o invalidar ante Escape, clic fuera, selección vacía, cambio de preferencia, navegación y sustitución del iframe. Ignorar eventos tardíos del visor cuando una selección del principal lo haya reemplazado. Conservar el comportamiento de botones de la burbuja para no perder la selección capturada.

### Verificación sin depender del servicio de GitHub en CI

Extender las pruebas del paquete compilado con páginas e iframes servidos mediante rutas de prueba para los orígenes y caminos admitidos, manteniendo las comprobaciones de URLs de producción intactas. Simular Translator API únicamente en el contexto aislado principal, como ya hace la suite. Cubrir también remitentes excluidos y páginas distintas de notebooks.

Complementar con Chrome real sobre el notebook público citado, anotando disponibilidad, activación, traducción y navegación. Esa evidencia manual se distingue de las pruebas simuladas y no constituye requisito de conectividad para CI.

## Risks / Trade-offs

- Cambios del dominio o estructura de GitHub → concentrar la identificación del visor en un adaptador y documentar la URL comprobada.
- Políticas que deniegan la API en GitHub → comprobar en Chrome real y mostrar el estado existente sin prometer disponibilidad universal.
- Scroll, escala y contenedores que recortan → probar geometría desde ambos documentos y cerrar si no queda una selección visible.
- Mensajes atrasados o reinicio del background → registro por documento, revisión de selección y resincronización sin almacenamiento del contenido.
- Navegación dinámica sin recarga → observar sustitución del visor y revalidar el archivo activo antes de aceptar mensajes.

## Migration Plan

Implementar captura, relay e integración; compilar e inspeccionar el manifest para confirmar coincidencias y permisos mínimos. Ejecutar controles del proyecto y comprobar el notebook con Chrome real antes de documentar compatibilidad. Recargar la extensión y las pestañas abiertas para instalar los scripts nuevos. La reversión elimina captura y relay y restaura el alcance de documento principal; no requiere migración de datos.
