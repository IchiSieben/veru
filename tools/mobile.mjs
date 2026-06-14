import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:4321';
const out = 'reference/shots';
fs.mkdirSync(out, { recursive: true });

const devices = [
  { name: 'iphone', width: 390, height: 844 },
  { name: 'android', width: 360, height: 800 },
];

const b = await chromium.launch();

async function settle(page) {
  await page.evaluate(
    () =>
      new Promise((res) => {
        let y = 0;
        const i = setInterval(() => {
          window.scrollTo(0, y);
          y += 500;
          if (y > document.body.scrollHeight) {
            clearInterval(i);
            res();
          }
        }, 25);
      })
  );
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

for (const d of devices) {
  const ctx = await b.newContext({
    viewport: { width: d.width, height: d.height },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

  // --- HOME ---
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  // medir áreas táctiles
  const taps = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      iconbtn: pick('.iconbtn'),
      fav: pick('#grid .fav'),
      quickAdd: pick('#grid .quick-btn'),
    };
  });
  await settle(page);
  await page.screenshot({ path: `${out}/m-${d.name}-home.png`, fullPage: true });

  // --- PDP ---
  await page.goto(`${BASE}/producto/vestido-lucuma/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const pdpTaps = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    return { size: pick('#pdpSizes .size'), addBtn: pick('#pdpAdd'), thumb: pick('.pdp__thumb') };
  });
  await settle(page);
  await page.screenshot({ path: `${out}/m-${d.name}-pdp.png`, fullPage: true });

  // zoom táctil: tap en la imagen principal abre la vista rápida; tap de nuevo hace zoom
  await page.tap('#pdpMain');
  await page.waitForTimeout(500);
  const modalOpen = await page.$eval('#modal', (e) => e.classList.contains('open'));
  await page.tap('#modalStage');
  await page.waitForTimeout(400);
  const zoomed = await page.$eval('#modalStage', (e) => e.classList.contains('zoomed'));
  await page.screenshot({ path: `${out}/m-${d.name}-zoom.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // agregar al carrito y abrir drawer
  await page.tap('#pdpAdd');
  await page.waitForTimeout(500);
  const cartOpen = await page.$eval('#cartDrawer', (e) => e.classList.contains('open'));
  const qtyBtn = await page.$eval('#cartDrawer .qty button', (e) => {
    const r = e.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  await page.screenshot({ path: `${out}/m-${d.name}-cart.png` });

  // --- CHECKOUT ---
  await page.goto(`${BASE}/checkout/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const phoneType = await page.$eval('#co-phone', (e) => e.getAttribute('type'));
  const emailType = await page.$eval('#co-email', (e) => e.getAttribute('type'));
  await page.screenshot({ path: `${out}/m-${d.name}-checkout.png`, fullPage: true });

  console.log(`\n=== ${d.name} (${d.width}x${d.height}) ===`);
  console.log(JSON.stringify({ taps, pdpTaps, modalOpen, zoomed, cartOpen, qtyBtn, phoneType, emailType }, null, 2));
  console.log('JS_ERRORS:', errors.length ? errors : 'none');
  await ctx.close();
}
await b.close();
