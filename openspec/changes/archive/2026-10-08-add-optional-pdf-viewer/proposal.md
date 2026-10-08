# Proposal

## Why

Simi no ofrece traducción al seleccionar texto en el visor PDF integrado de Chrome. Un visor opcional permite leer PDFs de internet y archivos locales con la misma burbuja automática, manteniendo el visor habitual como predeterminado.

## What Changes

- Añadir «Abrir en Simi» para abrir un PDF de internet desde su pestaña y un selector de archivos para PDFs locales.
- Incorporar un visor con páginas, zoom y búsqueda de texto, sin modificar el documento original.
- Mostrar la burbuja automáticamente al terminar una selección con ratón o teclado; mantener la traducción local de inglés a español y la preferencia de activación existente.
- Comunicar errores de carga, documentos sin texto seleccionable e indisponibilidad de traducción sin presentar resultados ficticios.
- Mantener fuera del alcance OCR, traducción del documento completo, edición, registro como visor predeterminado e integración con PDFs incrustados en visores ajenos.

## Capabilities

### New Capabilities

- `pdf-viewer`: apertura explícita de PDFs remotos o locales y lectura dentro del visor opcional de Simi.

### Modified Capabilities

- `selection-translation`: extender las selecciones admitidas al visor PDF propio y conservar la burbuja automática, su posicionamiento y la invalidación de resultados.

## Impact

- Nuevas páginas de extensión para el visor y ampliación del popup para abrir documentos.
- PDF.js empaquetado localmente y adaptación de la captura de selección y la burbuja existentes.
- Reutilización de `TranslationController` y de `storage`; posibles permisos `activeTab` y acceso opcional al origen del PDF, sujetos a la validación técnica.
- Validación en Chrome real de Translator API en la página del visor y de carga de PDFs públicos y con sesión. Los fallos de acceso no se resuelven enviando documentos a servicios externos.
- Nuevas pruebas del flujo PDF y actualización de documentación de compatibilidad.
