# Spec Delta

## ADDED Requirements

### Requirement: Paleta terracota en controles propios

Los controles propios de Simi SHALL usar una paleta terracota coherente en popup, burbuja y visor PDF. El acento principal SHALL ser `#C65335`; botones primarios con texto blanco y enlaces SHALL usar `#A8432A`. El interruptor activo, el progreso y el foco SHALL utilizar tonos de esta paleta en lugar de índigo.

#### Scenario: Uso de las tres superficies
- **WHEN** se abren el popup, una burbuja y el visor PDF
- **THEN** sus acciones y acentos de marca utilizan la misma familia terracota
- **THEN** activar o desactivar el interruptor permite distinguir ambos estados

#### Scenario: Preparación del traductor
- **WHEN** la burbuja muestra activación, reintento o descarga del modelo
- **THEN** la acción primaria y la barra de progreso usan la paleta terracota

### Requirement: Superficies cálidas y lectura neutra

Simi SHALL usar crema `#F5F0E8` para superficies suaves propias y mantener blanco y texto oscuro en áreas de lectura. El tema SHALL conservar los colores del contenido PDF, los estilos de páginas visitadas y la diferenciación de errores y avisos respecto del acento de marca.

#### Scenario: Lectura de un PDF
- **WHEN** se abre un documento en el visor de Simi
- **THEN** las superficies suaves del visor usan crema y las páginas conservan su apariencia original
- **THEN** los enlaces y acentos de controles propios usan terracota

#### Scenario: Burbuja en una página externa
- **WHEN** se muestra una traducción en una página con sus propios estilos
- **THEN** la traducción conserva un área de lectura blanca y texto oscuro
- **THEN** el tema de Simi no altera los colores de la página externa

### Requirement: Legibilidad de acentos interactivos

El texto de botones y enlaces afectado por el tema SHALL mantener un contraste mínimo de 4,5:1 con su fondo en estados normal, hover y activo habilitados. Los controles SHALL conservar un foco visible de teclado con contraste mínimo de 3:1 respecto de superficies adyacentes, y los controles deshabilitados SHALL seguir siendo distinguibles.

#### Scenario: Acción primaria habilitada
- **WHEN** se observa o se apunta a un botón primario habilitado
- **THEN** el texto blanco mantiene al menos 4,5:1 de contraste con el fondo terracota correspondiente

#### Scenario: Navegación con teclado
- **WHEN** se recorre el popup, la burbuja o los controles del visor con Tab
- **THEN** el control enfocado tiene un indicador visible de la familia terracota con al menos 3:1 de contraste
- **THEN** las acciones deshabilitadas conservan su comportamiento y presentación diferenciada
