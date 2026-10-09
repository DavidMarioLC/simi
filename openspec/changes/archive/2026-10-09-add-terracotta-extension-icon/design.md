# Design

## Context

La configuración de WXT no declara `icons` ni `action.default_icon`. El popup utiliza una «S» decorativa de 40 píxeles y la burbuja otra de 28 píxeles. Las pruebas existentes en `tests/extension.spec.ts` cubren el popup y las traducciones con un proveedor simulado.

La referencia elegida es el panel derecho de la imagen corregida: `/Users/davidmariolc/.codex/generated_images/01a120e3-333e-7723-b4a2-4e9d411646fe/exec-706e67b7-b8ce-477d-acfb-a7a2db718f32.png`. Es una referencia visual, no un recurso listo para empaquetar.

## Goals / Non-Goals

**Goals:**
- Mantener una geometría maestra reproducible en todas las superficies.
- Incluir recursos autocontenidos que no requieran red ni rasterización al ejecutar la extensión.

**Non-Goals:**
- Rediseñar botones, controles, tipografía o el visor PDF.
- Incorporar la palabra «simi» al icono pequeño o agregar versiones de marca no elegidas.

## Decisions

1. **Maestro vectorial local.** Reconstruir la silueta elegida en un SVG con coordenadas explícitas y espacio central limpio. No recortar el panel generado: incluye texto, margen y textura que perjudicarían el tamaño pequeño. Conservar la referencia en documentación de marca dentro del proyecto al implementar.
2. **Paleta fija.** Usar terracota `#C65335` y crema `#F5F0E8`, valores propuestos durante la exploración. La rasterización puede introducir antialiasing, pero no debe alterar la geometría entre tamaños. Reservar margen uniforme para evitar recortes.
3. **Recursos de instalación.** Exportar desde el mismo maestro los PNG a `public/icon/{16,32,48,128}.png`. Declarar explícitamente `manifest.icons` y `manifest.action.default_icon` en `wxt.config.ts`; comprobar el manifiesto final y preservar la acción de popup que genera WXT. Documentar un procedimiento reproducible de exportación; no añadir una dependencia de ejecución para convertir imágenes.
4. **Uso en React.** Compartir una representación vectorial del símbolo entre popup y burbuja mediante un componente de marca, conservando sus contenedores de 40 y 28 píxeles. SVG inline evita que el content script necesite exponer imágenes mediante `web_accessible_resources`. El símbolo es decorativo y lleva `aria-hidden`.
5. **Verificación proporcional.** Inspeccionar los PNG a tamaño real y ampliado, el manifiesto generado y las dos superficies reales. Ejecutar comprobación de tipos, compilación y las pruebas de extensión pertinentes; no añadir pruebas que se limiten a repetir coordenadas o valores de color.

## Risks / Trade-offs

- Diferencias entre el concepto raster y el SVG → comparar la silueta reconstruida con el panel terracota antes de dar por terminada la implementación.
- Pérdida del espacio central a 16 píxeles → ajustar la geometría maestra y regenerar todos los tamaños juntos.
- Divergencia entre SVG y componente → reutilizar los mismos datos geométricos y documentar su fuente; no redibujar cada versión de forma independiente.
- La imagen de referencia vive fuera del repositorio → incluir una copia de referencia durante la implementación para que el resultado no dependa de una ruta personal.

## Migration Plan

Agregar recursos, conectar manifiesto y reemplazar las dos letras decorativas. Compilar y recargar la extensión en Chrome para comprobar barra, administrador, popup y burbuja. Para revertir, retirar las referencias y restaurar las letras anteriores; no hay migración de datos.
