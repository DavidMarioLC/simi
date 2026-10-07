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

La extensión SHALL ignorar selecciones vacías, compuestas solo por espacios, de su propia interfaz, de campos de formulario o de contenido editable. Esta versión SHALL limitar la detección al documento principal de páginas HTTP/HTTPS accesibles para la extensión.

#### Scenario: Selección en un campo editable
- **WHEN** el usuario selecciona texto dentro de un campo de formulario o un elemento editable
- **THEN** la extensión no inicia una traducción ni muestra una burbuja

#### Scenario: Selección sin contenido
- **WHEN** la selección no contiene texto distinto de espacios
- **THEN** no se solicita una traducción y se cierra cualquier burbuja anterior

#### Scenario: Superficie excluida
- **WHEN** el usuario intenta seleccionar texto en un iframe, una página interna de Chrome, Chrome Web Store o el visor PDF integrado
- **THEN** esta versión no ofrece el flujo de traducción sobre esa selección

### Requirement: Interfaz accesible y aislada de la página

La burbuja SHALL presentar controles utilizables mediante teclado, estados comprensibles en español y resultados anunciables por tecnologías de asistencia. SHALL conservar su legibilidad y distribución cuando el sitio tenga estilos propios.

#### Scenario: Activación mediante teclado
- **WHEN** el usuario enfoca «Activar traducción» y lo acciona mediante teclado
- **THEN** puede iniciar la preparación del traductor sin usar el ratón

#### Scenario: Página con estilos agresivos
- **WHEN** la página establece estilos globales para botones y texto
- **THEN** la burbuja mantiene controles y traducción legibles con los estilos de la extensión
