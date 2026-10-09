# extension-branding Specification

## Purpose

Permitir reconocer Simi mediante una identidad visual peruana y moderna, coherente entre el navegador y las superficies que identifican sus traducciones.

## Requirements

### Requirement: Símbolo terracota coherente

Simi SHALL utilizar una «S» geométrica escalonada inspirada en textiles andinos, terracota sobre crema, sin texto dentro del icono. Su centro SHALL estar limpio, sin puntas ni cortes accidentales, y las versiones SHALL conservar la misma silueta y proporciones.

#### Scenario: Comparación de versiones
- **WHEN** se comparan los iconos del navegador, el popup y la burbuja
- **THEN** muestran la misma «S» escalonada terracota sobre crema
- **THEN** el centro no presenta la punta ni la costura accidental de la primera imagen conceptual

### Requirement: Identificación en el navegador

La extensión SHALL proporcionar iconos PNG cuadrados de 16, 32, 48 y 128 píxeles para su instalación y su acción en el navegador. El símbolo SHALL conservar separación visual entre sus trazos en tamaños pequeños.

#### Scenario: Extensión compilada e instalada
- **WHEN** se instala el paquete compilado y se fija Simi en la barra del navegador
- **THEN** la barra y el administrador de extensiones muestran su icono propio sin recursos faltantes
- **THEN** las representaciones de 16 y 32 píxeles permiten distinguir la silueta y sus espacios interiores

### Requirement: Identidad local en popup y burbuja

El popup y la burbuja SHALL mostrar el símbolo propio en lugar de la letra decorativa genérica. La marca SHALL cargarse desde recursos incluidos en la extensión y SHALL NOT añadir anuncios redundantes para lectores de pantalla.

#### Scenario: Apertura sin conexión
- **WHEN** se abre el popup o una burbuja con un resultado disponible sin conexión a internet
- **THEN** el símbolo aparece usando recursos locales
- **THEN** los nombres accesibles de los controles y de la región de traducción se conservan
