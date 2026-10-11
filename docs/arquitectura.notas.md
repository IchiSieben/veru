# Notas de arquitectura: verú

Marca propia de iC7 (inventada), tienda de ropa estática. Estas notas responden las 9 preguntas del manual y
justifican cada llamada dibujada en `arquitectura.html`. Lo que no está en el código queda como "por confirmar"
y no se dibuja.

## 1. Actores
- Visitante / comprador: usa la tienda desde el navegador. No hay cuentas ni login.
- Personas del negocio: reciben el pedido por WhatsApp y confirman el pago a mano (`src/scripts/confirm.js:payInstructions`
  solo muestra instrucciones). No es un sistema; se menciona solo en el texto de la llamada a WhatsApp.
- Sistemas externos llamados desde el navegador: Google Fonts (`src/layouts/Base.astro`, `<link>` a la hoja de estilos) y WhatsApp
  (enlace `wa.me`, `src/config.js:waLink`). Nadie llama al sitio.

## 2. Contenedores
| Id | Qué es | Stack | Dónde corre |
|---|---|---|---|
| vis | Visitante | persona | Navegador del usuario |
| cli | Scripts del cliente | JS vanilla, módulos ES (`src/scripts/main.js:boot`) | Navegador del usuario |
| ls | localStorage | claves `veru.cart`, `veru.favs`, `veru.orders`, `veru.lastOrder` (`src/scripts/store.js`) | Navegador del usuario |
| web | Sitio estático | `dist/` de `astro build` (`package.json:scripts.build`) | host por confirmar |
| fonts | Google Fonts | CSS + archivos de fuente | externo |
| wa | WhatsApp | enlace `wa.me` con texto prellenado | externo |
| dev | Build local | Astro 4, sharp, `@astrojs/sitemap` | PC Windows (inferido: README "Verified on this machine", `dev.log`, `preview.log`) |
| gh | GitHub | repo `origin` (`git remote -v`) | GitHub |

No hay backend, ni base de datos, ni API, ni cola. Escala: es un directorio de archivos.

## 3. Llamadas reales
| Id | Origen -> destino | Qué viaja | Evidencia (archivo:función) |
|---|---|---|---|
| e1 | cli -> web | HTML de cada ruta, JS, imágenes optimizadas; los datos de producto van embebidos en `#veru-data` | `src/layouts/Base.astro` (script `veru-data`); `src/pages/index.astro`, `src/pages/producto/[slug].astro:getStaticPaths`; `src/scripts/data.js` lee `#veru-data` |
| e2 | cli -> fonts | hoja de estilos y fuentes (Bodoni Moda, Manrope) | `src/layouts/Base.astro` (`<link>` a fonts.googleapis.com / preconnect a fonts.gstatic.com) |
| e3 | vis -> cli | clics, filtro de categoría, formulario | `src/scripts/main.js:boot` (initUI, initCatalog, initCheckout, initConfirm...) |
| e4 | cli -> ls | carrito y favoritos | `src/scripts/cart.js:addToCart` -> `src/scripts/store.js:persist` (`veru.cart`, `veru.favs`); `main.js` escucha el evento `storage` entre pestañas |
| e5 | cli -> ls | pedido (historial y último) | `src/scripts/checkout.js:initCheckout` (submit): `localStorage.setItem(ORDERS_KEY / LAST_ORDER_KEY)` tras `validate`, `totals`, `orderCode` |
| e6 | ls -> cli | lee `veru.lastOrder` y pinta resumen + instrucciones de pago | `src/scripts/confirm.js:initConfirm` |
| e7 | cli -> wa | texto del pedido en la URL `wa.me/?text=` | `checkout.js:buildMessage` -> `src/config.js:waLink` -> `window.open(waUrl, '_blank')`, luego `clearCart()` y `window.location.href = '/pedido-confirmado'` |
| e8 | dev -> gh | commits | `git remote -v` (origin en GitHub) |

## 4. Flujos
1. Una visita: e1, e2, e3, e4.
2. Una compra: carrito -> WhatsApp: e3, e5, e7, e1, e6.

## 5. Núcleo interno
No aplica: no hay API ni lógica de negocio de servidor. Las reglas (envío gratis desde `SITE.freeShippingFrom`, tarifa plana
`SITE.flatShipping`) viven en el cliente, en `checkout.js:totals`. Sin vista hex.

## 6. Datos
No hay base de datos. Catálogo: `src/data/products.json` -> `src/lib/products.js` en build. En el cliente, `localStorage`
(claves de la sección 2). Los precios se resuelven desde los datos de build con `byId`, no se guardan en el carrito.
Se omite la vista de datos: son cuatro claves, caben en el panel de `ls`.

## 7. Despliegue
Hoy: `npm run build` produce `dist/` (20 páginas según el README). La tienda usa rutas reales (`/producto/...`), por lo que
necesita raíz propia (README, sección Deploying). Por confirmar: dominio o subdominio final y host (el README dice que aún no
está desplegada y `astro.config.mjs` conserva un `site` de relleno). No hay `.github/` ni workflow en el repo.

## 8. Historias de usuario
No aplica (demo de portafolio, no nació de requisitos de terceros).

## 9. Decisiones
No existe `docs/DECISIONES.md`, así que no hay pestaña de decisiones. `docs/ARCHITECTURE.md` documenta puntos de extensión
(CMS, pasarela de pago) pero ninguno está implementado.

## Por confirmar (no dibujado)
- Host y subdominio final; cómo llega `dist/` al host (no hay script ni workflow en el repo).
- `newsletter.js:initNewsletter` solo valida el correo con una expresión regular y muestra "Revisa tu correo para confirmar";
  no hace ninguna llamada ni guarda nada. No se dibuja.
- Hosts de imágenes en ejecución: `astro.config.mjs` permite `images.unsplash.com` en `image.domains`, pero ningún dato de
  `src/` lo usa; las imágenes salen de `src/assets/img` en build (`src/lib/images.js`). No se dibuja.
- `docs/ARCHITECTURE.md` describe el carrito como `{ id, size, qty }` y precios en céntimos; el código guarda
  `{ key, id, size, q }` y `money()` imprime `'S/' + n`. Discrepancia menor de documentación.

## Privacidad
`src/config.js` contiene teléfono, cuentas y CCI de relleno (`SITE.whatsapp`, `SITE.yape`, `SITE.bank`). No se citan; la página
dice "datos de pago". Antes de producción deben sustituirse por los reales y seguir fuera del repo público si son sensibles.
`docs/seed/` no se tocó.
