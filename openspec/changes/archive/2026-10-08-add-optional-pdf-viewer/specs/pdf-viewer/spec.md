# Spec Delta

## Purpose

Permitir leer PDFs de internet y archivos locales en un visor opcional de Simi dentro del navegador, con texto seleccionable y controles básicos de lectura, conservando el visor predeterminado del usuario.

## ADDED Requirements

### Requirement: Apertura explícita de un PDF de internet

Simi SHALL ofrecer «Abrir en Simi» desde el popup para abrir un PDF HTTP/HTTPS de la pestaña activa en una pestaña del visor propio. SHALL conservar la pestaña original y SHALL NOT registrarse como visor predeterminado ni redirigir automáticamente documentos.

#### Scenario: PDF remoto accesible
- **WHEN** el usuario acciona «Abrir en Simi» desde una pestaña con un PDF HTTP/HTTPS accesible
- **THEN** el visor de Simi carga el documento y permite leer y seleccionar su texto
- **THEN** la pestaña original permanece disponible

#### Scenario: Navegación habitual sin apertura explícita
- **WHEN** el usuario abre un PDF sin accionar «Abrir en Simi»
- **THEN** Simi no sustituye el visor elegido por el navegador

#### Scenario: Pestaña no admitida
- **WHEN** la pestaña activa usa una URL interna o no contiene un PDF remoto admitido
- **THEN** Simi impide la apertura o informa claramente que no puede cargar ese documento

### Requirement: Apertura de un archivo local

Simi SHALL ofrecer acceso al visor desde el popup y un selector de archivos en el visor para abrir PDFs locales elegidos por el usuario. SHALL leer el archivo en el dispositivo sin requerir acceso general al sistema de archivos ni subirlo a un servicio externo.

#### Scenario: Archivo local seleccionado
- **WHEN** el usuario abre el visor, elige un PDF local y confirma el selector
- **THEN** Simi muestra el documento y permite seleccionar su texto
- **THEN** no sube el archivo a un servicio externo

#### Scenario: Selector cancelado
- **WHEN** el usuario cancela el selector de archivos
- **THEN** el documento vigente permanece intacto y no aparece un error de carga

### Requirement: Controles de lectura

El visor SHALL ofrecer navegación por páginas, indicador de página actual y total, zoom y búsqueda de texto. SHALL conservar el contenido original y ofrecer controles utilizables mediante teclado con etiquetas en español.

#### Scenario: Navegación y zoom
- **WHEN** el usuario cambia de página o ajusta el zoom
- **THEN** el visor actualiza el documento y sus indicadores sin modificar el PDF original

#### Scenario: Búsqueda de texto
- **WHEN** el usuario busca un texto presente en el PDF
- **THEN** el visor permite localizar y recorrer sus coincidencias
- **WHEN** no encuentra coincidencias
- **THEN** muestra un estado comprensible de ausencia de resultados

#### Scenario: Controles mediante teclado
- **WHEN** el usuario recorre los controles con Tab y los acciona mediante teclado
- **THEN** puede abrir archivos, navegar, ajustar el zoom y utilizar la búsqueda

### Requirement: Carga y errores explícitos

El visor SHALL distinguir carga, documento preparado y fallo. SHALL informar de permisos denegados, acceso remoto fallido, archivos inválidos y documentos que no puede abrir, permitiendo elegir otro archivo o volver al original. SHALL NOT eludir autenticación ni mostrar un documento parcial como completo.

#### Scenario: Acceso remoto denegado
- **WHEN** el sitio exige una sesión o un permiso que Simi no puede utilizar, o rechaza la descarga
- **THEN** el visor informa que no pudo acceder al PDF
- **THEN** ofrece abrir el original o elegir un archivo local descargado por el usuario

#### Scenario: Documento inválido o protegido no admitido
- **WHEN** el archivo no es un PDF válido o requiere protección que el visor no puede resolver
- **THEN** Simi muestra un error comprensible y permite elegir otro documento

#### Scenario: Documento sin texto seleccionable
- **WHEN** una página no contiene texto seleccionable
- **THEN** el visor permite leerla y explica que su traducción por selección no está disponible
- **THEN** no presenta OCR ni traducción del documento completo

### Requirement: Contenido limitado a la sesión del visor

Simi SHALL mantener documentos, URLs de origen, selecciones y traducciones solo durante la sesión necesaria para el visor, sin guardarlos como historial ni registrarlos en logs. SHALL liberar el documento anterior y descartar su selección al cambiar de archivo o cerrar el visor.

#### Scenario: Sustitución del archivo
- **WHEN** el usuario abre otro PDF en el mismo visor
- **THEN** se descarta la selección del anterior y sus resultados pendientes no aparecen en el nuevo documento

#### Scenario: Inspección de persistencia
- **WHEN** el usuario abre y traduce PDFs remotos y locales
- **THEN** Simi no escribe el documento, la URL de origen, las selecciones ni las traducciones en almacenamiento persistente o logs
- **THEN** las preferencias existentes siguen conservándose
