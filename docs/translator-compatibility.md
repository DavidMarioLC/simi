# Compatibilidad de Translator API

Comprobación inicial: 7 de octubre de 2026, Chrome estable **154.0.8037.98** en macOS, perfil temporal independiente del perfil del usuario, paquete WXT de producción. Se utilizó Translator API real, sin simulaciones.

## Resultados nativos iniciales

| Contexto | Disponibilidad en mundo aislado | Resultado |
| --- | --- | --- |
| HTTPS `example.com` | `Translator` presente; `downloadable` | Primera ejecución: «Hello world» → «hola mundo» y segunda traducción con la misma instancia: «Good morning» → «¡Buenos días». |
| Nueva ejecución en perfil temporal | `downloadable` | Un intento inicial devolvió `NotSupportedError` durante preparación; después se preparó correctamente en otro documento HTTPS. La disponibilidad no garantiza que la creación tenga éxito. |
| HTTP local `127.0.0.1` | Contexto seguro; `downloadable` | Creación desde clic y traducción real: «hola mundo». Esto no prueba HTTP de un dominio remoto no seguro. |
| HTTP local con `Permissions-Policy: translator=()` | `unavailable` | La creación fue rechazada con `NotAllowedError`. La política de la página afecta al content script aislado. |
| Navegación a otro documento HTTPS | `downloadable` | Se creó otra instancia y se obtuvo «hola mundo». No se heredó una instancia del documento anterior. |

La interfaz inicial se ejecutó en Shadow DOM desde el content script aislado. Las comprobaciones de capacidades de la segunda ejecución identificaron explícitamente el origen `chrome-extension://…` del contexto, sin confundirlo con el mundo de utilidades de Playwright.

## Preparación y privacidad

Chrome puede necesitar conectividad para descargar recursos de traducción y expone progreso durante la creación. La extensión reutiliza la instancia únicamente dentro del documento donde fue creada. Al navegar o recargar, comprueba las capacidades de nuevo y puede pedir otra activación. La descarga y un fallo de preparación no se consideran traducciones satisfactorias.

No se envía texto a un proveedor externo ni se guardan selecciones, traducciones o URLs en almacenamiento o logs. Los textos mostrados en esta evidencia son ejemplos sintéticos de prueba.

## Reproducción

Tras `npm ci` y `npm run build`, ejecutar `npm run probe:native`. El script abre Chrome instalado en un perfil temporal, carga el paquete mediante el protocolo de depuración y utiliza páginas de prueba. El reporte temporal se guarda en `test-results/native-probe.json`, excluido de Git.

## Validación de la interfaz final

La interfaz de producción se comprobó en Chrome **154.0.8037.98**, con la API y los modelos reales, sobre una página HTTPS con contenido sintético de prueba:

| Selección | Resultado nativo |
| --- | --- |
| `Hello` | `Hola` |
| `Good morning, how are you?` | `Buenos días, ¿cómo estás?` |
| Dos párrafos | `El navegador puede traducir texto en esta página. Sigue leyendo sin salir de la página.` |

En esa ejecución el gesto de selección generado por Playwright permitió crear el traductor automáticamente. Las selecciones de frase y párrafos posteriores reutilizaron la misma instancia sin otra activación. La prueba inicial anterior comprobó también la creación mediante clic en «Activar traducción». El comportamiento de activación depende del contexto y del gesto; no se afirma que siempre sea automático.

Se comprobó traducción real tras navegar a otro documento y tras recargarlo; se volvió a preparar la instancia correspondiente. En HTTP local la traducción funcionó. Con `Permissions-Policy: translator=()` la burbuja informó la indisponibilidad y no ofreció activar un par denegado.

Para probar la recuperación, el script provocó una excepción sintética en una llamada a `Translator.prototype.translate`, restauró inmediatamente el método nativo y pulsó «Reintentar». El reintento obtuvo de nuevo una traducción del modelo real. Esta inyección prueba el manejo de errores; no se presenta como un fallo espontáneo del modelo.

La captura nativa mostró la burbuja encima de la selección de dos párrafos. El contenido original permaneció seleccionado e intacto.

## Pruebas con simulación

Las pruebas automatizadas con Chromium utilizan una implementación simulada introducida por CDP exclusivamente en el mundo aislado de la extensión, y controlan la activación para verificar explícitamente el botón. No requieren descargar modelos. La simulación, los ejemplos y el control de activación pertenecen a `tests/` y no se compilan dentro de la extensión.

La suite cubre disponibilidad, descarga, errores, reutilización, selección por ratón y teclado, párrafos, estilos agresivos del sitio, posicionamiento en bordes, scroll, resize, textos largos, cierres, solicitudes atrasadas, campos excluidos y preferencias en dos pestañas y entre sesiones. La selección real con teclado usa la navegación por cursor de Chromium. Estas pruebas no demuestran calidad ni disponibilidad del modelo nativo.

## Notebooks de GitHub

El content script principal sigue limitado al documento principal. Un segundo script captura selecciones únicamente en `https://notebooks.githubusercontent.com/view/ipynb`, en un iframe directo registrado por la página del notebook activo de `github.com`. Otros iframes, páginas de repositorio que no muestran un `.ipynb` y visores incrustados en otros sitios permanecen excluidos.

La selección y sus rectángulos viajan por mensajería interna de la extensión, validada por pestaña, frame, documento y revisión, hasta el documento principal. El service worker actúa como relay sin almacenar el contenido; no se expone el texto mediante `window.postMessage`, ni se añaden permisos de historial o mensajería externa. Los únicos permisos declarados siguen siendo `storage` y las coincidencias de content scripts. El traductor y la burbuja se ejecutan en el principal, por lo que no necesitan que el iframe delegue Translator API. La política de permisos del documento principal sigue siendo efectiva.

Las pruebas con simulación usan fixtures en los orígenes de GitHub y del visor mediante interceptación de red de Playwright, sin relajar la identificación de producción. Cubren selección real de ratón y teclado en el iframe, saltos de línea, geometría con scroll en ambos documentos, escala y recorte, selección vigente entre documentos, cierres, exclusiones, API ausente o denegada, sustitución del visor y preferencias.

### Evidencia nativa del visor

Comprobación del 7 de octubre de 2026 con Chrome **154.0.8037.98** en macOS, perfil temporal independiente y paquete de producción. Se usaron los notebooks públicos `06 - Linking and Interactions.ipynb` y `07 - Bar and Categorical Data Plots.ipynb` de `bokeh/bokeh-notebooks`, sin interceptar respuestas de GitHub ni sustituir Translator API.

| Selección real con ratón | Traducción del modelo local |
| --- | --- |
| `Now that we know from the ` | `Ahora que sabemos por el` |
| `Bar charts are a common an` | `Los gráficos de barras son un` |

Se seleccionó un fragmento visible de una celda Markdown con ratón y se extendió una selección con teclado real en cada notebook. La burbuja siguió el desplazamiento de la página, el texto original permaneció intacto y Escape la cerró. Al navegar al segundo notebook se preparó el contexto correspondiente. En esta ejecución no hizo falta pulsar «Activar traducción» ni reintentar: las selecciones permitieron preparar el traductor automáticamente. La primera disponibilidad fue `downloadable` y la segunda `available`.

La prueba de teclado seleccionó únicamente `N` y `B`; el modelo devolvió `norte` y `si`. Esto verifica la detección y el flujo de traducción, sin afirmar calidad lingüística para caracteres o frases incompletas. La disponibilidad y los gestos de activación siguen dependiendo de Chrome y del contexto.

El [reporte nativo conservado](notebook-verification.json) incluye las selecciones exactas y los resultados. La [captura del visor](notebook-preview.png) muestra la burbuja junto a la selección. Para repetir la comprobación, ejecutar `npm run build` y `npm run probe:notebooks`; los informes de cada ejecución se guardan temporalmente en `test-results/`.
