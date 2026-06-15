import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:4321';
const out = 'reference/shots';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();

// ---------- DESKTOP: lógica de filtros ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const count = async () => page.$$eval('#grid .card', (e) => e.length);
  const resultTxt = async () => page.$eval('#resultCount', (e) => e.textContent);
  const r = {};
  r.initial = await count();
  r.initialResult = await resultTxt();

  // Filtrar por categoría Vestidos
  await page.click('#filterPanel [data-facet="cat"][data-val="Vestidos"]');
  await page.waitForTimeout(300);
  r.afterCatVestidos = await resultTxt();

  // Añadir color Malva (#B4849F) -> combina (Vestidos AND Malva)
  await page.click('#filterPanel .swf[data-val="#B4849F"]');
  await page.waitForTimeout(300);
  r.afterCatAndColor = await resultTxt();
  r.activeChips = await page.$$eval('#activeChips .achip', (e) => e.map((x) => x.textContent.replace('✕', '').trim()));
  r.filterCount = await page.$eval('#filterCount', (e) => e.textContent);

  // Añadir talla XS
  await page.click('#filterPanel [data-facet="size"][data-val="XS"]');
  await page.waitForTimeout(300);
  r.afterAddSizeXS = await resultTxt();

  // Quitar un chip activo (el primero)
  await page.click('#activeChips .achip');
  await page.waitForTimeout(300);
  r.afterRemoveOneChip = await resultTxt();

  // Limpiar todo
  await page.click('#clearFilters');
  await page.waitForTimeout(300);
  r.afterClear = await resultTxt();
  r.activeRowHiddenAfterClear = await page.$eval('#activeRow', (e) => e.hidden);

  // Ocasión Noche
  await page.click('#filterPanel [data-facet="occasion"][data-val="Noche"]');
  await page.waitForTimeout(300);
  r.afterOcasionNoche = await resultTxt();
  await page.click('#clearFilters');
  await page.waitForTimeout(200);

  // Precio: mover el max a ~120 (deja sólo prendas baratas)
  await page.$eval('#prMax', (el) => {
    el.value = 120;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  r.afterPriceMax120 = await resultTxt();
  r.priceChip = await page.$$eval('#activeChips .achip', (e) => e.map((x) => x.textContent.replace('✕', '').trim()));

  await page.click('#clearFilters');
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#prendas').offsetTop - 20));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/filters-desktop.png` });

  console.log('DESKTOP', JSON.stringify(r, null, 2));
  console.log('JS_ERRORS:', errors.length ? errors : 'none');
  await ctx.close();
}

// ---------- MÓVIL: drawer de filtros ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('#prendas').scrollIntoView());
  await page.waitForTimeout(400);
  // El botón Filtrar debe verse
  const btnVisible = await page.$eval('#filterBtn', (e) => getComputedStyle(e).display !== 'none');
  await page.tap('#filterBtn');
  await page.waitForTimeout(500);
  const drawerOpen = await page.$eval('#filterPanel', (e) => e.classList.contains('open'));
  await page.screenshot({ path: `${out}/filters-mobile-drawer.png` });
  // seleccionar un par y ver resultados
  await page.tap('#filterPanel [data-facet="cat"][data-val="Tejidos"]');
  await page.tap('#filterPanel .swf[data-val="#E2D8CC"]');
  await page.waitForTimeout(300);
  await page.tap('[data-filter-close]');
  await page.waitForTimeout(400);
  const drawerClosed = await page.$eval('#filterPanel', (e) => !e.classList.contains('open'));
  const activeChips = await page.$$eval('#activeChips .achip', (e) => e.length);
  await page.evaluate(() => document.querySelector('#prendas').scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/filters-mobile-active.png` });
  console.log('MOBILE', JSON.stringify({ btnVisible, drawerOpen, drawerClosed, activeChips }, null, 2));
  await ctx.close();
}
await b.close();
