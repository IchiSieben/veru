// Carrito: alta, render del drawer y subtotal. Imágenes vía thumb optimizado.
import { byId, money, $ } from './data.js';
import { state, updateBadges, bump, persist } from './store.js';
import { openDrawer } from './ui.js';

export function addToCart(id, size) {
  const p = byId(id);
  if (!p) return;
  const key = id + '-' + (size || p.sizes[1] || p.sizes[0]);
  const ex = state.cart.find((i) => i.key === key);
  if (ex) ex.q++;
  else state.cart.push({ key, id, size: size || p.sizes[1] || p.sizes[0], q: 1 });
  persist();
  renderCart();
  bump('#cartBadge');
  openDrawer('#cartDrawer');
}

export function renderCart() {
  const body = $('#cartBody');
  if (!body) return;
  if (!state.cart.length) {
    body.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24"><path d="M6 2l-2 5h16l-2-5"/><path d="M4 7v13a1 1 0 001 1h14a1 1 0 001-1V7"/></svg>
      <p>Tu carrito está vacío.</p></div>`;
    $('#cartFoot').style.display = 'none';
  } else {
    body.innerHTML = state.cart
      .map((i) => {
        const p = byId(i.id);
        return `<div class="citem">
        <div class="citem__img"><img src="${p.thumb}" alt="${p.name}" onerror="this.onerror=null;this.src=fb(this,'${p.name}',['#36202F','#17121B'])"></div>
        <div>
          <div class="citem__name">${p.name}</div>
          <div class="citem__meta">Talla ${i.size} · ${p.cat}</div>
          <div class="citem__price">${money(p.price)}</div>
          <div class="qty">
            <button data-dec="${i.key}" aria-label="Menos">−</button><span>${i.q}</span>
            <button data-inc="${i.key}" aria-label="Más">+</button>
          </div>
        </div>
        <button class="citem__rm" data-rm="${i.key}">Quitar</button>
      </div>`;
      })
      .join('');
    $('#cartFoot').style.display = 'block';
    $('#subtotal').textContent = money(
      state.cart.reduce((s, i) => s + byId(i.id).price * i.q, 0)
    );
  }
  body.querySelectorAll('[data-inc]').forEach(
    (b) =>
      (b.onclick = () => {
        state.cart.find((i) => i.key === b.dataset.inc).q++;
        persist();
        renderCart();
        bump('#cartBadge');
      })
  );
  body.querySelectorAll('[data-dec]').forEach(
    (b) =>
      (b.onclick = () => {
        const it = state.cart.find((i) => i.key === b.dataset.dec);
        it.q--;
        if (it.q <= 0) state.cart = state.cart.filter((i) => i !== it);
        persist();
        renderCart();
        updateBadges();
      })
  );
  body.querySelectorAll('[data-rm]').forEach(
    (b) =>
      (b.onclick = () => {
        state.cart = state.cart.filter((i) => i.key !== b.dataset.rm);
        persist();
        renderCart();
        updateBadges();
      })
  );
  updateBadges();
}
