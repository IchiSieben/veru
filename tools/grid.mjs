import { chromium } from 'playwright';
import path from 'node:path';

const ORIGINAL = 'file:///' + path.resolve('reference/original.html').replace(/\\/g, '/');
const NEW = 'http://localhost:4321/';

const b = await chromium.launch();
for (const [label, url] of [
  ['original', ORIGINAL],
  ['new', NEW],
]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  } catch {
    await p.goto(url, { waitUntil: 'load', timeout: 60000 });
  }
  await p.waitForTimeout(1200);
  const el = await p.$('#grid');
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  await el.screenshot({ path: `reference/shots/grid-${label}.png` });
  console.log('grid', label);
  await ctx.close();
}
await b.close();
