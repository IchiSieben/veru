// Catálogo con filtros inteligentes combinables (categoría, color, talla, ocasión,
// precio) + orden + cargar más. Chips activos, limpiar, y panel drawer en móvil.
import { PRODUCTS, money, $ } from './data.js';
import { state } from './store.js';
import { addToCart } from './cart.js';
import { toggleFav } from './favs.js';
import { openQuick } from './quickview.js';
import { observe, tiltOn, openDrawer, closeAll } from './ui.js';
import { COLOR_NAMES } from '../config.js';

// Estado de filtros: conjuntos por faceta (OR dentro de cada faceta, AND entre facetas).
const F = { cat: new Set(), color: new Set(), size: new Set(), occasion: new Set() };
let PMIN = 0, PMAX = 0, priceLo = 0, priceHi = 0;
let shown = 8, sortBy = 'rel';

const colorLabel = (hex) => COLOR_NAMES[hex] || hex;

function priceActive() {
  return priceLo > PMIN || priceHi < PMAX;
}
function activeCount() {
  return F.cat.size + F.color.size + F.size.size + F.occasion.size + (priceActive() ? 1 : 0);
}

function matches(p) {
  if (F.cat.size && !F.cat.has(p.cat)) return false;
  if (F.color.size && !p.colors.some((c) => F.color.has(c))) return false;
  if (F.size.size && !p.sizes.some((s) => F.size.has(s))) return false;
  if (F.occasion.size && !(p.tags || []).some((t) => F.occasion.has(t))) return false;
  if (p.price < priceLo || p.price > priceHi) return false;
  return true;
}

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
      <img class="card__img card__img--main" src="${p.imgs[0]}" srcset="${p.srcset[0]}" sizes="${p.sizesAttr}" alt="${p.name}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.removeAttribute('srcset');this.src=fb(this,'${p.name}',['#36202F','#17121B'])">
      <img class="card__img card__img--alt" src="${p.imgs[1]}" srcset="${p.srcset[1]}" sizes="${p.sizesAttr}" alt="" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.removeAttribute('srcset');this.src=fb(this,'${p.name}',['#492C3F','#8B5A77'])">
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
  const list = sortList(PRODUCTS.filter(matches));
  const count = $('#resultCount');
  if (count) count.textContent = `${list.length} ${list.length === 1 ? 'prenda' : 'prendas'}`;

  if (!list.length) {
    grid.innerHTML = `<div class="grid-empty">
      <p>No hay prendas con esos filtros.</p>
      <button class="btn btn--ghost" id="emptyClear">Limpiar filtros</button>
    </div>`;
    $('#loadMore').style.display = 'none';
    const ec = $('#emptyClear');
    if (ec) ec.onclick = clearAll;
    return;
  }

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
    (b) => (b.onclick = (e) => { e.stopPropagation(); addToCart(+b.dataset.add); })
  );
  document.querySelectorAll('[data-fav]').forEach(
    (b) => (b.onclick = (e) => { e.stopPropagation(); toggleFav(+b.dataset.fav); })
  );
  document.querySelectorAll('[data-quick]').forEach(
    (b) => (b.onclick = (e) => { e.stopPropagation(); openQuick(+b.dataset.quick); })
  );
  document.querySelectorAll('.swatches').forEach((s) =>
    s.querySelectorAll('.sw').forEach(
      (sw) => (sw.onclick = (e) => {
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
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Facetas ---------- */
function syncFacetUI() {
  document.querySelectorAll('#filterPanel [data-facet]').forEach((b) => {
    const set = F[b.dataset.facet];
    const on = set && set.has(b.dataset.val);
    b.classList.toggle(b.classList.contains('swf') ? 'on' : 'active', !!on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function toggleFacet(type, val) {
  const set = F[type];
  set.has(val) ? set.delete(val) : set.add(val);
  shown = 8;
  refresh();
}

function clearAll() {
  F.cat.clear(); F.color.clear(); F.size.clear(); F.occasion.clear();
  priceLo = PMIN; priceHi = PMAX;
  const mn = $('#prMin'), mx = $('#prMax');
  if (mn) mn.value = PMIN;
  if (mx) mx.value = PMAX;
  shown = 8;
  updateRange();
  refresh();
}

/* ---------- Chips activos + conteo ---------- */
function chipHTML(facet, val, label, extra = '') {
  return `<button class="achip" data-rmfacet="${facet}" data-rmval="${val}">${extra}${label}<span class="achip__x" aria-hidden="true">✕</span></button>`;
}
function renderActive() {
  const row = $('#activeRow'), wrap = $('#activeChips');
  if (!wrap) return;
  const chips = [];
  F.cat.forEach((v) => chips.push(chipHTML('cat', v, v)));
  F.color.forEach((v) =>
    chips.push(chipHTML('color', v, colorLabel(v), `<span class="achip__sw" style="background:${v}"></span>`))
  );
  F.size.forEach((v) => chips.push(chipHTML('size', v, 'Talla ' + v)));
  F.occasion.forEach((v) => chips.push(chipHTML('occasion', v, v)));
  if (priceActive()) chips.push(chipHTML('price', 'price', `S/${priceLo} – S/${priceHi}`));

  wrap.innerHTML = chips.join('');
  wrap.querySelectorAll('[data-rmfacet]').forEach(
    (b) => (b.onclick = () => {
      const f = b.dataset.rmfacet;
      if (f === 'price') {
        priceLo = PMIN; priceHi = PMAX;
        const mn = $('#prMin'), mx = $('#prMax');
        if (mn) mn.value = PMIN;
        if (mx) mx.value = PMAX;
        updateRange();
      } else {
        F[f].delete(b.dataset.rmval);
      }
      shown = 8;
      refresh();
    })
  );

  const n = activeCount();
  if (row) row.hidden = n === 0;
  const badge = $('#filterCount');
  if (badge) {
    badge.hidden = n === 0;
    badge.textContent = n;
  }
  const btn = $('#filterBtn');
  if (btn) btn.classList.toggle('has-active', n > 0);
}

/* ---------- Rango de precio ---------- */
function updateRange() {
  const span = PMAX - PMIN || 1;
  const fill = $('#prFill');
  if (fill) {
    fill.style.left = ((priceLo - PMIN) / span) * 100 + '%';
    fill.style.width = ((priceHi - priceLo) / span) * 100 + '%';
  }
  const lo = $('#prMinL'), hi = $('#prMaxL');
  if (lo) lo.textContent = 'S/' + priceLo;
  if (hi) hi.textContent = 'S/' + priceHi;
}

function initPrice() {
  const range = $('#priceRange');
  if (!range) return;
  PMIN = +range.dataset.min;
  PMAX = +range.dataset.max;
  priceLo = PMIN;
  priceHi = PMAX;
  const mn = $('#prMin'), mx = $('#prMax');
  mn.oninput = () => {
    let v = +mn.value;
    if (v > priceHi) { v = priceHi; mn.value = v; }
    priceLo = v;
    shown = 8;
    updateRange();
    refresh(false);
  };
  mx.oninput = () => {
    let v = +mx.value;
    if (v < priceLo) { v = priceLo; mx.value = v; }
    priceHi = v;
    shown = 8;
    updateRange();
    refresh(false);
  };
  updateRange();
}

/* ---------- Orquestación ---------- */
function refresh(syncUI = true) {
  if (syncUI) syncFacetUI();
  renderGrid();
  renderActive();
}

export function initCatalog() {
  if (!$('#grid')) return;

  initPrice();

  // Botones de faceta (chips + swatches).
  document.querySelectorAll('#filterPanel [data-facet]').forEach((b) =>
    b.addEventListener('click', () => toggleFacet(b.dataset.facet, b.dataset.val))
  );

  // Mosaico de categorías de la home -> filtra por esa categoría.
  document.querySelectorAll('#cats .cat').forEach((el) =>
    el.addEventListener('click', () => {
      F.cat.clear();
      F.cat.add(el.dataset.cat);
      shown = 8;
      refresh();
    })
  );

  // Limpiar.
  const clearBtn = $('#clearFilters');
  if (clearBtn) clearBtn.onclick = clearAll;
  document.querySelectorAll('[data-filter-clear]').forEach((b) => (b.onclick = clearAll));

  // Drawer de filtros (móvil).
  const fbtn = $('#filterBtn');
  if (fbtn)
    fbtn.onclick = () => {
      openDrawer('#filterPanel');
      fbtn.setAttribute('aria-expanded', 'true');
    };
  document.querySelectorAll('[data-filter-close]').forEach(
    (b) => (b.onclick = () => { closeAll(); if (fbtn) fbtn.setAttribute('aria-expanded', 'false'); })
  );

  // Orden y cargar más.
  $('#sort').onchange = (e) => { sortBy = e.target.value; renderGrid(); };
  $('#loadMore').onclick = () => { shown += 8; renderGrid(); };

  refresh();
}
