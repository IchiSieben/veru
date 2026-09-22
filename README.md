# verú — static storefront

`verú` is a complete clothing store — catalogue, product pages, look builder, cart and
checkout — built as static files. No backend, no database, no per-sale cost.

`verú` is an invented brand used as a demo. It is not a real shop and takes no real payments.

## Status

Work in progress (per the [ichisieben.dev](https://ichisieben.dev) project card): the store
itself builds and runs end to end; what remains is deploying it to its own domain/subdomain
(`astro.config.mjs` still points at the placeholder `veru.pe`) and swapping the product
photography for licensed material.

## Stack

| Layer | Tool |
|---|---|
| Site | Astro 4 (SSG) |
| Behaviour | Vanilla JS, ES modules — no framework |
| Images | `sharp` via Astro's `<Image>` |
| SEO | `@astrojs/sitemap`, per-product meta |

No Tailwind and no application TypeScript: the CSS is hand-written and the logic is plain
modules.

## What is in it

- 17 products with their own routes (`/producto/<slug>`), indexable and shareable
- Category filtering, favourites, and a "build your look" outfit composer
- Cart persisted in `localStorage`, surviving refresh and browser restart
- Checkout collecting delivery details, ending in a WhatsApp order message
- Countdown, newsletter capture and lookbook, all client-side
- Opening tutorial on first visit (shared component, dismissal remembered)

## How to run it

Verified on this machine (Node via npm, Astro 4.16.18):

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/ (20 pages, ~30 s)
npm run preview
```

`npm install` and `npm run build` both completed cleanly.

## Deploying

`astro.config.mjs` sets `site: 'https://veru.pe'` for absolute sitemap and OG URLs — change
that to the real domain before publishing.

The store uses real routes (`/producto/…`), so it needs its own root: a subdomain such as
`tienda.<dominio>`, not a subfolder. Serving it from a subfolder requires setting `base` in
`astro.config.mjs` *and* routing every internal link through `import.meta.env.BASE_URL`.

Trade-offs and the seams where a real backend plugs in are documented in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Data sources and licences

No external data source: catalogue, copy and pricing are original content written for this
demo. Product photography is placeholder material (see Licence below).

## Author

Yoichi Palacios Tanaka (IchiSieben) · [ichisieben.dev](https://ichisieben.dev)

## Licence

Code licensed under [Apache License 2.0](LICENSE). Product photography is placeholder
material and is not covered by that licence.

---

# Español

`verú` es una tienda de ropa completa — catálogo, fichas de producto, armador de looks,
carrito y checkout — construida como archivos estáticos. Sin backend, sin base de datos, sin
costo por venta.

`verú` es una marca inventada para esta demo. No es una tienda real y no procesa pagos reales.

## Estado

En construcción (según la ficha del proyecto en [ichisieben.dev](https://ichisieben.dev)): la
tienda ya compila y corre de punta a punta; falta desplegarla en su dominio/subdominio propio
(`astro.config.mjs` todavía apunta al valor de referencia `veru.pe`) y reemplazar las fotos de
producto por material con licencia.

## Stack

| Capa | Herramienta |
|---|---|
| Sitio | Astro 4 (SSG) |
| Comportamiento | JavaScript vanilla, módulos ES — sin framework |
| Imágenes | `sharp` vía `<Image>` de Astro |
| SEO | `@astrojs/sitemap`, meta por producto |

Sin Tailwind ni TypeScript de aplicación: el CSS está escrito a mano y la lógica son módulos
planos.

## Qué incluye

- 17 productos con ruta propia (`/producto/<slug>`), indexables y compartibles
- Filtro por categoría, favoritos y un armador de looks ("build your look")
- Carrito persistido en `localStorage`, sobrevive recarga y reinicio del navegador
- Checkout que recoge datos de entrega y termina en un mensaje de pedido por WhatsApp
- Countdown, captura de newsletter y lookbook, todo del lado del cliente
- Tutorial de apertura en la primera visita (componente compartido, el descarte se recuerda)

## Cómo correrlo

Verificado en esta máquina (Node vía npm, Astro 4.16.18):

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/ (20 páginas, ~30 s)
npm run preview
```

`npm install` y `npm run build` terminaron sin errores.

## Despliegue

`astro.config.mjs` fija `site: 'https://veru.pe'` para URLs absolutas de sitemap y OG — cambiar
eso al dominio real antes de publicar.

La tienda usa rutas reales (`/producto/…`), así que necesita raíz propia: un subdominio como
`tienda.<dominio>`, no una subcarpeta. Servirla desde una subcarpeta exige configurar `base` en
`astro.config.mjs` **y** enrutar cada enlace interno a través de `import.meta.env.BASE_URL`.

Los trade-offs y los puntos donde engancha un backend real están documentados en
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Fuentes de datos y licencias

Sin fuente de datos externa: catálogo, textos y precios son contenido original escrito para
esta demo. Las fotos de producto son material de referencia (ver Licencia abajo).

## Autor

Yoichi Palacios Tanaka (IchiSieben) · [ichisieben.dev](https://ichisieben.dev)

## Licencia

Código bajo [Apache License 2.0](LICENSE). Las fotos de producto son material de referencia y
no están cubiertas por esa licencia.
