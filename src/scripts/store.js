// Estado de carrito y favoritos + helpers de badge.
// Fase 1: en memoria (paridad 1:1 con el original). La persistencia llega en Fase 2.
import { $ } from './data.js';

export const state = { cart: [], favs: [] };

export function set(sel, n) {
  const b = $(sel);
  if (!b) return;
  b.textContent = n;
  b.classList.toggle('show', n > 0);
}

export function updateBadges() {
  const c = state.cart.reduce((s, i) => s + i.q, 0);
  set('#cartBadge', c);
  set('#favBadge', state.favs.length);
}

export function bump(sel) {
  const b = $(sel);
  if (!b) return;
  b.classList.add('show');
  b.style.transform = 'scale(1.3)';
  setTimeout(() => (b.style.transform = 'scale(1)'), 180);
  updateBadges();
}
