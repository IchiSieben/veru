// Lookbook: arrastrar para desplazar (drag-to-scroll) horizontal.
import { $ } from './data.js';

export function initLookbook() {
  const s = $('#lookbook-scroller');
  if (!s) return;
  let down = false,
    sx,
    sl;
  s.addEventListener('mousedown', (e) => {
    down = true;
    s.classList.add('drag');
    sx = e.pageX;
    sl = s.scrollLeft;
  });
  window.addEventListener('mouseup', () => {
    down = false;
    s.classList.remove('drag');
  });
  s.addEventListener('mouseleave', () => {
    down = false;
    s.classList.remove('drag');
  });
  s.addEventListener('mousemove', (e) => {
    if (!down) return;
    e.preventDefault();
    s.scrollLeft = sl - (e.pageX - sx) * 1.4;
  });
}
