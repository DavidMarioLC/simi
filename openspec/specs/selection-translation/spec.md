# selection-translation Specification

## Purpose

Permitir la lectura de contenido en inglés mostrando una traducción al español junto a palabras, frases y párrafos seleccionados, sin abandonar ni alterar la página original.

## Requirements

### Requirement: Traducción de una selección admitida

La extensión SHALL procesar palabras, frases y párrafos seleccionados en el documento principal de una página admitida cuando esté activada. SHALL conservar los saltos de línea del texto enviado al traductor y asumir que el idioma de origen es inglés.

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

La extensión SHALL ignorar selecciones vacías, compuestas solo por espacios, de su propia interfaz, de campos de formulario o de contenido editable. SHALL limitar la detección al documento principal de páginas HTTP/HTTPS accesibles y al visor incrustado de notebooks `.ipynb` de repositorios de `github.com`. Los demás iframes SHALL permanecer excluidos.

#### Scenario: Selección en un campo editable
- **WHEN** el usuario selecciona texto dentro de un campo de formulario o un elemento editable
- **THEN** la extensión no inicia una traducción ni muestra una burbuja

#### Scenario: Selección sin contenido
- **WHEN** la selección no contiene texto distinto de espacios
- **THEN** no se solicita una traducción y se cierra cualquier burbuja anterior

#### Scenario: Superficie excluida
- **WHEN** el usuario intenta seleccionar texto en un iframe ajeno al visor admitido de notebooks de GitHub, una página interna de Chrome, Chrome Web Store o el visor PDF integrado
- **THEN** esta versión no ofrece el flujo de traducción sobre esa selección

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
