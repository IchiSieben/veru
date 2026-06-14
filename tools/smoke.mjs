import { chromium } from 'playwright';

const NEW = 'http://localhost:4321/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});

await page.goto(NEW, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const results = {};

// 1) Grid renderizó tarjetas
results.cards = await page.$$eval('#grid .card', (els) => els.length);

// 2) Agregar al carrito -> badge y drawer
await page.$eval('#grid .card [data-add]', (b) => b.click());
await page.waitForTimeout(500);
results.cartBadge = await page.$eval('#cartBadge', (e) => e.textContent);
results.cartDrawerOpen = await page.$eval('#cartDrawer', (e) => e.classList.contains('open'));
results.subtotal = await page.$eval('#subtotal', (e) => e.textContent);

// cerrar drawer
await page.$eval('#cartDrawer [data-close]', (b) => b.click());
await page.waitForTimeout(300);

// 3) Quick view
await page.$eval('#grid .card [data-quick]', (b) => b.click());
await page.waitForTimeout(500);
results.modalOpen = await page.$eval('#modal', (e) => e.classList.contains('open'));
results.modalName = await page.$eval('#modalName', (e) => e.textContent);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// 4) Favorito
await page.$eval('#grid .card [data-fav]', (b) => b.click());
await page.waitForTimeout(300);
results.favBadge = await page.$eval('#favBadge', (e) => e.textContent);

// 5) Filtro por chip
const chips = await page.$$('#chips .chip');
await chips[1].click();
await page.waitForTimeout(400);
results.filteredCards = await page.$$eval('#grid .card', (els) => els.length);
results.activeChip = await page.$eval('#chips .chip.active', (e) => e.textContent);

// 6) Countdown corriendo
results.countdown = await page.$eval('#cd-h', (e) => e.textContent);

console.log(JSON.stringify(results, null, 2));
console.log('JS_ERRORS:', errors.length ? errors : 'none');
await b.close();
