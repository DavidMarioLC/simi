# Proposal

## Why

Leer contenido en inglés requiere interrumpir la lectura para consultar una traducción. Una extensión de Chrome que traduzca la selección sobre la propia página permite comprender palabras, frases y párrafos conservando el contexto de lectura.

## What Changes

- Crear la primera versión de una extensión para Chrome de escritorio con WXT, TypeScript, Manifest V3, React y Tailwind CSS.
- Detectar la selección de texto en páginas web admitidas y mostrar automáticamente su traducción de inglés a español en una burbuja encima de la selección, o debajo cuando falte espacio.
- Admitir palabras, frases y párrafos; mostrar estados de carga, traducción y error sin modificar el contenido original.
- Ofrecer «Activar traducción» cuando sea necesario inicializar Translator API mediante una acción del usuario; mostrar el progreso de descarga del modelo y continuar automáticamente en el contexto que ya esté preparado.
- Traducir localmente mediante Translator API, sin backend, claves de API ni envío del texto a servicios externos.
- Cerrar la burbuja con clic fuera o Escape y actualizarla ante una nueva selección sin mostrar resultados atrasados.
- Añadir un popup mínimo para activar o desactivar la extensión y conservar esa preferencia localmente. Este control es una propuesta de alcance para la primera versión.
- Verificar el comportamiento con Playwright y comprobar la integración nativa en Chrome real.

### Scope

La primera versión cubre texto seleccionable en el documento principal de páginas HTTP/HTTPS donde Chrome permita ejecutar la extensión y el usuario haya concedido acceso. Como supuestos de alcance, se excluyen campos de formulario y contenido editable, iframes, el visor PDF integrado, páginas internas de Chrome y Chrome Web Store. También quedan fuera otros idiomas, traducción de páginas completas, OCR, historial, panel lateral, servicios de traducción externos y publicación en la tienda.

## Capabilities

### New Capabilities

- `selection-translation`: selección de palabras, frases y párrafos y presentación contextual de la traducción con un ciclo de vida coherente de la burbuja.
- `local-translation`: disponibilidad, activación, descarga, reutilización y errores de Translator API para inglés a español sin traducción remota.
- `extension-preferences`: control de activación de la extensión y persistencia local de esa preferencia.

### Modified Capabilities

Ninguna. El proyecto contiene únicamente la configuración de OpenSpec y todavía no tiene implementación ni especificaciones principales.

## Impact

- Incorporar configuración de WXT, dependencias de React y Tailwind CSS, tipado de Translator API, content script, popup y pruebas.
- Solicitar acceso a las páginas HTTP/HTTPS admitidas para detectar selecciones automáticamente, además del permiso `storage`. Explicar estos permisos en la documentación.
- Aislar la interfaz de los estilos de cada sitio mediante Shadow DOM.
- Usar Chrome 138 o posterior como mínimo propuesto, acompañado de detección real de la API y de disponibilidad del par `en` → `es`.
- La viabilidad de la traducción automática depende de validar Translator API en el contexto del content script y su activación. La implementación comenzará con una prueba técnica acotada; una incompatibilidad que exija cambiar la experiencia requerirá revisar este diseño.
