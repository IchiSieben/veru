import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:4321';
const out = 'reference/shots';
fs.mkdirSync(out, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
// Capturar window.open (handoff WhatsApp) en localStorage para inspeccionarlo tras el redirect.
await ctx.addInitScript(() => {
  window.open = function (u) {
    try {
      localStorage.setItem('test.wa', u);
    } catch (e) {}
    return null;
  };
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

const r = {};

// 1) Agregar al carrito en la home y comprobar persistencia tras recargar.
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.$eval('#grid .card [data-add]', (b) => b.click());
await page.waitForTimeout(400);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
r.badgeAfterReload = await page.$eval('#cartBadge', (e) => e.textContent);

// 2) Ir a checkout y revisar resumen + totales (subtotal 189 < 199 => envío S/15).
await page.goto(`${BASE}/checkout/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
r.lines = await page.$$eval('#coLines .co-line', (e) => e.length);
r.subtotal = await page.$eval('#coSubtotal', (e) => e.textContent);
r.ship = await page.$eval('#coShip', (e) => e.textContent);
r.total = await page.$eval('#coTotal', (e) => e.textContent);

// 3) Toggle de pago a Plin.
await page.$$eval('#coPays input[name="pay"]', (rs) => rs.find((x) => x.value === 'Plin').click());
await page.waitForTimeout(200);
r.plinDetailVisible = await page.$eval('.pay-detail[data-pay="Plin"]', (e) => e.style.display !== 'none');
// volver a Yape
await page.$$eval('#coPays input[name="pay"]', (rs) => rs.find((x) => x.value === 'Yape').click());

// 4) Enviar formulario vacío -> validación.
await page.$eval('#coSubmit', (b) => b.click());
await page.waitForTimeout(300);
r.invalidFields = await page.$$eval('.field.invalid', (e) => e.length);
r.stillOnCheckout = page.url().includes('/checkout');

// 5) Llenar y enviar.
await page.fill('#co-name', 'María Gómez');
await page.fill('#co-phone', '987654321');
await page.fill('#co-district', 'Miraflores');
await page.fill('#co-address', 'Av. Larco 123, dpto 502');
await page.screenshot({ path: `${out}/checkout-desktop.png`, fullPage: true });
await page.$eval('#coSubmit', (b) => b.click());
await page.waitForURL('**/pedido-confirmado*', { timeout: 8000 });
await page.waitForTimeout(600);

// 6) Confirmación.
r.confirmUrl = page.url();
r.okCode = await page.$eval('#okCode', (e) => e.textContent);
r.badgeAfterOrder = await page.$eval('#cartBadge', (e) => e.textContent);
r.waUrl = await page.evaluate(() => localStorage.getItem('test.wa'));
r.waHasName = r.waUrl ? r.waUrl.includes('Vestido') : false;
r.waHasCode = r.waUrl ? r.waUrl.includes(r.okCode) : false;
await page.screenshot({ path: `${out}/confirm-desktop.png`, fullPage: true });

console.log(JSON.stringify(r, null, 2));
console.log('JS_ERRORS:', errors.length ? errors : 'none');
await b.close();
