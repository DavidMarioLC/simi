# Spec Delta

## ADDED Requirements

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
