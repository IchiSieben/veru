// Favoritos: toggle + render del drawer.
import { byId, money, $ } from './data.js';
import { state, updateBadges, bump } from './store.js';
import { addToCart } from './cart.js';

export function toggleFav(id) {
  state.favs.includes(id)
    ? (state.favs = state.favs.filter((f) => f !== id))
    : (state.favs.push(id), bump('#favBadge'));
  document
    .querySelectorAll(`[data-fav="${id}"]`)
    .forEach((b) => b.classList.toggle('on', state.favs.includes(id)));
  renderFavs();
  updateBadges();
}

export function renderFavs() {
  const body = $('#favBody');
  if (!body) return;
  if (!state.favs.length) {
    body.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.4C.5 8.2 2 4.5 5.5 4.5 8 4.5 9.6 6 12 8.7 14.4 6 16 4.5 18.5 4.5 22 4.5 23.5 8.2 22 11.6 19.5 16.4 12 21 12 21z"/></svg>
      <p>Aún no tienes favoritos.</p></div>`;
    return;
  }
  body.innerHTML = state.favs
    .map((id) => {
      const p = byId(id);
      return `<div class="citem">
      <div class="citem__img"><img src="${p.thumb}" alt="${p.name}" onerror="this.onerror=null;this.src=fb(this,'${p.name}',['#36202F','#17121B'])"></div>
      <div>
        <div class="citem__name">${p.name}</div>
        <div class="citem__meta">${p.cat}</div>
        <div class="citem__price">${money(p.price)}</div>
        <button class="btn btn--mauve" style="padding:.5em 1em;font-size:.7rem;margin-top:8px" data-fadd="${id}">Agregar</button>
      </div>
      <button class="citem__rm" data-frm="${id}">Quitar</button>
    </div>`;
    })
    .join('');
  body.querySelectorAll('[data-fadd]').forEach((b) => (b.onclick = () => addToCart(+b.dataset.fadd)));
  body.querySelectorAll('[data-frm]').forEach((b) => (b.onclick = () => toggleFav(+b.dataset.frm)));
}
