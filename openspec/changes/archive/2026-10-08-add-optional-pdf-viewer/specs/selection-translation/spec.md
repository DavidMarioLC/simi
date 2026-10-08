# Spec Delta

## MODIFIED Requirements

### Requirement: Traducción de una selección admitida

La extensión SHALL procesar palabras, frases y párrafos seleccionados en el documento principal de una página admitida o en el visor PDF propio de Simi cuando esté activada. SHALL conservar los saltos de línea del texto enviado al traductor y asumir que el idioma de origen es inglés.

#### Scenario: Selección de una palabra
- **WHEN** el usuario termina de seleccionar una palabra y el traductor está preparado
- **THEN** aparece una burbuja junto a la selección con el estado «Traduciendo…» y después el resultado en español

#### Scenario: Selección de varios párrafos
- **WHEN** el usuario termina de seleccionar texto que abarca frases o varios párrafos
- **THEN** la extensión solicita la traducción del texto completo seleccionado, conservando sus saltos de línea de entrada
- **THEN** presenta el resultado en una burbuja de tamaño acotado con desplazamiento interno cuando sea necesario

#### Scenario: Selección con teclado
- **WHEN** el usuario termina de extender una selección con el teclado
- **THEN** la extensión aplica el mismo flujo de traducción que para una selección con el ratón

#### Scenario: Selección en el visor PDF de Simi
- **WHEN** el usuario termina de seleccionar texto del PDF con ratón o teclado dentro del visor propio
- **THEN** la burbuja aparece automáticamente junto a la selección sin menú contextual ni acción de traducir por cada selección
- **THEN** se aplica la preparación local habitual si el traductor todavía necesita activación

### Requirement: Exclusión de selecciones fuera del alcance

La extensión SHALL ignorar selecciones vacías, compuestas solo por espacios, de su propia interfaz, de campos de formulario o de contenido editable. SHALL limitar la detección al documento principal de páginas HTTP/HTTPS accesibles, al visor incrustado de notebooks `.ipynb` de repositorios de `github.com` y al texto del PDF en el visor propio de Simi. Los demás iframes SHALL permanecer excluidos.

#### Scenario: Selección en un campo editable
- **WHEN** el usuario selecciona texto dentro de un campo de formulario o un elemento editable
- **THEN** la extensión no inicia una traducción ni muestra una burbuja

#### Scenario: Selección sin contenido
- **WHEN** la selección no contiene texto distinto de espacios
- **THEN** no se solicita una traducción y se cierra cualquier burbuja anterior

#### Scenario: Superficie excluida
- **WHEN** el usuario intenta seleccionar texto en un iframe ajeno al visor admitido de notebooks de GitHub, una página interna de Chrome, Chrome Web Store o el visor PDF integrado de Chrome
- **THEN** esta versión no ofrece el flujo de traducción sobre esa selección

#### Scenario: Controles del visor propio
- **WHEN** el usuario selecciona texto de la barra de herramientas o del campo de búsqueda del visor PDF de Simi
- **THEN** la extensión no inicia traducciones sobre esos controles

## ADDED Requirements

### Requirement: Geometría y ciclo de vida de la selección PDF

La burbuja del visor PDF SHALL seguir una parte visible de la selección al desplazar o cambiar el zoom, dentro del área visible. Si la selección desaparece, queda fuera del área visible o sus rangos dejan de ser válidos por un nuevo renderizado, SHALL cerrarse y descartar resultados pendientes sin reabrirse automáticamente.

#### Scenario: Desplazamiento y zoom con selección vigente
- **WHEN** cambia el desplazamiento o el zoom y la selección conserva rangos válidos visibles
- **THEN** la burbuja actualiza su posición junto al texto seleccionado y permanece dentro del área visible

#### Scenario: Sustitución de la capa de texto
- **WHEN** el visor vuelve a renderizar una página y los rangos de la selección dejan de ser válidos
- **THEN** la burbuja se cierra y ninguna traducción pendiente vuelve a abrirla
- **THEN** una nueva selección sobre la página renderizada funciona con normalidad

#### Scenario: Selección que abarca páginas
- **WHEN** una selección válida abarca texto de varias páginas renderizadas
- **THEN** Simi traduce el texto completo seleccionado y ancla la burbuja a una parte visible de la selección

### Requirement: Preferencia y cierre aplicables al visor PDF

El visor PDF SHALL respetar la preferencia de activación existente y cerrar la burbuja con Escape, clic fuera o su botón de cierre. SHALL descartar resultados de selecciones anteriores y al cambiar de documento, cerrar o desactivar Simi. Al reactivar SHALL esperar una nueva selección.

#### Scenario: Desactivación durante una traducción PDF
- **WHEN** el usuario desactiva Simi mientras se traduce una selección del PDF
- **THEN** se cierra la burbuja y el resultado pendiente no aparece
- **THEN** la lectura del PDF sigue disponible

#### Scenario: Resultado obsoleto y cierre
- **WHEN** el usuario selecciona otro texto o cierra la burbuja mientras una traducción está pendiente
- **THEN** el resultado anterior no sustituye el de la nueva selección ni reabre la burbuja cerrada

#### Scenario: Reactivación en un visor abierto
- **WHEN** el usuario vuelve a activar Simi
- **THEN** solo una nueva selección vuelve a mostrar la burbuja

### Requirement: Liberación de recursos de traducción de pestañas inactivas

Simi SHALL liberar su traductor local y abortar preparaciones pendientes cuando su pestaña se oculta, la extensión se desactiva o el contexto se invalida. SHALL reutilizarlo entre selecciones mientras la pestaña sigue activa y descartar resultados o instancias tardías de preparaciones suspendidas.

#### Scenario: Cambio de pestaña y regreso al documento
- **WHEN** el usuario deja una pestaña donde Simi preparó un traductor
- **THEN** se cierra la burbuja y se liberan sus recursos de traducción
- **WHEN** vuelve al documento y realiza una nueva selección
- **THEN** Simi comprueba y prepara de nuevo el traductor, automáticamente si dispone del gesto requerido

#### Scenario: Indisponibilidad temporal del servicio local
- **WHEN** Chrome devuelve indisponibilidad del traductor inglés a español
- **THEN** la burbuja ofrece «Reintentar» y orientación para recuperar recursos
- **WHEN** el usuario reintenta y Chrome informa disponibilidad
- **THEN** Simi continúa con la selección capturada
- **THEN** no fuerza una creación cuando Chrome todavía informa indisponibilidad
