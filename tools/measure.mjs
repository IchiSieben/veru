import { chromium } from 'playwright';

const BASE = 'http://localhost:4321';
const b = await chromium.launch();

async function box(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  }, sel);
}

for (const [name, w, h] of [['iphone', 390, 844], ['android', 360, 800]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const out = { device: `${name} ${w}x${h}` };

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  out.headerIcon = await box(page, '.iconbtn');
  out.cardFav = await box(page, '#grid .fav');
  out.cardAdd = await box(page, '#grid .quick-btn');

  await page.goto(`${BASE}/producto/vestido-lucuma/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  out.pdpSize = await box(page, '#pdpSizes .size');
  out.pdpAdd = await box(page, '#pdpAdd');
  out.pdpWa = await box(page, '.pdp__wa');

  await page.tap('#pdpAdd');
  await page.waitForTimeout(500);
  out.cartQty = await box(page, '#cartDrawer .qty button');
  out.cartCheckout = await box(page, '#cartCheckout');
  out.cartRemove = await box(page, '#cartDrawer .citem__rm');

  const allOk = Object.entries(out)
    .filter(([k, v]) => v && typeof v === 'object' && 'h' in v)
    .every(([k, v]) => v.h >= 44 && v.w >= 44);
  out.allTargets44 = allOk;
  out.errors = errors.length ? errors : 'none';
  console.log(JSON.stringify(out, null, 2));
  await ctx.close();
}
await b.close();
