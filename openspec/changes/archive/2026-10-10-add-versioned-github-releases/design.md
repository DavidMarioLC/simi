# Design

## Context

Ver `proposal.md` para la motivación. `package.json` y las dos referencias de versión raíz del lockfile están en `0.1.0`; WXT genera el manifiesto a partir de ese valor. Ya existen `build`, `zip`, `typecheck`, `test` y `check:ci`. Las pruebas de extensión cargan `.output/chrome-mv3`, y las simulaciones de Translator API se inyectan desde las pruebas, fuera del código de producción.

El único workflow usa Ubuntu, Node.js 24, `npm ci` y Chromium de Playwright. Sus artefactos son informes temporales, no entregas. No hay tags locales ni changelog. El README explica instalación descomprimida y probes nativos manuales.

Se crea este diseño porque la coordinación de tags, versiones, empaquetado y publicación necesita decisiones explícitas antes de implementar.

## Goals / Non-Goals

**Goals:**
- Asociar cada entrega con un único tag, commit, versión, bloque de notas y ZIP compilado.
- Ejecutar controles antes de publicar y detectar inconsistencias sin consumir permisos de escritura.
- Mantener un proceso comprensible para un repositorio con una sola extensión.

**Non-Goals:**
- Inferir automáticamente la siguiente versión desde Conventional Commits o publicar por cada push de código.
- Convertir CI en evidencia de traducción con modelos reales o crear un canal de actualización automática para instalaciones descomprimidas.
- Publicar una entrega como efecto secundario de implementar este cambio.

## Decisions

### 1. Versiones preparadas en el repositorio

Usar tres enteros compatibles con Chrome, sin sufijos ni ceros iniciales, entre 0 y 65535. `package.json` es la fuente; el lockfile debe coincidir en su campo raíz y en `packages[""].version`. No definir otra versión manual en `wxt.config.ts`.

Documentar PATCH para correcciones, MINOR para funcionalidades y, durante `0.x`, MINOR para incompatibilidades señaladas en las notas; `1.0.0` expresa la decisión de ofrecer una base estable. Cambios solo de documentación o herramientas pueden acumularse sin nueva versión del producto. Una versión puede contener varios commits.

El mantenedor prepara y revisa la versión antes de etiquetar. Alternativa: release-please o semantic-release. Se difiere para evitar dependencias y automatización adicionales antes de establecer la primera entrega.

### 2. Changelog explícito como fuente de notas

Crear `CHANGELOG.md` con una sección pendiente y bloques inequívocos `## [X.Y.Z]`. Las fechas son opcionales: no atribuir una fecha de publicación al estado inicial todavía no publicado. El primer bloque `0.1.0` resume traducción local, notebooks, visor PDF, identidad visual y correcciones presentes; no asigna versiones retrospectivas a commits.

Un script Node.js sin dependencias valida un bloque único, existente y no vacío para la versión solicitada, y extrae su contenido hasta el siguiente encabezado del mismo nivel. No usar interpolaciones shell para construir notas: escribirlas en un archivo temporal y pasarlo a `gh release create --notes-file`.

Alternativa: notas automáticas desde commits. Se descarta inicialmente porque incluyen cambios internos y no necesariamente explican lo que recibe el usuario.

### 3. Publicación deliberada mediante tag

Añadir `.github/workflows/release.yml`, separado del CI general, activado por push de tags `v*`. El patrón del evento es amplio; la validación debe aceptar únicamente `vX.Y.Z` y comprobar coincidencia exacta con las versiones del commit etiquetado. Descargar ese commit, no la punta actual de una rama. Serializar ejecuciones del mismo tag sin cancelar una publicación en curso.

Usar dos jobs: validación/empaquetado con `contents: read`, y publicación dependiente con `contents: write`. El primero instala dependencias con el lockfile y Chromium, ejecuta `typecheck`, `zip` y `test` en ese orden, reutilizando los controles que agrupa `check:ci` sin repetir la compilación o la suite. Las pruebas se ejecutan sobre la salida final de `wxt zip`.

Comprobar que existe exactamente el ZIP esperado para Chrome y que su manifiesto declara la versión objetivo; verificar estructura apta para carga descomprimida y recursos de PDF.js e iconos. Transportar únicamente ese ZIP y las notas al job de publicación mediante un artefacto de la ejecución. Nunca usar un glob que seleccione archivos de versiones o navegadores distintos.

Publicar mediante GitHub CLI con el `GITHUB_TOKEN` de la ejecución y `--verify-tag`, con título `Simi X.Y.Z` y notas extraídas del changelog. Los ZIP de código fuente que GitHub ofrece automáticamente no sustituyen el ZIP compilado.

Una Release existente para ese tag detiene la publicación; no sobrescribir ni añadir artefactos a una entrega publicada. Distinguir ausencia de Release de errores de red o permisos: estos últimos deben fallar explícitamente. El workflow necesita que las políticas del repositorio permitan escritura con `GITHUB_TOKEN`; no requiere secretos de Chrome ni credenciales npm.

### 4. Primera entrega y recuperación

Conservar `0.1.0` durante esta implementación. Tras integrar y validar el cambio, el mantenedor podrá crear un tag anotado `v0.1.0` sobre el commit elegido y enviarlo explícitamente; este paso constituye la decisión de publicar. No recrear el pasado con tags inventados.

Si un lanzamiento falla antes de crear la Release, corregir el entorno o reejecutar los jobs fallidos sobre el mismo tag cuando proceda. Si necesita cambios de código, preparar una versión nueva. Si la publicación queda parcialmente creada, inspeccionar y resolver ese estado de forma explícita; el workflow no la sobrescribe en un reintento.

El README explica descargar el ZIP compilado, descomprimir, cargar la carpeta en modo desarrollador y recargar extensión y pestañas al actualizar. Releases de GitHub no actualizan automáticamente esas instalaciones. Una corrección de una versión publicada recibe otra versión; no mover tags publicados.

## Risks / Trade-offs

- [Versiones o notas desalineadas] --> Validar formato, lockfile, tag, notas y manifiesto del ZIP antes de publicar.
- [ZIP distinto del build probado] --> Empaquetar antes de ejecutar la suite y publicar el mismo archivo validado, sin recompilar en el segundo job.
- [Modelo nativo no disponible en CI] --> Conservar probes manuales; las notas no deben presentar pruebas simuladas como comprobación del modelo real.
- [Permisos insuficientes o publicación parcial] --> Fallar con diagnóstico, documentar revisión y no sobrescribir Releases existentes.
- [Política manual mal aplicada] --> Ejemplos concretos en README y validaciones automatizadas; automatizar la elección de versión puede evaluarse después.

## Migration Plan

1. Añadir changelog, validaciones, workflow y documentación manteniendo la versión `0.1.0`.
2. Verificar casos positivos y negativos de metadatos, ejecutar controles del proyecto e inspeccionar el ZIP generado, sin crear tags ni Releases.
3. Integrar los archivos; dejar la primera publicación como operación deliberada posterior del mantenedor.
4. Para retirar el mecanismo antes de publicar, revertir el workflow y auxiliares. Una entrega ya publicada se corrige con otra versión y se conserva su trazabilidad.
