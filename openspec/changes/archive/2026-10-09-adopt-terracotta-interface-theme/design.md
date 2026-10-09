# Design

## Context

El popup y la burbuja usan utilidades Tailwind índigo; el visor PDF utiliza valores hexadecimales propios para marca, enlaces y foco. Las tres superficies cargan `assets/tailwind.css`, también la burbuja dentro de un shadow root. El logo ya contiene la paleta elegida y no necesita modificación.

La motivación y el alcance están en `proposal.md`. Se incluye este diseño porque el cambio cruza estilos Tailwind, CSS del visor y estilos encapsulados en páginas externas.

## Goals / Non-Goals

**Goals:**
- Mantener una única definición de colores de interfaz, disponible tanto para Tailwind como para CSS convencional y el shadow root.
- Preservar legibilidad, foco, disposición y aislamiento de estilos durante el cambio visual.

**Non-Goals:**
- Cambiar la geometría o los PNG del logo, el comportamiento de traducción, preferencias o navegación.
- Recolorear páginas PDF, selecciones o resaltados de búsqueda gestionados por PDF.js, ni implementar modo oscuro.

## Decisions

1. **Variables de marca compartidas.** Añadir `assets/brand.css`, importado desde `assets/tailwind.css`, con variables prefijadas `--simi-` definidas en `:root` y `:host`. Exponerlas a utilidades Tailwind mediante alias de tema y utilizarlas directamente desde `entrypoints/pdf/style.css`. Esta fuente evita repetir hexadecimales entre componentes y permite que la burbuja resuelva sus valores dentro del shadow root. Evitar reglas globales de elementos en este archivo.
2. **Roles y estados explícitos.** Proponer `brand: #C65335`, `action: #A8432A`, `action-hover: #923922`, `action-active: #7C301D`, `soft: #F5F0E8`, `ink: #191919` y `focus: #A8432A`. Los valores de estados oscuros son decisiones de implementación propuestas y se verifican antes de finalizar. Usar blanco para texto de acciones primarias. El terracota del logo con blanco tiene aproximadamente 4,48:1 de contraste; la variante oscura alcanza aproximadamente 6:1 y será el fondo de botones con texto. No usar el acento base como texto pequeño sobre crema.
3. **Aplicación por superficie.** En popup, fondo crema, acción primaria oscura, interruptor activo terracota y foco oscuro. En burbuja, mantener fondo de lectura blanco, con acciones oscuras, progreso terracota y foco oscuro. En PDF, aplicar crema al fondo exterior y mensajes suaves, marca y enlaces terracota oscuro, y estados cálidos de interacción en sus controles; conservar barra y campos blancos. Mantener estados semánticos de error y aviso, y grises de controles inactivos. Los hover de controles secundarios usan fondo crema con texto oscuro.
4. **Límite de encapsulado.** No sustituir utilidades de la paleta global ni aplicar estilos a `body` de páginas externas. Los estilos de burbuja continúan encapsulados por la infraestructura WXT existente. Las reglas de PDF deben apuntar a controles propios del visor sin recolorear el lienzo o capas de PDF.js.
5. **Verificación proporcional.** Revisar colores computados, contraste y capturas de las tres superficies en estados normal, hover, activo, foco y deshabilitado; comprobar también progreso y avisos. Reutilizar las pruebas de extensión y PDF para detectar regresiones. Solo agregar una prueba de integración específica si hace falta verificar un problema real de resolución de variables o encapsulado; evitar pruebas que repitan valores CSS sin observar comportamiento.

## Risks / Trade-offs

- Variables ausentes o heredadas desde la página externa → definirlas en el host del shadow root y comprobar estilos computados en la prueba existente con CSS externo agresivo.
- Contraste insuficiente en hover o superficies crema → calcular los pares de colores reales de todos los estados afectados, sin aplicar opacidad a texto habilitado.
- Reglas genéricas del visor que alcancen PDF.js → limitar los nuevos estilos a sus controles propios y revisar documentos con colores y resaltados existentes.
- Apariencia de error confundida con terracota → conservar texto y señales de estado, además de sus colores semánticos diferenciados.

## Migration Plan

Introducir variables y aliases, actualizar popup y burbuja, y después ajustar CSS del visor. Compilar, ejecutar las pruebas pertinentes y recargar la extensión para revisar el conjunto. Documentar roles de color y estados en `docs/branding.md`. La reversión restaura clases y estilos anteriores; no requiere migración de datos.
