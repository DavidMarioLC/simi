# Design

## Context

El repositorio solo contiene OpenSpec; no hay código, dependencias, pruebas ni especificaciones previas que conservar. La motivación y el alcance funcional están en `proposal.md`; los contratos de comportamiento están en las tres especificaciones de este cambio.

El usuario ha elegido WXT, TypeScript, Manifest V3, React, Tailwind CSS y Translator API. La documentación de Chrome describe detección de capacidades, descarga de modelos y activación del usuario, y excluye Web Workers como contexto de ejecución del traductor. No se ha comprobado todavía la API en un content script de esta extensión.

## Goals / Non-Goals

**Goals:**
- Mantener captura, posicionamiento e interacción junto a la selección en la propia página.
- Separar el adaptador de traducción de la interfaz para probar sus estados sin descargar modelos en cada prueba.
- Impedir resultados atrasados y conservar un ciclo de vida de recursos limitado a cada documento.
- Compilar una extensión autocontenida, con estilos locales y permisos justificados.

**Non-Goals:**
- Utilizar el mundo MAIN de la página o un puente expuesto a sus scripts como sustitución automática del contexto aislado.
- Mantener un traductor global entre pestañas o una marca persistente que finja disponibilidad del modelo.
- Introducir servicios remotos o una interfaz alternativa si la integración nativa no funciona; una alternativa requiere revisar este cambio.

## Decisions

### 1. Arquitectura centrada en un content script aislado

El content script del documento principal detectará selecciones, administrará el adaptador de traducción y montará la burbuja React mediante `createShadowRootUi` de WXT. El popup controlará exclusivamente la preferencia de activación. No se necesita un service worker para la arquitectura inicial: `chrome.storage` y sus eventos de cambio conectan popup y páginas abiertas.

La traducción se propone en el contexto con documento del content script, con detección de capacidades y errores explícitos. No se ejecutará en un worker. Un panel lateral obliga a abandonar la interacción elegida; un documento offscreen añade mensajería y dudas de activación; el mundo MAIN expone la integración a los scripts del sitio. No se añaden esas alternativas al MVP.

```text
Seleccion de texto
       |
       v
Content script aislado ----> Adaptador Translator API (en -> es)
       |                                  |
       v                                  v
Burbuja React + Tailwind <-------- estado / progreso / resultado
       ^
       |
chrome.storage.local <---- Popup: activar / desactivar
```

**Validación de integración previa al desarrollo completo:** después del esqueleto mínimo, comprobar en Chrome estable real la presencia de `Translator`, `availability({ sourceLanguage: 'en', targetLanguage: 'es' })`, creación mediante clic directo en la burbuja y traducción posterior sin otro clic en el mismo documento. Registrar versión, contexto, resultados y restricciones, sin texto real del usuario. Probar HTTPS, HTTP local y una página con política restrictiva. La falta de soporte puntual produce el estado de indisponibilidad especificado. Si tampoco funciona en un documento HTTPS ordinario, detener el desarrollo del flujo y revisar el diseño con el usuario: una simulación o un puente no cuentan como integración nativa validada.

### 2. Selección capturada al terminar el gesto

Escuchar los cambios de selección para invalidar solicitudes anteriores y procesar la selección final tras `pointerup` o finalización de una selección mediante teclado. Coalescer eventos repetidos sin traducir cada movimiento mientras se arrastra. Capturar texto y rango antes de interactuar con la burbuja; ignorar selección vacía, campos editables y la propia interfaz.

Usar los rectángulos del rango para anclar la burbuja a la primera línea visible de la selección, con preferencia por arriba, ajuste horizontal y alternativa inferior. Acotar dimensiones al viewport, permitir desplazamiento interno para resultados largos y recalcular con scroll y resize sin alterar el layout de la página. Si el anclaje desaparece o deja de ser visible, cerrar e invalidar la solicitud. Una burbuja cerrada no se reabre por cambios de geometría ni por el resultado de una operación anterior.

Una selección automática ahorra acciones frente a un botón por cada traducción. El coste es solicitar acceso al documento en los sitios donde se habilite la extensión y administrar correctamente los eventos de selección.

### 3. Estado explícito de preparación y traducción

Modelar `hidden`, `checking`, `activation-required`, `preparing`, `downloading`, `translating`, `translated`, `unavailable` y `error`. Mapear los estados de disponibilidad que exponga la API (`available`, `downloadable`, `downloading`, `unavailable`) sin confundir recursos disponibles con una instancia ya creada.

Una instancia válida se reutiliza por documento. Si hace falta crearla y no hay un gesto válido, mostrar «Activar traducción». Ejecutar `Translator.create` directamente desde el manejador de esa acción, evitando esperas ajenas a la creación que puedan perder la activación. Compartir una sola promesa de preparación por contexto y actualizar el progreso con `downloadprogress`. Al terminar, traducir la selección que siga vigente, no necesariamente la que inició la descarga.

Cada selección y cierre modifica una generación de solicitud. Solo una respuesta con la generación vigente puede actualizar la burbuja. Mantener como máximo una traducción activa y una selección pendiente reemplazable; cuando termine la activa, atender únicamente la selección más reciente. Aprovechar cancelación si está soportada y, en cualquier caso, descartar resultados obsoletos. Liberar instancia y listeners al invalidarse el contexto o abandonar el documento.

No persistir la activación del traductor. Navegar, recargar o cambiar de sitio puede exigir prepararlo de nuevo, aunque Chrome ya haya descargado recursos.

### 4. Tailwind compilado dentro del Shadow DOM

Integrar Tailwind con la compilación de WXT y adjuntar el CSS generado al Shadow Root, usando el modo de inyección de estilos para UI de WXT. Definir tipografía, colores y dimensiones base dentro de ese árbol, incluyendo un tamaño de fuente base controlado para evitar dependencia accidental de unidades heredadas del sitio. No cargar Tailwind desde CDN ni inyectar su reset en el documento principal.

React administrará el contenido de la burbuja y los estados accesibles; los eventos de selección y posicionamiento permanecerán fuera de los renders. Usar texto escapado, no HTML procedente de la selección o de la traducción. Añadir anuncios de estado y controles accesibles sin mover el foco automáticamente durante la lectura. Conservar el rango capturado al utilizar controles y permitir cerrarlos con Escape.

CSS manual sería suficiente para una burbuja pequeña, pero Tailwind respeta la elección del usuario y permite compartir estilos con el popup sin afectar a la página.

### 5. Permisos y persistencia mínimos para el flujo elegido

Declarar Manifest V3, Chrome 138 como versión mínima inicial y content scripts para `http://*/*` y `https://*/*`, solo en el frame principal. Solicitar `storage`; no añadir `tabs`, `scripting`, `sidePanel`, `contextMenus`, `offscreen` ni permisos de proveedores remotos si no son necesarios. Documentar el acceso a sitios derivado de los patrones del content script y el control de acceso que proporciona Chrome.

Guardar únicamente `enabled` en `chrome.storage.local`, con valor predeterminado verdadero. Leerlo antes de procesar selecciones y escuchar cambios para cerrar la burbuja e invalidar resultados cuando se desactive. El popup será un control mínimo con estado visible. No habrá historial ni sincronización entre dispositivos. No registrar texto, traducciones ni URLs. La memoria del documento puede conservar la selección vigente mientras se utiliza, sin persistirla.

`activeTab` por sí solo exigiría una acción explícita por pestaña y no cubre el flujo automático elegido. La inyección estática se conserva como decisión inicial, sujeto al acceso a sitios concedido por el usuario.

### 6. Pruebas deterministas y validación nativa separadas

Usar Playwright con Chromium y un contexto persistente para cargar la extensión compilada y comprobar selección, geometría, estilos, cierre, preferencias y estados del adaptador. Introducir una simulación de Translator API únicamente en el entorno de pruebas y en el mismo mundo aislado donde se ejecuta el adaptador; una simulación en `window` del mundo MAIN no valida el content script. Verificar que el paquete de producción no contiene el proveedor simulado ni interruptores para activarlo.

Los escenarios automatizados deben cubrir recursos descargables, API ausente, errores, selección nueva durante una traducción lenta y desactivación con solicitudes pendientes. No exigir coincidencias literales de traducciones reales: los modelos pueden cambiar. Para la integración nativa, comprobar traducciones reales de una palabra, una frase y un párrafo en Chrome instalado con la extensión cargada y registrar el resultado por separado. La comprobación real es obligatoria para declarar funcional el motor local.

## Risks / Trade-offs

- [API o activación inaccesible en el mundo aislado] → Verificación inicial explícita; error de indisponibilidad por contexto y revisión del diseño si falla la ruta básica HTTPS.
- [Preparación no compartida entre documentos] → Reutilización por documento y nueva activación cuando haga falta, sin prometer un único clic global.
- [Descarga lenta o sin conexión] → Progreso visible y reintento explícito; funcionamiento sin conexión solo con recursos preparados y disponibles.
- [Muchos cambios de selección y traducciones secuenciales] → Coalescer gestos, limitar operaciones activas y reemplazar solicitudes pendientes.
- [Estilos, overlays o políticas particulares de un sitio] → Shadow DOM, pruebas con páginas adversas y límites documentados; no prometer funcionamiento universal.
- [Permisos amplios para selección automática] → Restringir a HTTP/HTTPS, justificar el acceso y respetar los permisos de sitio y el interruptor.
- [Textos largos o resultados variables] → Desplazamiento interno, errores claros y ausencia de truncamiento silencioso; no añadir límites arbitrarios sin necesidad observada.

## Migration Plan

No hay datos ni implementación previos que migrar. Construir y cargar el paquete local generado por WXT para la validación de la primera versión. Entregar instrucciones de instalación, desarrollo y empaquetado; la publicación en Chrome Web Store queda fuera de este cambio. Para revertir una instalación local, desactivar o retirar la extensión desde Chrome.

## References

- [Translator API: disponibilidad, activación, idiomas y contexto de ejecución](https://developer.chrome.com/docs/ai/translator-api).
- [WXT: content scripts e interfaces aisladas](https://wxt.dev/guide/essentials/content-scripts.html).
- [Chrome: ejecución aislada de content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).
- [Playwright: pruebas de extensiones con un contexto persistente](https://playwright.dev/docs/chrome-extensions).
