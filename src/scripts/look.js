// "Arma tu look" — configurador por zonas (torso multi-capa, abajo, vestido especial).
import { PRODUCTS, byId, $ } from './data.js';
import { addToCart } from './cart.js';

const LOOK = { torso: [], bottom: null, dress: null, shoes: null, accessory: null };
let origHints = {};

const rmIcon = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

function selectedIds() {
  if (LOOK.dress) return [LOOK.dress, LOOK.shoes, LOOK.accessory].filter(Boolean);
  return [...LOOK.torso, LOOK.bottom, LOOK.shoes, LOOK.accessory].filter(Boolean);
}

/* ---------- Lienzo ---------- */
function bpieceHTML(p, kind) {
  return `<div class="bpiece">
    <img src="${p.imgs[0]}" alt="${p.name}" onerror="this.onerror=null;this.removeAttribute('srcset');this.src=fb(this,'${p.name}',['#36202F','#17121B'])">
    <button class="bpiece__rm" data-rm="${kind}:${p.id}" aria-label="Quitar ${p.name}">${rmIcon}</button>
    <span class="bpiece__tag"><b>${p.name}</b><span>S/${p.price}</span></span>
  </div>`;
}

function renderBoard() {
  const dressBZ = document.querySelector('[data-board="dress"]');
  const torsoBZ = document.querySelector('[data-board="torso"]');
  const bottomBZ = document.querySelector('[data-board="bottom"]');

  if (LOOK.dress) {
    dressBZ.hidden = false;
    dressBZ.innerHTML = bpieceHTML(byId(LOOK.dress), 'dress');
    torsoBZ.hidden = true;
    bottomBZ.hidden = true;
    torsoBZ.innerHTML = '';
    bottomBZ.innerHTML = '';
  } else {
    dressBZ.hidden = true;
    dressBZ.innerHTML = '';
    torsoBZ.hidden = false;
    bottomBZ.hidden = false;
    torsoBZ.innerHTML = LOOK.torso.length
      ? LOOK.torso.map((id) => bpieceHTML(byId(id), 'torso')).join('')
      : `<div class="board__empty">Tus capas van aquí</div>`;
    bottomBZ.innerHTML = LOOK.bottom
      ? bpieceHTML(byId(LOOK.bottom), 'bottom')
      : `<div class="board__empty">Elige una prenda de abajo</div>`;
  }

  document.querySelectorAll('#lookBoard .bpiece__rm').forEach(
    (b) => (b.onclick = () => removePiece(b.dataset.rm))
  );
}

/* ---------- Lista de capas ---------- */
function renderLayers() {
  const ul = $('#layerList');
  if (!ul) return;
  ul.innerHTML = LOOK.torso
    .map((id, i) => {
      const p = byId(id);
      const last = LOOK.torso.length - 1;
      return `<li class="layer-row">
        <span class="layer-row__img"><img src="${p.thumb}" alt="" onerror="this.onerror=null;this.src=fb(this,'',['#36202F','#17121B'])"></span>
        <span class="layer-row__name">${p.name}</span>
        <span class="layer-row__price">S/${p.price}</span>
        <span class="layer-row__btns">
          <button data-mv="up:${i}" aria-label="Mover capa atrás" ${i === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button>
          <button data-mv="down:${i}" aria-label="Mover capa al frente" ${i === last ? 'disabled' : ''}><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
          <button data-rml="${id}" aria-label="Quitar ${p.name}">${rmIcon}</button>
        </span>
      </li>`;
    })
    .join('');

  ul.querySelectorAll('[data-mv]').forEach(
    (b) => (b.onclick = () => {
      const [dir, idx] = b.dataset.mv.split(':');
      const i = +idx;
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= LOOK.torso.length) return;
      [LOOK.torso[i], LOOK.torso[j]] = [LOOK.torso[j], LOOK.torso[i]];
      render();
    })
  );
  ul.querySelectorAll('[data-rml]').forEach(
    (b) => (b.onclick = () => removePiece('torso:' + b.dataset.rml))
  );
}

/* ---------- Tiras / estado ---------- */
function renderStrips() {
  document.querySelectorAll('.piece').forEach((b) => {
    const id = +b.dataset.id;
    const zone = b.dataset.zone;
    let on = false;
    if (zone === 'torso') on = LOOK.torso.includes(id);
    else on = LOOK[zone] === id;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function updateZones() {
  const dressActive = !!LOOK.dress;
  ['Torso', 'Bottom'].forEach((z) => {
    const zone = $('#zone' + z);
    if (!zone) return;
    zone.classList.toggle('zone--disabled', dressActive);
    const hint = zone.querySelector('.zone__hint');
    if (hint) hint.textContent = dressActive ? '— bloqueado por el vestido —' : origHints[z];
  });
}

function renderTotal() {
  const ids = selectedIds();
  const total = ids.reduce((s, id) => s + byId(id).price, 0);
  $('#lookTotal').textContent = 'S/' + total;
  $('#lookCount').textContent = ids.length + (ids.length === 1 ? ' pieza' : ' piezas');
  $('#lookAdd').disabled = ids.length === 0;
}

function render() {
  renderBoard();
  renderLayers();
  renderStrips();
  updateZones();
  renderTotal();
}

/* ---------- Acciones ---------- */
function removePiece(token) {
  const [kind, idStr] = token.split(':');
  const id = +idStr;
  if (kind === 'torso') LOOK.torso = LOOK.torso.filter((x) => x !== id);
  else if (kind === 'bottom') LOOK.bottom = null;
  else if (kind === 'dress') LOOK.dress = null;
  else LOOK[kind] = null;
  render();
}

function onPieceClick(zone, id) {
  if (zone === 'torso') {
    if (LOOK.dress) return; // bloqueado
    LOOK.torso.includes(id)
      ? (LOOK.torso = LOOK.torso.filter((x) => x !== id))
      : LOOK.torso.push(id);
  } else if (zone === 'bottom') {
    if (LOOK.dress) return;
    LOOK.bottom = LOOK.bottom === id ? null : id;
  } else if (zone === 'dress') {
    LOOK.dress = LOOK.dress === id ? null : id;
  } else {
    LOOK[zone] = LOOK[zone] === id ? null : id;
  }
  render();
}

function addLook() {
  const ids = selectedIds();
  if (!ids.length) return;
  ids.forEach((id) => addToCart(id));
}

// Sorpréndeme: combinación coherente por ocasión (se refinará con pins/filtros en la Parte B).
function surprise() {
  const tagsAll = [...new Set(PRODUCTS.flatMap((p) => p.tags || []))];
  const occ = tagsAll[Math.floor(Math.random() * tagsAll.length)];
  const inOcc = (p) => (p.tags || []).includes(occ);
  const pick = (zone) => {
    const all = PRODUCTS.filter((p) => p.zone === zone);
    const pool = all.filter(inOcc).length ? all.filter(inOcc) : all;
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
  };
  LOOK.torso = [];
  LOOK.bottom = null;
  LOOK.dress = null;

  const dresses = PRODUCTS.filter((p) => p.zone === 'dress');
  if (Math.random() < 0.34 && dresses.length) {
    LOOK.dress = pick('dress');
  } else {
    const top = pick('top');
    if (top) LOOK.torso.push(top);
    if (Math.random() < 0.6) {
      const layer = pick('layer');
      if (layer && !LOOK.torso.includes(layer)) LOOK.torso.push(layer);
    }
    LOOK.bottom = pick('bottom');
  }
  render();
}

function flash(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
}

export function initLook() {
  if (!$('#look')) return;

  // Hints originales para restaurar tras quitar el vestido.
  ['Torso', 'Bottom'].forEach((z) => {
    const h = document.querySelector('#zone' + z + ' .zone__hint');
    origHints[z] = h ? h.textContent : '';
  });

  document.querySelectorAll('.piece').forEach((b) =>
    b.addEventListener('click', () => onPieceClick(b.dataset.zone, +b.dataset.id))
  );

  const addLayer = $('#addLayer');
  if (addLayer) addLayer.onclick = () => flash($('#stripTorso'));

  const addBtn = $('#lookAdd');
  if (addBtn) addBtn.onclick = addLook;
  const surpriseBtn = $('#lookSurprise');
  if (surpriseBtn) surpriseBtn.onclick = surprise;

  render();
}
