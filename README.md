# Simi

Extensión de Chrome de escritorio para traducir del inglés al español junto al texto seleccionado. Stack: WXT, TypeScript, Manifest V3, React y Tailwind CSS.

## Desarrollo

Requisitos: Node.js 22 o posterior y Chrome 138 o posterior. La disponibilidad efectiva de Translator API se comprueba en cada contexto.

```sh
npm ci
npm run typecheck
npm run build
npm run dev
```

## Instalación local

1. Ejecutar `npm run build`.
2. Abrir `chrome://extensions` y activar «Modo de desarrollador».
3. Pulsar «Cargar descomprimida» y elegir `.output/chrome-mv3` de este proyecto.
4. Abrir o recargar la página donde se utilizará la extensión y permitirle acceso a ese sitio desde Chrome.

## Permisos y privacidad

El content script solicita acceso a páginas HTTP/HTTPS para detectar selecciones automáticamente. Chrome permite controlar su acceso por sitio. El permiso `storage` se destina a preferencias locales. No se solicitan permisos para el historial, pestañas, panel lateral ni proveedores de traducción remotos.

La traducción usa modelos locales de Chrome. La primera preparación puede necesitar conexión para descargar recursos. El contenido no se envía a un servicio externo ni se guarda como historial.

## Uso

Selecciona una palabra, una frase o varios párrafos en inglés y suelta el ratón. También se admite una selección con teclado; para crear una selección en texto no editable con las flechas, utiliza la navegación por cursor de Chrome (F7). La traducción aparece encima de la primera línea visible de la selección, o debajo si falta espacio.

Si aparece «Activar traducción», púlsalo para preparar el traductor de ese documento. La primera vez puede descargarse un modelo; verás su progreso. Si el gesto de selección ya permite prepararlo, la extensión puede empezar automáticamente. Las siguientes selecciones reutilizan la instancia mientras siga siendo válida.

Cierra la burbuja con Escape, el botón de cierre o un clic fuera. Una nueva selección cambia el resultado. Los resultados largos tienen desplazamiento interno. Desde el icono de Simi puedes activar o desactivar la traducción automática; esa preferencia se conserva localmente y se aplica a las pestañas abiertas.

## Compatibilidad y límites

La versión mínima declarada es Chrome 138, pero se comprueba la API y el par inglés a español en cada documento. Una página puede bloquear la API mediante su política de permisos; HTTP remoto no seguro puede no ofrecerla. La primera preparación puede fallar: utiliza «Reintentar» y comprueba la conexión. Recargar o navegar puede requerir otra activación.

Esta versión cubre texto seleccionable del documento principal de páginas web accesibles para la extensión. No traduce campos de formulario, contenido editable, iframes, el visor PDF integrado, páginas internas de Chrome ni Chrome Web Store. No detecta automáticamente el idioma de origen: asume inglés.

Consulta [la evidencia de compatibilidad](docs/translator-compatibility.md) para distinguir lo comprobado con Chrome real de las pruebas con simulaciones.

## Pruebas y empaquetado

```sh
npx playwright install chromium
npm run typecheck
npm run build
npm test
npm run probe:native
npm run zip
```

`npm test` prueba el paquete compilado con Chromium y un proveedor simulado instalado por el código de pruebas en el mundo aislado. La simulación no forma parte del paquete de producción. Incluye estados de descarga, errores, selección real, geometría, estilos, cierre y preferencias en dos pestañas y entre sesiones.

`npm run probe:native` utiliza Chrome instalado y un perfil temporal independiente. Comprueba traducciones reales de ejemplos sintéticos, navegación, recarga y una página que deniega la API. También provoca una excepción de prueba para comprobar el reintento, restaurando después el método nativo. Los informes y capturas quedan en `test-results/`. Los perfiles temporales se eliminan al terminar.

El ZIP de WXT queda en `.output/`. Para instalar localmente usa la carpeta `.output/chrome-mv3`; no hace falta publicar en la tienda.
