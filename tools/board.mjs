import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const p = await ctx.newPage();
await p.goto('http://localhost:4321/arma-tu-look/',{waitUntil:'networkidle'});
await p.waitForTimeout(500);
// armar: 1 top base + 1 layer + bottom
const tops = await p.$$('#stripTorso .piece');
await tops[5].evaluate(e=>e.click());  // top
await tops[0].evaluate(e=>e.click());  // layer (abrigo)
await p.$eval('#stripBottom .piece:nth-child(2)', e=>e.click());
await p.waitForTimeout(400);
await p.$eval('#lookBoard', e=>e.scrollIntoView());
await p.waitForTimeout(300);
await p.$eval('#lookBoard', e=>e.click()); // noop focus
await (await p.$('#lookBoard')).screenshot({path:'reference/shots/look-board-closeup.png'});
// dress closeup
await p.$eval('#stripDress .piece:nth-child(3)', e=>e.click());
await p.waitForTimeout(400);
await (await p.$('#lookBoard')).screenshot({path:'reference/shots/look-board-dress.png'});
await b.close();
