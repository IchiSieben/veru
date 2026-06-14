// Catálogo: grilla dinámica (filtro/orden/cargar más), favoritos, vista rápida, tilt 3D.
import { PRODUCTS, money, $ } from './data.js';
import { state } from './store.js';
import { addToCart } from './cart.js';
import { toggleFav } from './favs.js';
import { openQuick } from './quickview.js';
import { observe, tiltOn } from './ui.js';

let shown = 8,
  filter = 'Todos',
  sortBy = 'rel';

function sortList(list) {
  const l = [...list];
  if (sortBy === 'low') l.sort((a, b) => a.price - b.price);
  else if (sortBy === 'high') l.sort((a, b) => b.price - a.price);
  else if (sortBy === 'new') l.sort((a, b) => (b.badge === 'new') - (a.badge === 'new'));
  return l;
}

function cardHTML(p) {
  const tag =
    p.badge === 'sale'
      ? `<span class="tag tag--sale">−${Math.round((1 - p.price / p.old) * 100)}%</span>`
      : p.badge === 'new'
      ? `<span class="tag tag--new">Nuevo</span>`
      : '';
  return `
  <article class="card" data-id="${p.id}">
    <div class="card__frame js-tilt">
      <div class="card__tags">${tag}</div>
      <button class="fav${state.favs.includes(p.id) ? ' on' : ''}" data-fav="${p.id}" aria-label="Favorito">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.4C.5 8.2 2 4.5 5.5 4.5 8 4.5 9.6 6 12 8.7 14.4 6 16 4.5 18.5 4.5 22 4.5 23.5 8.2 22 11.6 19.5 16.4 12 21 12 21z"/></svg>
      </button>
      <img class="card__img card__img--main" src="${p.imgs[0]}" alt="${p.name}" loading="lazy"
           onerror="this.onerror=null;this.src=fb(this,'${p.name}',['#36202F','#17121B'])">
      <img class="card__img card__img--alt" src="${p.imgs[1]}" alt="" loading="lazy"
           onerror="this.onerror=null;this.src=fb(this,'${p.name}',['#492C3F','#8B5A77'])">
      <div class="card__quick">
        <button class="quick-btn" data-add="${p.id}">Agregar</button>
        <button class="quick-btn quick-btn--ghost" data-quick="${p.id}" aria-label="Vista rápida">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        </button>
      </div>
    </div>
    <div class="card__body">
      <div class="card__row">
        <span class="card__name">${p.name}</span>
        <span class="card__price">${p.old ? `<s>${money(p.old)}</s>` : ''}${money(p.price)}</span>
      </div>
      <div class="card__cat">${p.cat}</div>
      <div class="swatches">${p.colors
        .map((c, i) => `<span class="sw${i === 0 ? ' active' : ''}" style="background:${c}" title="color"></span>`)
        .join('')}</div>
    </div>
  </article>`;
}

function renderGrid() {
  const grid = $('#grid');
  if (!grid) return;
  let list = PRODUCTS.filter((p) => filter === 'Todos' || p.cat === filter);
  list = sortList(list);
  const vis = list.slice(0, shown);
  grid.innerHTML = vis.map(cardHTML).join('');
  $('#loadMore').style.display = shown >= list.length ? 'none' : 'inline-flex';
  bindCards();
  document.querySelectorAll('#grid .card').forEach((c) => {
    c.classList.add('r-up');
    observe(c);
  });
}

function bindCards() {
  document.querySelectorAll('[data-add]').forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        addToCart(+b.dataset.add);
      })
  );
  document.querySelectorAll('[data-fav]').forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        toggleFav(+b.dataset.fav);
      })
  );
  document.querySelectorAll('[data-quick]').forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        openQuick(+b.dataset.quick);
      })
  );
  document.querySelectorAll('.swatches').forEach((s) =>
    s.querySelectorAll('.sw').forEach(
      (sw) =>
        (sw.onclick = (e) => {
          e.stopPropagation();
          s.querySelectorAll('.sw').forEach((x) => x.classList.remove('active'));
          sw.classList.add('active');
        })
    )
  );
  document.querySelectorAll('.card').forEach((c) =>
    c.addEventListener('click', () => openQuick(+c.dataset.id))
  );
  initTilt();
}

/* Tilt 3D (sigue el cursor) — sólo puntero fino. */
function initTilt() {
  if (!tiltOn) return;
  document.querySelectorAll('.js-tilt').forEach((el) => {
    if (el._tilt) return;
    el._tilt = true;
    let raf = null;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5,
        py = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
      });
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

function setFilter(c) {
  filter = c;
  shown = 8;
  document
    .querySelectorAll('#chips .chip')
    .forEach((b) => b.classList.toggle('active', b.dataset.c === c));
  renderGrid();
}

export function initCatalog() {
  if (!$('#grid')) return;
  // Chips de categoría.
  document.querySelectorAll('#chips .chip').forEach((b) => (b.onclick = () => setFilter(b.dataset.c)));
  // Mosaico de categorías -> filtra el catálogo.
  document.querySelectorAll('#cats .cat').forEach((el) =>
    el.addEventListener('click', () => setFilter(el.dataset.cat))
  );
  // Orden y cargar más.
  $('#sort').onchange = (e) => {
    sortBy = e.target.value;
    renderGrid();
  };
  $('#loadMore').onclick = () => {
    shown += 8;
    renderGrid();
  };
  renderGrid();
}
