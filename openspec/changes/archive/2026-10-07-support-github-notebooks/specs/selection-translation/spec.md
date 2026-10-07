# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
