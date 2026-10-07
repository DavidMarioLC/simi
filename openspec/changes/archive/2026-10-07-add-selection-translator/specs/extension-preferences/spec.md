# Spec Delta

## Purpose

Permitir al usuario controlar si la extensión detecta y traduce selecciones, conservando su preferencia localmente entre sesiones sin almacenar el contenido de las páginas.

## ADDED Requirements

### Requirement: Control de activación persistente

La extensión SHALL ofrecer un control de activación en su popup y conservar la preferencia localmente entre sesiones. En una instalación nueva sin preferencia guardada SHALL estar activada; este estado no implica que el modelo de traducción ya esté preparado.

#### Scenario: Instalación nueva
- **WHEN** el usuario abre el popup sin una preferencia guardada
- **THEN** el control muestra que la extensión está activada
- **THEN** la preparación de Translator API continúa su propio flujo cuando el usuario selecciona texto

#### Scenario: Preferencia tras reiniciar
- **WHEN** el usuario desactiva la extensión, cierra Chrome y vuelve a abrirlo
- **THEN** el popup mantiene el estado desactivado y las selecciones no producen traducciones

### Requirement: Desactivación efectiva en páginas abiertas

Cuando el usuario desactive la extensión, esta SHALL cerrar sus burbujas en las páginas abiertas, ignorar resultados pendientes y dejar de iniciar traducciones. Al activarla de nuevo SHALL esperar una nueva selección para mostrar la burbuja.

#### Scenario: Desactivación durante una solicitud
- **WHEN** el usuario desactiva la extensión mientras una selección está pendiente de traducción
- **THEN** la burbuja se cierra y el resultado pendiente no se muestra

#### Scenario: Reactivación
- **WHEN** el usuario activa de nuevo la extensión
- **THEN** la próxima selección admitida inicia el flujo de traducción
- **THEN** la extensión no vuelve a mostrar automáticamente una selección anterior

### Requirement: Preferencias sin contenido de traducción

La persistencia de preferencias SHALL limitarse a datos de configuración y SHALL NOT guardar selecciones, traducciones, URLs de navegación ni marcas que afirmen que un traductor sigue preparado entre documentos.

#### Scenario: Inspección del almacenamiento
- **WHEN** el usuario cambia la preferencia y traduce texto
- **THEN** el almacenamiento contiene la preferencia de activación y no contiene el texto original, la traducción ni la URL de la página
