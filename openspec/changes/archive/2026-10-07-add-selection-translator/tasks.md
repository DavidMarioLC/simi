# Tasks

## 1. Base de la extensión y viabilidad nativa

- [x] 1.1 Crear el proyecto WXT con TypeScript, React, Tailwind CSS y gestor de paquetes con lockfile; verificar que los comandos documentados de instalación, comprobación de tipos y compilación terminan correctamente sin alterar los artefactos OpenSpec.
- [x] 1.2 Configurar Manifest V3, versión mínima inicial Chrome 138, popup y content script del frame principal con patrones HTTP/HTTPS y permiso `storage`; verificar el manifiesto generado y que no solicita permisos adicionales innecesarios.
- [x] 1.3 Añadir una interfaz mínima en Shadow DOM para comprobar Translator API en el mundo aislado: disponibilidad `en` → `es`, creación desde un clic y una segunda traducción sin clic adicional; verificarlo con el modelo real en un documento HTTPS ordinario antes de continuar con los grupos siguientes. Si falla esta ruta básica, registrar la evidencia y revisar el diseño con el usuario.
- [x] 1.4 Comprobar también HTTP local, navegación a otro documento y una página con política restrictiva; entregar `docs/translator-compatibility.md` con versión de Chrome, contexto, estados observados, descarga y restricciones, sin selecciones reales del usuario ni afirmaciones de soporte global.
- [x] 1.5 Documentar en README la instalación local de la extensión y los permisos de acceso a sitios; verificar que el paquete compilado se carga desde Chrome siguiendo esas instrucciones.

## 2. Adaptador de traducción y preparación

- [x] 2.1 Implementar el adaptador tipado de Translator API con origen `en`, destino `es` y detección de API, par y contexto no disponibles; verificar con pruebas deterministas que los estados de indisponibilidad producen mensajes claros sin invocar servicios externos.
- [x] 2.2 Implementar activación desde el gesto del botón, una única preparación en curso, progreso de descarga y reutilización de la instancia por documento; verificar los estados disponible, descargable y descargando, y que dos activaciones no duplican la preparación.
- [x] 2.3 Implementar traducción de texto completo con saltos de línea, errores de creación y traducción y reintento explícito; verificar rechazo de texto, fallo de descarga y recuperación sin truncamiento silencioso ni reintentos automáticos infinitos.
- [x] 2.4 Implementar la coordinación de una operación activa y una selección pendiente reemplazable, invalidación de resultados y liberación del traductor al terminar el contexto; verificar que solo la última selección recibe un resultado y que cierre o desactivación impiden reaperturas.
- [x] 2.5 Actualizar la documentación de compatibilidad con el ciclo de vida de preparación por documento y la conectividad inicial; verificar las instrucciones de activación y reintento en Chrome real.

## 3. Selección, burbuja y estilos

- [x] 3.1 Preparar la infraestructura Playwright con Chromium, contexto persistente, extensión compilada y proveedor simulado solo para pruebas en el mundo aislado; verificar que se prueba el content script real y que el paquete de producción excluye la simulación.
- [x] 3.2 Detectar selecciones finales por ratón y teclado, capturar texto y rango y excluir selección vacía, campos editables, iframes y la interfaz propia; verificar con Playwright palabras, frases, varios párrafos, espacios y campos excluidos.
- [x] 3.3 Crear la burbuja React con Tailwind compilado dentro del Shadow DOM y estados de activación, preparación, descarga, traducción, resultado y error; verificar visualmente y con Playwright que una página con estilos globales agresivos no altera la burbuja ni recibe el reset de Tailwind.
- [x] 3.4 Implementar anclaje encima de la primera línea visible, alternativa inferior, ajuste lateral y dimensiones acotadas con desplazamiento interno; verificar con Playwright selecciones cercanas a los bordes, selección multilínea y resultados largos.
- [x] 3.5 Actualizar posición con scroll y resize y cerrar cuando el anclaje salga del viewport o desaparezca; verificar que la burbuja no queda flotando en una posición anterior ni se reabre al recibir una respuesta atrasada.
- [x] 3.6 Implementar cierre con clic fuera, Escape y eliminación de selección, preservación del rango al usar controles y actualización por nueva selección; verificar con Playwright que «Activar traducción» no pierde el texto y que el texto original de la página permanece intacto.
- [x] 3.7 Añadir controles accesibles mediante teclado y anuncios de estados sin robar foco durante la lectura; verificar activación con teclado, cierre con Escape y nombres y roles accesibles de la interfaz.
- [x] 3.8 Documentar el flujo de selección y las superficies excluidas en README; verificar que los ejemplos de palabra, frase y párrafo corresponden al comportamiento implementado.

## 4. Preferencias y control de activación

- [x] 4.1 Implementar `enabled` en `chrome.storage.local` con valor predeterminado verdadero y un control mínimo en el popup; verificar con Playwright la instalación nueva, el cambio de estado y su persistencia al recrear el contexto del navegador con el mismo perfil.
- [x] 4.2 Leer la preferencia antes de procesar selecciones y sincronizar sus cambios con las páginas abiertas; verificar en dos pestañas que desactivar cierra las burbujas, impide resultados pendientes y que reactivar espera una selección nueva.
- [x] 4.3 Verificar con pruebas del flujo y revisión del almacenamiento y logs que solo se persiste configuración y no hay selecciones, traducciones, URLs ni marcas de preparación; documentar esta conducta y distinguir la descarga del modelo de una traducción remota.

## 5. Validación integral y paquete local

- [x] 5.1 Ejecutar los controles de tipos, compilación y suite Playwright del flujo completo; verificar que todos pasan y que se cubren activación, descarga, errores, estilos, geometría, cambios rápidos de selección, cierre y persistencia.
- [x] 5.2 Validar el paquete de producción en Chrome real con una palabra, una frase y varios párrafos, incluyendo primera activación, selección posterior automática, recarga y error recuperable; actualizar `docs/translator-compatibility.md` con evidencia de resultados nativos diferenciada de los resultados simulados.
- [x] 5.3 Generar el paquete local con WXT e inspeccionar contenido y manifiesto; verificar ausencia de simulaciones, claves, servicios de traducción externos y scripts remotos, y comprobar su carga siguiendo README sin publicar en la tienda.
