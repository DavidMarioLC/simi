# Spec Delta

## ADDED Requirements

### Requirement: Superposición visible sobre el sitio

La burbuja de páginas y notebooks SHALL mostrarse por encima de cabeceras, capas posicionadas y elementos superpuestos del sitio que estén presentes al abrirla. SHALL conservar su presentación compacta y anclaje a la selección, sin añadir fondo de pantalla ni bloquear interacciones fuera de sus controles.

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
- **THEN** conserva ancho, relleno, colores, bordes, sombra y tipografía existentes
- **THEN** sigue la selección con scroll y resize, y se cierra con Escape, clic fuera o su botón
- **THEN** no quedan capas de Simi que intercepten clics tras cerrarse
