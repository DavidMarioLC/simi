# Tasks

## 1. Captura del visor y comunicación interna

- [x] 1.1 Crear el adaptador de identificación del notebook activo y del iframe `notebooks.githubusercontent.com/view/ipynb`; verificar casos admitidos y rechazados con URLs del visor comprobado, incluyendo un visor incrustado fuera de GitHub y uno abierto directamente.
- [x] 1.2 Añadir el content script limitado al visor para capturar selecciones no editables, rectángulos y eventos de cierre; verificar selección por ratón y teclado, saltos de línea, exclusión de campos y ausencia de burbuja propia en pruebas del paquete compilado.
- [x] 1.3 Añadir el relay de runtime con registro por pestaña, frame y documento, validación de mensajes y recuperación tras reinicio; verificar entrega al principal correcto y rechazo de emisores ajenos, registros obsoletos y mensajes malformados.
- [x] 1.4 Documentar el alcance de inyección y la comunicación efímera en `docs/translator-compatibility.md`; verificar que el manifest compilado mantiene coincidencias limitadas y no añade permisos de historial ni mensajes externos.

## 2. Integración de selección, traducción y burbuja

- [x] 2.1 Adaptar el anclaje de `selection.content.tsx` a selecciones locales y remotas, reutilizando `TranslationController` en el principal; verificar traducción simulada de un párrafo del notebook, activación desde la burbuja y original intacto.
- [x] 2.2 Convertir y recortar rectángulos según la posición, el borde y la escala del iframe; verificar con pruebas de geometría los bordes de ventana, scroll principal e interno, resize, contenedores que recortan y cierre al ocultarse la selección.
- [x] 2.3 Integrar revisiones y cierres entre documentos, preferencias y sustitución dinámica del visor; verificar una única burbuja, resultados atrasados, Escape y clic fuera desde ambos documentos, navegación entre notebooks y desactivación durante traducción.
- [x] 2.4 Añadir casos de API ausente o denegada en el principal, e indisponibilidad en el visor con API disponible en el principal; verificar que solo se usa el contexto principal y que se muestra el estado habitual cuando ese contexto no permite traducir.
- [x] 2.5 Actualizar README con uso en notebooks de GitHub, activación, recarga de la extensión y límites; revisar que distingue esta excepción de los demás iframes y conserva las garantías de privacidad.

## 3. Verificación del flujo completo

- [x] 3.1 Ejecutar `npm run check:ci` y `openspec validate support-github-notebooks --strict`; verificar ausencia de regresiones en traducción del documento principal, iframes excluidos y preferencias.
- [x] 3.2 Comprobar en Chrome real el notebook público citado en el diseño, seleccionando texto Markdown con ratón y teclado, desplazando y navegando a otro notebook; registrar navegador, disponibilidad, activación y resultados reales en la documentación de compatibilidad, distinguiéndolos de simulaciones y dejando explícita cualquier limitación observada.
