import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const ORIGINAL = 'file:///' + path.resolve('reference/original.html').replace(/\\/g, '/');
const NEW = 'http://localhost:4321/';
const out = 'reference/shots';
fs.mkdirSync(out, { recursive: true });

const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const targets = [
  { label: 'original', url: ORIGINAL },
  { label: 'new', url: NEW },
];

async function settle(page) {
  // Desplazar para disparar lazy-load y reveals, luego volver arriba.
  await page.evaluate(
    () =>
      new Promise((res) => {
        let y = 0;
        const i = setInterval(() => {
          window.scrollTo(0, y);
          y += 600;
          if (y > document.body.scrollHeight) {
            clearInterval(i);
            res();
          }
        }, 30);
      })
  );
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
for (const v of views) {
  for (const t of targets) {
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    try {
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
      await page.goto(t.url, { waitUntil: 'load', timeout: 60000 });
    }
    await settle(page);
    const file = `${out}/${v.name}-${t.label}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`shot ${v.name}-${t.label}  (${kb}kB)`);
    await ctx.close();
  }
}
await browser.close();
console.log('done');
