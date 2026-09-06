# Architecture

How the store is put together, and — more usefully — where a real backend attaches when it
outgrows being static.

## The shape

```
src/data/          Products as data. The single source of truth at build time.
src/pages/         index · producto/[slug] · arma-tu-look · checkout · pedido-confirmado
src/layouts/       Base.astro — shell, meta, cart drawer, tutorial
src/scripts/       catalog · cart · checkout · look · favs · newsletter · countdown
public/tutorial/   Shared opening tutorial (vendored)
```

Astro renders every page at build. The only JavaScript that ships is the modules in
`src/scripts/`, loaded as plain ES modules — no framework runtime, no hydration.

## Cart state

The cart is a plain array of `{ id, size, qty }` in `localStorage` under one key.

- **It is written on every mutation and read on every page load.** There is no in-memory store
  to keep in sync, so a hard refresh mid-checkout loses nothing.
- **Prices are never read from the cart.** They are re-resolved from the build-time product
  data on render, so a tampered `localStorage` cannot change what a product costs.
- **The cart is per-browser.** There is no account, so it does not follow the shopper to
  another device. That is the accepted cost of having no backend.

## Checkout flow

1. Cart drawer → `/checkout`
2. Delivery details collected client-side; validation is inline, no round trip
3. Order composed into a WhatsApp message with items, sizes, totals and address
4. `/pedido-confirmado` renders the summary

**No payment is captured.** Money moves out of band via Yape, Plin or transfer, and the seller
confirms manually. For a shop doing single-digit orders a day, a human confirming payment costs
less than a gateway's fees and integration.

---

## Extension points

Each of these is a seam that exists today, not a rewrite. **None is implemented** — this
section documents the contract, deliberately.

### 1. Products from a CMS or WooCommerce

**Seam:** `src/data/` is the only place products are defined. Everything else consumes the same
shape.

The contract a source must satisfy:

```ts
type Product = {
  id: string;            // stable; the cart stores this
  slug: string;          // becomes /producto/<slug> — changing it breaks links
  name: string;
  price: number;         // integer, in céntimos. Never a float.
  category: string;
  sizes: string[];
  images: string[];      // build-time paths or remote URLs allowlisted in astro.config
  stock?: Record<string, number>;   // by size; absent means "assume available"
};
```

To swap the source, replace `src/data/` with a build-time fetch:

- **WooCommerce** — `GET /wp-json/wc/v3/products` with a read-only key, mapped into `Product`.
  Read at build, never at runtime, so the store keeps shipping as static files and the WP
  instance is never exposed to shoppers.
- **Headless CMS** (Sanity/Contentful/Strapi) — same shape, same build-time fetch.

Two consequences to accept: **stock is only as fresh as the last build**, so a webhook should
trigger a rebuild on stock change; and `slug` must stay stable in the source or old product
URLs 404.

### 2. Payment gateway

Today checkout ends in a WhatsApp message. A gateway needs one thing this architecture does not
have: **a server-side secret**. No integration can be done purely client-side without exposing
a key that lets anyone forge an amount.

Minimum honest shape, in every case:

```
browser → [your endpoint: creates the intent with the SECRET key,
           computing the amount from YOUR product data, never from the client]
        → gateway → webhook → [your endpoint: marks the order paid]
```

That endpoint is the smallest possible piece of backend — a single serverless function.

| Gateway | Fit | Notes |
|---|---|---|
| **Culqi** | Best for Peru | Cards + Yape natively. Public key tokenizes in the browser; the secret key charges server-side. Amounts in céntimos, which is why `price` is an integer here. |
| **Mercado Pago** | Regional | Checkout Pro redirects, so the least frontend work. Preference created server-side. |
| **Stripe** | International only | No Yape/Plin, and Peru card coverage is weaker. Only worth it if selling abroad. |

**The rule that matters:** the amount is always computed server-side from the product source.
A client that can name its own price is not a checkout, it is a donation form.

Webhooks must be **idempotent** — gateways retry, and a double-processed order is worse than a
missed one.

### 3. Order persistence

There is nothing to extend here yet: orders exist only as WhatsApp messages. Adding a gateway
forces a datastore, since the webhook needs a row to mark paid. That is the point where this
stops being a static site — and it should not happen before the sales volume justifies it.
