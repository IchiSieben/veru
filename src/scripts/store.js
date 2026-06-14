// Estado de carrito y favoritos con persistencia en localStorage (Fase 2).
import { $ } from './data.js';

export const CART_KEY = 'veru.cart';
export const FAVS_KEY = 'veru.favs';
export const ORDERS_KEY = 'veru.orders';
export const LAST_ORDER_KEY = 'veru.lastOrder';

export const state = { cart: [], favs: [] };

export function load() {
  try {
    state.cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    state.favs = JSON.parse(localStorage.getItem(FAVS_KEY)) || [];
  } catch (e) {
    state.cart = [];
    state.favs = [];
  }
}

export function persist() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    localStorage.setItem(FAVS_KEY, JSON.stringify(state.favs));
  } catch (e) {
    /* almacenamiento no disponible (modo privado) — se sigue en memoria */
  }
}

export function clearCart() {
  state.cart = [];
  persist();
}

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
