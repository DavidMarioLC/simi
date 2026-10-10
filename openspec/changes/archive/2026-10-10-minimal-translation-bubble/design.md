# Design

## Context

La motivación y el alcance están en `proposal.md`. `TranslationBubble` concentra todos los estados y es compartido por el content script y `mountPdfSelection`. Actualmente impone 320 px de ancho, radio de 16 px y una cabecera independiente con logo de 22 px y etiqueta de idiomas.

El content script presenta la región como popover manual en la capa superior; el visor PDF la monta como elemento fijo. Ambos usan `positionBubble`, que mide el tamaño real. El componente ya observa cambios de tamaño con `ResizeObserver`. Las pruebas comprueban aislamiento de estilos, geometría, superposición, estados, cierre y desplazamiento interno.

El diseño se documenta porque el ancho intrínseco y la redistribución de estados requieren decisiones previas para funcionar igual en el popover y en el visor PDF.

## Goals / Non-Goals

**Goals:**
- Resolver la distribución y los límites de tamaño en el componente compartido.
- Mantener una traducción breve en una fila y admitir contenido largo sin desplazar el cierre fuera de vista.
- Reutilizar la medición y el reposicionamiento existentes cuando cambie el contenido.

**Non-Goals:**
- Alterar el controlador, la detección de selecciones o la política de cierre.
- Añadir opciones de apariencia, nuevas acciones, animaciones o cambios globales de marca.

## Decisions

### 1. Una composición compartida de tres columnas

Usar tres columnas: símbolo, contenido flexible y cierre. El resultado o mensaje ocupa la columna central; las acciones y el progreso se distribuyen debajo de ese contenido. Logo y cierre se alinean al inicio cuando el contenido ocupa varias líneas; una traducción breve queda centrada verticalmente en la misma fila.

```text
+---------------------+
| [S]  Correr       x  |
+---------------------+

+---------------------------------+
| [S]  Una traduccion que ocupa  x |
|      varias lineas.              |
+---------------------------------+

+---------------------------------+
| [S]  Activa la traduccion      x |
|      local para este documento. |
|      [Activar traduccion]        |
|      Ayuda de primera descarga. |
+---------------------------------+
```

Se descarta conservar una cabecera reducida: mantiene una segunda fila incluso para una palabra. Tampoco se elimina el logo, porque la dirección elegida conserva identidad.

### 2. Ancho intrínseco con límite y contenido que puede encogerse

El panel toma el ancho necesario para su contenido hasta un máximo exterior de `min(320px, calc(100vw - 16px))`, con `box-sizing: border-box`. Los 320 px pasan de ancho obligatorio a techo. No se introduce un mínimo equivalente a una tarjeta.

La columna central puede encogerse; los saltos de línea se conservan y las cadenas sin espacios se parten cuando sea necesario. Logo y cierre no se comprimen. El límite se aplica también dentro del popover, evitando que su tamaño dependa del espacio que queda a la derecha de su coordenada actual.

El ancho fijo anterior se descarta por el espacio vacío en resultados breves. Un ancho ilimitado se descarta por la lectura de frases largas y los bordes del navegador.

### 3. Valores iniciales para concretar la dirección elegida

Estos valores resuelven detalles menores de la propuesta visual para su implementación:

| Elemento | Valor |
| --- | --- |
| Símbolo | 16 × 16 px, mismo recurso local |
| Resultado | 15 px, interlineado de 23 px |
| Relleno | 10 px |
| Separación entre columnas | 8 px |
| Radio exterior | 12 px |
| Fondo y texto | Blanco y `simi-ink` |
| Borde | 1 px, gris neutro `#E5E5E5` |
| Sombra | `0 2px 8px rgb(0 0 0 / 0.10)` |
| Cierre | Símbolo discreto de 18 px en área de 26 × 26 px |

Conservar los tokens terracota para símbolo, acciones, progreso y foco; usar crema en las superficies suaves de interacción existentes. Los ajustes se limitan a la burbuja. Se descartan sombras intensas y transparencia del fondo para mantener legibilidad y menor peso visual.

### 4. Contexto accesible sin cabecera visual

Retirar la etiqueta visible de idiomas. Conservar `role="region"` y el nombre «Traducción al español», añadir una descripción accesible «Del inglés al español» y mantener el logo decorativo mediante `BrandIcon`. Preservar la región de estado con anuncios y el nombre «Cerrar traducción», navegación por teclado y foco visible.

El cierre siempre está visible, con área de clic de 26 × 26 px. Se descarta mostrarlo solo con hover porque dificultaría descubrirlo y operarlo con teclado.

### 5. Estados y geometría sin nuevos flujos

Reutilizar los mensajes, progreso, acción de activación, aviso de primera descarga y reintentos actuales. Solo cambia su distribución dentro de la columna central. Los estados extensos permiten varias líneas y las acciones conservan espacio suficiente para su texto.

Mantener `useLayoutEffect`, `ResizeObserver` y `positionBubble`, que ya trabajan con dimensiones reales y actualizan la posición cuando cambia el tamaño. Conservar los límites de alto y el desplazamiento interno del contenido; comprobar especialmente el espacio disponible en el visor PDF. No añadir otra estrategia de posicionamiento; si una limitación de tamaño por superficie exige un ajuste, mantenerlo dentro de sus límites y ciclo de vida actuales.

## Risks / Trade-offs

- [El ancho cambia al pasar de un estado breve a un resultado] -> Reposicionar con la medición existente y verificar los cambios de estado junto a los bordes, sin introducir animaciones.
- [El tamaño intrínseco difiere entre popover y elemento fijo] -> Verificar la apariencia y geometría en ambos consumidores y conservar la prueba de comparación entre capa superior y referencia sin popover.
- [Cadenas largas o acciones fuerzan desbordamiento] -> Permitir que la columna central se encoja, partir cadenas y probar ventanas estrechas, errores y activación.
- [El logo pierde definición a 16 px] -> Reutilizar el SVG maestro y revisar una captura al 100 %; no rediseñar el símbolo.
- [Se pierde la etiqueta visual de idiomas] -> Mantener el contexto en la descripción accesible; el flujo sigue siendo exclusivamente de inglés a español.

## Migration Plan

Implementar el componente compartido y los estilos necesarios, validar la extensión compilada y revisar capturas de resultado breve, resultado largo y activación. El cambio llega con la siguiente compilación de la extensión, sin migración de datos ni preferencias. Ante una regresión visual, revertir la modificación del componente y de sus estilos asociados.
