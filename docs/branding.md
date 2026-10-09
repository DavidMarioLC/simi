# Icono de Simi

La marca elegida combina una «S» moderna con escalones inspirados en textiles andinos. El símbolo es terracota `#C65335` sobre crema `#F5F0E8`, sin texto, costuras ni puntas en el centro.

![Icono](../public/icon/128.png)

## Fuente y referencia

- `assets/simi-icon.svg` es la única fuente de geometría y color. Conserva el margen y las proporciones en todos los tamaños.
- `docs/branding/concept-reference.png` conserva la imagen conceptual corregida; el panel terracota de la derecha es la referencia elegida. El SVG reconstruye esa silueta con colores planos para uso real.
- `components/BrandIcon.tsx` inserta el SVG local en el popup y la burbuja. No dibuja una variante independiente ni descarga imágenes.
- `public/icon/` contiene los PNG para instalación y acción del navegador: 16, 32, 48 y 128 píxeles.

## Regeneración

Desde la raíz del proyecto, con las dependencias de desarrollo instaladas:

```sh
npx playwright install chromium
node scripts/export-icons.mjs
npm run build
```

El exportador usa el Chromium de Playwright, sin red, a escala de dispositivo 1. Genera los cuatro PNG desde el mismo SVG. No requiere conversión durante la ejecución de la extensión. Si el sandbox del entorno bloquea Chromium, ejecutar el comando en una terminal con permiso para abrir procesos de navegador.

Revisar 16 y 32 píxeles a tamaño real, especialmente las aperturas interiores. Cambiar siempre el maestro y regenerar todas las exportaciones; no retocar cada PNG por separado. El manifiesto compilado debe incluir los cuatro iconos y conservar `popup.html` como acción.

Después de compilar, recargar Simi en `chrome://extensions` y las páginas abiertas para ver la nueva marca en barra, administrador, popup y burbuja. La paleta de controles se describe a continuación.

## Paleta de interfaz

`assets/brand.css` define los colores compartidos del popup, la burbuja y los controles propios del visor PDF. `assets/tailwind.css` expone alias `simi-*` para Tailwind; el CSS del visor consume las mismas variables `--simi-*`. Las variables se definen tanto en la raíz de páginas de extensión como en el host de la burbuja encapsulada, sin modificar páginas externas.

| Rol | Variable | Color |
| --- | --- | --- |
| Marca, interruptor activo y progreso | `--simi-brand` | `#C65335` |
| Acción primaria y enlaces | `--simi-action` | `#A8432A` |
| Acción al pasar el puntero | `--simi-action-hover` | `#923922` |
| Acción presionada | `--simi-action-active` | `#7C301D` |
| Superficie suave | `--simi-soft` | `#F5F0E8` |
| Texto principal | `--simi-ink` | `#191919` |
| Foco de teclado | `--simi-focus` | `#A8432A` |

Usar blanco en el texto de acciones primarias. Su contraste sobre los fondos normal, hover y activo es, respectivamente, 6,00:1, 7,42:1 y 9,14:1. Los enlaces y el foco oscuro sobre crema alcanzan 5,29:1. El acento base del logo con blanco alcanza 4,48:1, por lo que se reserva para marca, progreso e interruptores sin texto.

Los controles secundarios mantienen blanco y texto oscuro; sus estados hover y activo usan crema. Mantener foco visible con separación, estados deshabilitados diferenciados y los colores semánticos de errores y avisos. Las áreas de lectura de traducciones siguen siendo blancas; los documentos PDF y los resaltados propios de PDF.js conservan sus colores originales.
