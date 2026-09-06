# verú — static storefront

A complete clothing store — catalogue, product pages, look builder, cart and checkout — built
as **static files**. No backend, no database, no per-sale cost. It deploys to any static host
and survives with zero maintenance.

`verú` is an invented brand used as a demo. It is not a real shop and takes no real payments.

## Why build a store this way

Most small storefronts in Peru do not fail because the checkout lacks features. They fail
because a monthly platform fee, a plugin that breaks on update, or a server nobody maintains
outlives the shop's margin.

This is the other end of that trade-off: everything that can be decided at build time is, and
the only runtime state is a cart in `localStorage`. The order is completed over WhatsApp with
Yape, Plin or bank transfer — which is how these sales actually close here, rather than through
a card gateway the seller may not have.

The trade-offs are real and stated in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), along
with the seams where a real backend plugs in when the shop outgrows this.

## What is in it

- 17 products with their own routes (`/producto/<slug>`), indexable and shareable
- Category filtering, favourites, and a "build your look" outfit composer
- Cart persisted in `localStorage`, surviving refresh and browser restart
- Checkout collecting delivery details, ending in a WhatsApp order message
- Countdown, newsletter capture and lookbook, all client-side
- Opening tutorial on first visit (shared component, dismissal remembered)

## Stack

| Layer | Tool |
|---|---|
| Site | Astro 5 (SSG) |
| Behaviour | Vanilla JS, ES modules — no framework |
| Images | `sharp` via Astro's `<Image>` |
| SEO | `@astrojs/sitemap`, per-product meta |

No Tailwind and no application TypeScript: the CSS is hand-written and the logic is plain
modules. That is deliberate — a store this size does not need a build-time design system, and
the absence of one is why it still builds in 2.4 s.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview
```

## Deploying

`astro.config.mjs` sets `site: 'https://veru.pe'` for absolute sitemap and OG URLs — change
that to the real domain before publishing.

The store uses **real routes** (`/producto/…`), so it needs its own root: a subdomain such as
`tienda.<dominio>`, not a subfolder. Serving it from a subfolder requires setting `base` in
`astro.config.mjs` *and* routing every internal link through `import.meta.env.BASE_URL`.
Verified building and serving from a root path.

## License

Code MIT. Product photography is placeholder material and is not covered by that licence.
