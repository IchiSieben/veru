import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = 'http://localhost:4321';
const out = 'reference/shots';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();

// ---------- DESKTOP ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${BASE}/arma-tu-look/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/look-desktop-empty.png`, fullPage: true });

  const r = {};
  // elegir un top + un layer (2 capas) + un bottom
  const tops = await page.$$('#stripTorso .piece');
  await tops[0].evaluate((e) => e.click());
  await tops[3].evaluate((e) => e.click());
  await page.waitForTimeout(200);
  await page.$eval('#stripBottom .piece', (e) => e.click());
  await page.waitForTimeout(300);
  r.boardPieces = await page.$$eval('#lookBoard .bpiece', (e) => e.length);
  r.layers = await page.$$eval('#layerList .layer-row', (e) => e.length);
  r.total = await page.$eval('#lookTotal', (e) => e.textContent);
  r.count = await page.$eval('#lookCount', (e) => e.textContent);
  r.addEnabled = await page.$eval('#lookAdd', (e) => !e.disabled);
  await page.screenshot({ path: `${out}/look-desktop-built.png`, fullPage: true });

  // caso vestido: bloquea torso/abajo
  await page.$eval('#stripDress .piece', (e) => e.click());
  await page.waitForTimeout(300);
  r.dressActive_boardPieces = await page.$$eval('#lookBoard .bpiece', (e) => e.length);
  r.torsoDisabled = await page.$eval('#zoneTorso', (e) => e.classList.contains('zone--disabled'));
  r.bottomDisabled = await page.$eval('#zoneBottom', (e) => e.classList.contains('zone--disabled'));
  r.totalDress = await page.$eval('#lookTotal', (e) => e.textContent);
  await page.screenshot({ path: `${out}/look-desktop-dress.png`, fullPage: true });

  // quitar vestido -> libera zonas (vuelven las capas previas)
  await page.$eval('#lookBoard .bpiece__rm', (e) => e.click());
  await page.waitForTimeout(300);
  r.afterRemoveDress_torsoDisabled = await page.$eval('#zoneTorso', (e) => e.classList.contains('zone--disabled'));
  r.afterRemoveDress_pieces = await page.$$eval('#lookBoard .bpiece', (e) => e.length);

  // Sorpréndeme
  await page.$eval('#lookSurprise', (e) => e.click());
  await page.waitForTimeout(300);
  r.surprisePieces = await page.$$eval('#lookBoard .bpiece', (e) => e.length);

  // Agregar look al carrito
  const before = await page.$eval('#cartBadge', (e) => +e.textContent || 0);
  await page.$eval('#lookAdd', (e) => e.click());
  await page.waitForTimeout(500);
  r.cartBadgeAfterAdd = await page.$eval('#cartBadge', (e) => e.textContent);

  console.log('DESKTOP', JSON.stringify(r, null, 2));
  console.log('JS_ERRORS:', errors.length ? errors : 'none');
  await ctx.close();
}

// ---------- MÓVIL ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/arma-tu-look/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/look-mobile-empty.png`, fullPage: true });
  // construir un look
  const tops = await page.$$('#stripTorso .piece');
  await tops[0].evaluate((e) => e.click());
  await tops[3].evaluate((e) => e.click());
  await page.$eval('#stripBottom .piece', (e) => e.click());
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/look-mobile-built.png`, fullPage: true });
  await ctx.close();
}
await b.close();
