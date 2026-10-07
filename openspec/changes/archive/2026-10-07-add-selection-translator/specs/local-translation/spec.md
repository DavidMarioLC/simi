# Spec Delta

## Purpose

Gestionar traducciones locales de inglés a español mediante Translator API, comunicando al usuario la disponibilidad, la preparación de los modelos y los errores recuperables.

## ADDED Requirements

### Requirement: Disponibilidad comprobada en tiempo de ejecución

La extensión SHALL comprobar la presencia de Translator API y la disponibilidad del par inglés a español en el contexto de traducción antes de ofrecer una traducción. SHALL mostrar un mensaje claro cuando la API, el par o el contexto no permitan traducir.

#### Scenario: API ausente
- **WHEN** el usuario selecciona texto y Translator API no está disponible
- **THEN** la burbuja informa que la traducción nativa no está disponible en ese navegador o contexto
- **THEN** no presenta un resultado simulado ni inicia una traducción remota

#### Scenario: Par de idiomas no disponible
- **WHEN** el navegador informa que inglés a español no está disponible
- **THEN** la burbuja explica que ese par no puede utilizarse y no ofrece una activación que se sabe imposible

### Requirement: Preparación mediante una acción explícita

Cuando no pueda preparar el traductor automáticamente, la extensión SHALL ofrecer «Activar traducción». Al accionarlo, SHALL intentar crear el traductor de inglés a español mediante el gesto del usuario y traducir la selección vigente al terminar la preparación.

#### Scenario: Primera preparación
- **WHEN** una selección necesita preparar el traductor y el usuario pulsa «Activar traducción»
- **THEN** la burbuja muestra el estado de preparación y después traduce la selección vigente si la creación termina correctamente

#### Scenario: Activación requerida de nuevo
- **WHEN** el contexto requiere un nuevo gesto para crear el traductor, incluso después de una activación anterior
- **THEN** la extensión vuelve a ofrecer «Activar traducción» sin afirmar que la activación anterior habilitó todos los sitios permanentemente

### Requirement: Progreso de descarga del modelo

La extensión SHALL mostrar un estado de descarga cuando Chrome necesite descargar los recursos de traducción. SHALL actualizar el progreso cuando la API lo proporcione y distinguir descarga, preparación y traducción del texto.

#### Scenario: Recursos descargables
- **WHEN** la creación del traductor inicia una descarga y la API informa progreso
- **THEN** la burbuja muestra «Descargando modelo…» y actualiza el progreso sin mostrar una traducción antes de que el traductor esté preparado

#### Scenario: Descarga en curso
- **WHEN** los recursos ya se están descargando
- **THEN** la extensión muestra el estado de descarga y evita iniciar preparaciones duplicadas en el mismo contexto

### Requirement: Reutilización y traducción automática

La extensión SHALL reutilizar el traductor preparado mientras siga siendo válido en su contexto. Las selecciones posteriores SHALL traducirse automáticamente sin exigir otro clic de activación cuando el traductor pueda utilizarse.

#### Scenario: Segunda selección en el mismo documento
- **WHEN** el traductor sigue preparado y el usuario selecciona otro texto
- **THEN** la traducción comienza automáticamente y no se muestra «Activar traducción»

#### Scenario: Cambio de documento
- **WHEN** el usuario navega a otro documento
- **THEN** la extensión vuelve a comprobar la disponibilidad y preparación sin asumir que existe un traductor válido heredado del documento anterior

### Requirement: Errores recuperables sin resultados incorrectos

La extensión SHALL mostrar errores comprensibles ante fallos de descarga, creación o traducción y permitir un reintento explícito cuando sea recuperable. SHALL evitar ciclos automáticos de reintento y mantener separado un error de un resultado traducido.

#### Scenario: Fallo de descarga
- **WHEN** la descarga del modelo falla
- **THEN** la burbuja informa que no se pudo preparar la traducción y ofrece reintentar mediante una acción del usuario

#### Scenario: Texto rechazado por la API
- **WHEN** Translator API rechaza la traducción de la selección por límites u otra causa
- **THEN** la burbuja informa del fallo sin truncar silenciosamente el texto ni mostrar una traducción parcial como si estuviera completa

### Requirement: Traducción local sin persistencia del contenido

La extensión SHALL procesar el texto con Translator API y SHALL NOT enviarlo a servicios externos, guardarlo como historial o registrarlo en logs. La descarga de recursos gestionada por Chrome SHALL comunicarse como preparación y no como envío del texto a un proveedor remoto.

#### Scenario: Traducción con recursos preparados
- **WHEN** el usuario traduce una selección con un traductor local preparado
- **THEN** la extensión no genera solicitudes de red con el texto ni lo escribe en almacenamiento persistente

#### Scenario: Primera descarga
- **WHEN** Chrome necesita descargar recursos para la traducción
- **THEN** la extensión informa que la primera preparación necesita conectividad y no promete disponibilidad inmediata sin conexión
