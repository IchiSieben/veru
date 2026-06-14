import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'http://localhost:4321/producto/vestido-lucuma/';
const out = 'reference/shots';
fs.mkdirSync(out, { recursive: true });

const b = await chromium.launch();

// Captura desktop (reduced-motion) full-page.
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/pdp-desktop.png`, fullPage: true });
  await ctx.close();
}
// Captura móvil.
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/pdp-mobile.png`, fullPage: true });
  await ctx.close();
}

// Smoke test funcional de la PDP.
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const r = {};
  r.h1 = await p.$eval('.pdp__name', (e) => e.textContent);
  r.price = await p.$eval('.pdp__price span', (e) => e.textContent);
  r.related = await p.$$eval('.grid .rel-card', (e) => e.length);
  // elegir talla L
  const sizes = await p.$$('#pdpSizes .size');
  await sizes[sizes.length - 1].click();
  r.chosenSize = await p.$eval('#pdpAdd', (e) => e.dataset.size);
  // segunda miniatura
  const thumbs = await p.$$('.pdp__thumb');
  await thumbs[1].click();
  r.swappedMain = await p.$eval('#pdpMainImg', (e) => e.src.split('/').pop());
  // abrir acordeón "Cuidado" (antes de abrir el carrito)
  const heads = await p.$$('#pdpAcc .acc__head');
  await heads[1].click();
  await p.waitForTimeout(400);
  r.accOpen = await p.$$eval('#pdpAcc .acc__item.open', (e) => e.length);
  // agregar al carrito
  await p.$eval('#pdpAdd', (e) => e.click());
  await p.waitForTimeout(500);
  r.cartBadge = await p.$eval('#cartBadge', (e) => e.textContent);
  r.cartDrawerOpen = await p.$eval('#cartDrawer', (e) => e.classList.contains('open'));
  r.subtotal = await p.$eval('#subtotal', (e) => e.textContent);
  // ir a la ficha de un relacionado
  const relHref = await p.$eval('.grid .rel-card', (e) => e.getAttribute('href'));
  r.relatedLink = relHref;
  console.log(JSON.stringify(r, null, 2));
  console.log('JS_ERRORS:', errors.length ? errors : 'none');
  await ctx.close();
}
await b.close();
