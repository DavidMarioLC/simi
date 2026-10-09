# selection-translation Specification

## Purpose

Permitir la lectura de contenido en inglés mostrando una traducción al español junto a palabras, frases y párrafos seleccionados, sin abandonar ni alterar la página original.

## Requirements

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


### Requirement: Posición visible de la burbuja

La burbuja SHALL colocarse encima de la selección cuando exista espacio suficiente y debajo cuando no exista. SHALL permanecer dentro del área visible y actualizar su posición al desplazarse o cambiar el tamaño de la ventana; SHALL cerrarse si la selección deja de ser visible.

#### Scenario: Selección cerca del borde superior
- **WHEN** la selección está demasiado cerca del borde superior para mostrar la burbuja completa encima
- **THEN** la burbuja aparece debajo, ajustada al espacio visible

#### Scenario: Selección cerca del borde lateral
- **WHEN** el anclaje de la selección está cerca del borde derecho o izquierdo
- **THEN** la posición horizontal se ajusta para que la burbuja no quede fuera de la ventana

#### Scenario: Desplazamiento de la página
- **WHEN** el usuario desplaza la página y la selección sigue visible
- **THEN** la burbuja actualiza su posición junto a la selección
- **WHEN** la selección sale del área visible
- **THEN** la burbuja se cierra

### Requirement: Cierre y conservación del contenido

La extensión SHALL cerrar la burbuja con Escape, clic fuera o eliminación de la selección. SHALL mantener el texto original sin sustituirlo y permitir utilizar sus propios controles sin perder la selección capturada ni cerrar la burbuja por error.

#### Scenario: Cierre explícito
- **WHEN** el usuario pulsa Escape o hace clic fuera de la burbuja
- **THEN** la burbuja desaparece y el contenido original permanece intacto
- **THEN** la misma selección no vuelve a abrirla hasta que el usuario realiza una nueva selección

#### Scenario: Interacción con la activación
- **WHEN** el usuario pulsa «Activar traducción» dentro de la burbuja
- **THEN** la selección capturada permanece disponible para traducir y la burbuja continúa abierta

### Requirement: Solo la selección vigente produce resultados visibles

La extensión SHALL actualizar la burbuja al realizar una nueva selección y descartar resultados de solicitudes anteriores. Una traducción pendiente SHALL NOT reabrir una burbuja cerrada ni mostrar resultados si la extensión ha sido desactivada.

#### Scenario: Resultado anterior más lento
- **WHEN** el usuario selecciona un texto B mientras el texto A se está traduciendo y el resultado A llega después
- **THEN** la burbuja muestra exclusivamente el estado o resultado correspondiente al texto B

#### Scenario: Cierre durante la traducción
- **WHEN** el usuario cierra la burbuja antes de recibir el resultado
- **THEN** el resultado pendiente no vuelve a mostrar la burbuja

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


### Requirement: Interfaz accesible y aislada de la página

La burbuja SHALL presentar controles utilizables mediante teclado, estados comprensibles en español y resultados anunciables por tecnologías de asistencia. SHALL conservar su legibilidad y distribución cuando el sitio tenga estilos propios.

#### Scenario: Activación mediante teclado
- **WHEN** el usuario enfoca «Activar traducción» y lo acciona mediante teclado
- **THEN** puede iniciar la preparación del traductor sin usar el ratón

#### Scenario: Página con estilos agresivos
- **WHEN** la página establece estilos globales para botones y texto
- **THEN** la burbuja mantiene controles y traducción legibles con los estilos de la extensión

### Requirement: Selección en notebooks renderizados de GitHub

La extensión SHALL ofrecer traducción local de inglés a español para palabras, frases y párrafos seleccionados en el visor renderizado de un notebook `.ipynb` de `github.com`, mediante ratón o teclado, cuando esté activada y el contexto de traducción lo permita. SHALL conservar el texto original y los saltos de línea de entrada.

#### Scenario: Selección de texto renderizado
- **WHEN** el usuario selecciona un párrafo de una celda Markdown en el visor incrustado y termina la selección
- **THEN** aparece la burbuja habitual con la traducción de la selección, previa activación si es necesaria
- **THEN** el notebook permanece intacto

#### Scenario: Selección con teclado y entre celdas
- **WHEN** el usuario extiende con teclado una selección de texto no editable que abarca varios párrafos o celdas del mismo documento del visor
- **THEN** se traduce el texto completo seleccionado conservando los saltos de línea de entrada

#### Scenario: Traducción no disponible
- **WHEN** la API o la política del contexto donde se ejecuta la traducción impide traducir
- **THEN** la burbuja muestra el estado de indisponibilidad habitual sin enviar el texto a un servicio externo

### Requirement: Burbuja compartida entre página y notebook

La extensión SHALL mantener una única burbuja visible para la selección vigente de la página o del notebook. SHALL posicionarla junto a una parte visible de la selección dentro del área visible del navegador, actualizarla al desplazar la página o el visor y cerrarla cuando la selección deje de ser visible, se elimine o desaparezca su documento.

#### Scenario: Desplazamiento del contenedor y del visor
- **WHEN** el usuario desplaza la página principal o el documento del notebook
- **THEN** la burbuja sigue la selección mientras sea visible
- **THEN** se cierra cuando la selección queda fuera del área visible del visor o del navegador

#### Scenario: Cambio de documento seleccionado
- **WHEN** una traducción del notebook está pendiente y el usuario realiza una selección en la página principal, o viceversa
- **THEN** solo la selección nueva produce resultados visibles

#### Scenario: Cierre desde cualquiera de los documentos
- **WHEN** el usuario pulsa Escape en la página o en el notebook, hace clic fuera de la burbuja o desactiva Simi
- **THEN** se cierra la burbuja y ninguna traducción pendiente la vuelve a abrir

#### Scenario: Navegación o sustitución del visor
- **WHEN** GitHub cambia de archivo, recarga o sustituye el iframe del notebook
- **THEN** se descarta la selección anterior y sus resultados pendientes
- **THEN** las selecciones del nuevo notebook admitido funcionan sin conservar estado del anterior

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

### Requirement: Presentación compacta de la burbuja

La burbuja SHALL mostrar un logo de 22 × 22 px y una etiqueta de idiomas de 11 px separados por 6 px. SHALL tener 12 px de relleno interior y 8 px entre la cabecera y el contenido. SHALL conservar el resultado a 15 px y el ancho nominal de 320 px limitado al área visible. Esta presentación SHALL ser uniforme en páginas, notebooks admitidos y el visor PDF propio.

#### Scenario: Resultado breve
- **WHEN** se muestra la traducción de una palabra
- **THEN** la burbuja presenta las dimensiones compactas del logo, etiqueta, relleno y separación indicadas
- **THEN** el resultado conserva su tamaño de 15 px y el control de cierre permanece utilizable

#### Scenario: Presentación compartida
- **WHEN** se muestra una burbuja en una página admitida, un notebook admitido o el visor PDF propio
- **THEN** se aplica la misma presentación compacta de cabecera y relleno interior

#### Scenario: Estados auxiliares y contenido largo
- **WHEN** la burbuja muestra preparación, descarga, activación, reintento o una traducción extensa
- **THEN** conserva la cabecera y el relleno compactos sin recortar mensajes o controles
- **THEN** los resultados extensos conservan el desplazamiento interno y la burbuja permanece dentro del área visible
