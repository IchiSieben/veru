import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:4321/producto/vestido-lucuma/', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);

const sizeInfo = await p.evaluate(() => {
  const el = document.querySelector('#pdpSizes .size');
  const c = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { coarse: matchMedia('(hover:none) and (pointer:coarse)').matches, minW: c.minWidth, minH: c.minHeight, h: Math.round(r.height), w: Math.round(r.width) };
});

// add to cart, then measure qty button in cart drawer
await p.tap('#pdpAdd');
await p.waitForTimeout(500);
const qtyInfo = await p.evaluate(() => {
  const el = document.querySelector('#cartDrawer .qty button');
  if (!el) return 'missing';
  const c = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), cssW: c.width, cssH: c.height };
});
console.log('size', JSON.stringify(sizeInfo));
console.log('qty', JSON.stringify(qtyInfo));
await b.close();
