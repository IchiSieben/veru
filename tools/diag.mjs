import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
const p = await ctx.newPage();
await p.goto('http://localhost:4321/producto/vestido-lucuma/',{waitUntil:'networkidle'});
await p.waitForTimeout(400);
const r = await p.evaluate(()=>{
  const cs = (sel)=>{ const el=document.querySelector(sel); if(!el) return 'missing'; const c=getComputedStyle(el); return {minW:c.minWidth,minH:c.minHeight,h:c.height,w:c.width,pad:c.padding}; };
  return {
    coarse: matchMedia('(hover:none) and (pointer:coarse)').matches,
    hoverNone: matchMedia('(hover:none)').matches,
    pointerCoarse: matchMedia('(pointer:coarse)').matches,
    size: cs('#pdpSizes .size'),
    qty: cs('.pdp .qty button') || 'n/a',
  };
});
console.log(JSON.stringify(r,null,2));
await b.close();
