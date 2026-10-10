# Spec Delta

## MODIFIED Requirements

### Requirement: Presentación compacta de la burbuja

La burbuja SHALL usar la presentación «Compacta con identidad»: logo de 16 × 16 px, resultado de 15 px y cierre siempre visible, sin cabecera visual de idiomas. SHALL adaptar su ancho al contenido hasta 320 px y al área visible, con relleno de 10 px, radio de 12 px, fondo blanco, borde gris neutro y sombra suave. SHALL aplicar esta presentación en páginas, notebooks admitidos y visor PDF propio, conservando el contexto de idiomas accesible.

#### Scenario: Resultado breve
- **WHEN** se muestra una traducción breve como «Correr» y hay espacio suficiente
- **THEN** logo, resultado y cierre se presentan en una sola fila sin etiqueta visual de idiomas
- **THEN** el ancho se ajusta a esa fila y es inferior a 320 px
- **THEN** el resultado conserva su tamaño de 15 px y el control de cierre permanece visible y utilizable

#### Scenario: Presentación compartida
- **WHEN** se muestra una burbuja en una página admitida, un notebook admitido o el visor PDF propio
- **THEN** se aplica la misma presentación «Compacta con identidad», incluidos logo, distribución, ancho adaptable y relleno

#### Scenario: Estados auxiliares y contenido largo
- **WHEN** la burbuja muestra preparación, descarga, activación, reintento o una traducción extensa
- **THEN** conserva logo y cierre visibles sin recortar mensajes o controles
- **THEN** los mensajes y resultados admiten varias líneas y conservan los saltos de línea del contenido
- **THEN** el progreso y las acciones necesarias se muestran debajo del mensaje, sin restablecer una cabecera de idiomas
- **THEN** los resultados extensos conservan el desplazamiento interno y la burbuja permanece dentro del área visible

#### Scenario: Ventana estrecha y contenido sin espacios
- **WHEN** el área visible es menor que el ancho máximo o el resultado contiene una cadena larga sin espacios
- **THEN** la burbuja se limita al ancho disponible con 8 px de margen a cada lado
- **THEN** el contenido se parte en líneas sin provocar desplazamiento horizontal ni ocultar logo o cierre

#### Scenario: Cambio de tamaño durante la traducción
- **WHEN** un estado breve cambia a un resultado o a un mensaje de activación, descarga o error de dimensiones diferentes
- **THEN** la burbuja adapta su tamaño y se reposiciona junto a la selección dentro del área visible

#### Scenario: Identificación y cierre accesibles
- **WHEN** el usuario navega por la burbuja con teclado o un lector de pantalla
- **THEN** la región conserva el nombre «Traducción al español» y el origen inglés está disponible como descripción accesible
- **THEN** el logo no genera anuncios redundantes y el resultado sigue siendo anunciable
- **THEN** el botón «Cerrar traducción» conserva foco visible y un área interactiva de al menos 26 × 26 px, disponible sin hover
- **THEN** Escape, clic fuera y botón de cierre conservan su comportamiento habitual

### Requirement: Superposición visible sobre el sitio

La burbuja de páginas y notebooks SHALL mostrarse por encima de cabeceras, capas posicionadas y elementos superpuestos del sitio que estén presentes al abrirla. SHALL conservar la presentación «Compacta con identidad» y el anclaje a la selección, sin añadir fondo de pantalla ni bloquear interacciones fuera de sus controles.

#### Scenario: Cabecera superpuesta y contexto de apilamiento
- **WHEN** el sitio tiene una cabecera superpuesta y el documento genera un contexto de apilamiento que limitaría un z-index descendiente
- **THEN** la burbuja aparece completa encima de la cabecera
- **THEN** sus controles reciben los clics en el área donde coinciden con ella

#### Scenario: Elemento del sitio en la capa superior
- **WHEN** el sitio tiene abierto un elemento superpuesto en la capa superior y después se muestra una traducción
- **THEN** la burbuja queda encima de ese elemento sin cerrarlo
- **THEN** el botón de activación y el cierre siguen funcionando

#### Scenario: Apariencia y cierre conservados
- **WHEN** se muestra, actualiza, cierra y vuelve a abrir una traducción
- **THEN** conserva la distribución, relleno, colores, bordes, sombra y tipografía de «Compacta con identidad», con ancho adaptado al contenido vigente y al área visible
- **THEN** sigue la selección con scroll y resize, y se cierra con Escape, clic fuera o su botón
- **THEN** no quedan capas de Simi que intercepten clics tras cerrarse
