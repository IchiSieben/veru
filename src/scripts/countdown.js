// Cuenta regresiva al próximo drop: viernes 20:00.
import { $ } from './data.js';

function nextFriday() {
  const n = new Date();
  const d = new Date(n);
  d.setHours(20, 0, 0, 0);
  let add = (5 - n.getDay() + 7) % 7;
  if (add === 0 && n.getHours() >= 20) add = 7;
  d.setDate(n.getDate() + add);
  return d;
}

export function initCountdown() {
  if (!$('#cd-d')) return;
  let target = nextFriday();
  const p = (x) => String(x).padStart(2, '0');
  function tick() {
    let diff = target - new Date();
    if (diff < 0) {
      target = nextFriday();
      diff = target - new Date();
    }
    const d = Math.floor(diff / 864e5),
      h = Math.floor((diff % 864e5) / 36e5),
      m = Math.floor((diff % 36e5) / 6e4),
      s = Math.floor((diff % 6e4) / 1e3);
    $('#cd-d').textContent = p(d);
    $('#cd-h').textContent = p(h);
    $('#cd-m').textContent = p(m);
    $('#cd-s').textContent = p(s);
  }
  tick();
  setInterval(tick, 1000);
}
