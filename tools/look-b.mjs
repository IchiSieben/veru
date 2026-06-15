// Test funcional de la Parte B: filtros, pin, Sorpréndeme-respeta-pin, compartir por URL.
import { chromium } from 'playwright';
const BASE = 'http://localhost:4321';
const b = await chromium.launch();
const r = {};
const errors = [];

// ---------- DESKTOP: filtros + pin + surprise + share-encode ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${BASE}/arma-tu-look/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Filtros visibles y poblados
  r.filtersVisible = await page.$eval('#lookFilters', (e) => !e.hidden);
  r.colorSwatches = await page.$$eval('#lookFilters .swf', (e) => e.length);
  r.occasionChips = await page.$$eval('#lookFilters .chip', (e) => e.length);

  // Aplicar un filtro de color -> algunas piezas quedan ocultas
  const totalPieces = await page.$$eval('.piece', (e) => e.length);
  await page.$eval('#lookFilters .swf', (e) => e.click());
  await page.waitForTimeout(150);
  const visibleAfter = await page.$$eval('.piece', (els) => els.filter((e) => !e.hidden).length);
  r.totalPieces = totalPieces;
  r.visibleAfterColorFilter = visibleAfter;
  r.filterHidSome = visibleAfter < totalPieces && visibleAfter > 0;
  r.clearVisible = await page.$eval('#lfClear', (e) => !e.hidden);
  // Limpiar -> todas visibles otra vez
  await page.$eval('#lfClear', (e) => e.click());
  await page.waitForTimeout(150);
  r.visibleAfterClear = await page.$$eval('.piece', (els) => els.filter((e) => !e.hidden).length);

  // Construir look: top + layer + bottom
  const tops = await page.$$('#stripTorso .piece');
  await tops[0].evaluate((e) => e.click());
  await tops[3].evaluate((e) => e.click());
  await page.$eval('#stripBottom .piece', (e) => e.click());
  await page.waitForTimeout(200);

  // Fijar (pin) la prenda de abajo en el lienzo
  const bottomName = await page.$eval('[data-board="bottom"] .bpiece__tag b', (e) => e.textContent);
  await page.$eval('[data-board="bottom"] .bpiece__pin', (e) => e.click());
  await page.waitForTimeout(120);
  r.bottomPinned = await page.$eval('[data-board="bottom"] .bpiece', (e) => e.classList.contains('pinned'));

  // Sorpréndeme varias veces: la prenda fijada debe sobrevivir siempre
  let survived = true;
  for (let i = 0; i < 8; i++) {
    await page.$eval('#lookSurprise', (e) => e.click());
    await page.waitForTimeout(80);
    const stillThere = await page.$$eval('[data-board="bottom"] .bpiece__tag b', (els) => els.map((e) => e.textContent));
    const pinnedNow = await page.$eval('[data-board="bottom"] .bpiece', (e) => e.classList.contains('pinned')).catch(() => false);
    if (!stillThere.includes(bottomName) || !pinnedNow) { survived = false; break; }
  }
  r.pinSurvivesSurprise = survived;

  // Share encode: el botón Compartir está visible con look armado
  r.shareVisible = await page.$eval('#lookShare', (e) => !e.hidden);

  await ctx.close();
}

// ---------- Roundtrip de URL: reconstruir un look desde querystring ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  // Separados: torso ids 5 (top) + 2 (layer) + bottom 4, con pin en 4
  await page.goto(`${BASE}/arma-tu-look/?look=t5,t2,b4&pin=4`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  r.url_boardPieces = await page.$$eval('#lookBoard .bpiece', (e) => e.length);
  r.url_layers = await page.$$eval('#layerList .layer-row', (e) => e.length);
  r.url_bottomPinned = await page.$eval('[data-board="bottom"] .bpiece', (e) => e.classList.contains('pinned')).catch(() => false);

  // Vestido por URL: bloquea torso/abajo
  await page.goto(`${BASE}/arma-tu-look/?look=d1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  r.url_dressPieces = await page.$$eval('[data-board="dress"] .bpiece', (e) => e.length);
  r.url_torsoDisabled = await page.$eval('#zoneTorso', (e) => e.classList.contains('zone--disabled'));

  // URL con basura: no rompe, ignora tokens inválidos
  await page.goto(`${BASE}/arma-tu-look/?look=t999,zzz,b4`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  r.url_garbageBottom = await page.$$eval('[data-board="bottom"] .bpiece', (e) => e.length);
  await ctx.close();
}

console.log('PARTE_B', JSON.stringify(r, null, 2));
console.log('JS_ERRORS:', errors.length ? errors : 'none');
await b.close();
