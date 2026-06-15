// "Arma tu look" — configurador por zonas (torso multi-capa, abajo, vestido especial).
// Parte B: filtros del selector (color/ocasión), fijar piezas (pin), "Sorpréndeme"
// que respeta lo fijado, y compartir el look por URL (Web Share en móvil / copiar en desktop).
import { PRODUCTS, byId, $ } from './data.js';
import { addToCart } from './cart.js';
import { COLOR_NAMES } from '../config.js';

const LOOK = { torso: [], bottom: null, dress: null, shoes: null, accessory: null };
const PINS = new Set();                       // ids "fijados": Sorpréndeme los conserva.
const LF = { color: new Set(), occasion: new Set() }; // filtros del selector (OR dentro, AND entre).
let origHints = {};

const rmIcon = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
const pinIcon = `<svg viewBox="0 0 24 24"><path d="M12 17v5M9 3h6l-1 7 3 3H7l3-3-1-7z"/></svg>`;

const TORSO_ZONES = ['top', 'layer'];
const hasZone = (zone) => PRODUCTS.some((p) => p.zone === zone);

function selectedIds() {
  if (LOOK.dress) return [LOOK.dress, LOOK.shoes, LOOK.accessory].filter(Boolean);
  return [...LOOK.torso, LOOK.bottom, LOOK.shoes, LOOK.accessory].filter(Boolean);
}

/* ---------- Lienzo ---------- */
function bpieceHTML(p, kind) {
  const pinned = PINS.has(p.id);
  return `<div class="bpiece${pinned ? ' pinned' : ''}">
    <img src="${p.imgs[0]}" alt="${p.name}" onerror="this.onerror=null;this.removeAttribute('srcset');this.src=fb(this,'${p.name}',['#36202F','#17121B'])">
    <button class="bpiece__pin" data-pin="${p.id}" aria-pressed="${pinned}" aria-label="${pinned ? 'Soltar' : 'Fijar'} ${p.name}">${pinIcon}</button>
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
  document.querySelectorAll('#lookBoard .bpiece__pin').forEach(
    (b) => (b.onclick = () => togglePin(+b.dataset.pin))
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

  // Compartir: visible solo si hay algo que compartir; el aviso "copiado" se limpia al cambiar.
  const shareBtn = $('#lookShare');
  if (shareBtn) shareBtn.hidden = ids.length === 0;
  const shared = $('#lookShared');
  if (shared) shared.hidden = true;
}

function render() {
  // Mantener PINS coherentes: un pin solo vale si la pieza sigue en el look.
  [...PINS].forEach((id) => {
    if (!selectedIds().includes(id)) PINS.delete(id);
  });
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
  PINS.delete(id);
  render();
}

function togglePin(id) {
  PINS.has(id) ? PINS.delete(id) : PINS.add(id);
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

/* ---------- Filtros del selector (color + ocasión) ---------- */
function buildFilters() {
  const wrap = $('#lookFilters');
  if (!wrap) return;
  const colors = [...new Set(PRODUCTS.flatMap((p) => p.colors || []))];
  const tags = [...new Set(PRODUCTS.flatMap((p) => p.tags || []))];

  wrap.innerHTML =
    `<div class="look-filters__group">
      <span class="look-filters__lbl">Color</span>
      ${colors
        .map((hex) => {
          const name = COLOR_NAMES[hex] || hex;
          return `<button class="swf" data-facet="color" data-val="${hex}" title="${name}" aria-label="${name}" aria-pressed="false"><span style="background:${hex}"></span></button>`;
        })
        .join('')}
    </div>
    <div class="look-filters__group">
      <span class="look-filters__lbl">Ocasión</span>
      ${tags
        .map((t) => `<button class="chip" data-facet="occasion" data-val="${t}" aria-pressed="false">${t}</button>`)
        .join('')}
    </div>
    <button class="lf-clear" id="lfClear" type="button" hidden>Limpiar</button>`;

  wrap.hidden = false;
  wrap.querySelectorAll('[data-facet]').forEach((b) =>
    b.addEventListener('click', () => toggleFilter(b.dataset.facet, b.dataset.val))
  );
  const clear = $('#lfClear');
  if (clear) clear.onclick = clearFilters;
}

function pieceMatchesFilters(p) {
  const okColor = !LF.color.size || (p.colors || []).some((c) => LF.color.has(c));
  const okOcc = !LF.occasion.size || (p.tags || []).some((t) => LF.occasion.has(t));
  return okColor && okOcc;
}

function applyFilters() {
  // Oculta/muestra cada miniatura en TODAS las zonas (incluye calzado/accesorios si existen).
  document.querySelectorAll('.piece').forEach((b) => {
    const p = byId(+b.dataset.id);
    if (p) b.hidden = !pieceMatchesFilters(p);
  });
  // Estado visual de los botones de filtro.
  document.querySelectorAll('#lookFilters [data-facet]').forEach((b) => {
    const on = LF[b.dataset.facet].has(b.dataset.val);
    b.classList.toggle(b.classList.contains('swf') ? 'on' : 'active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const clear = $('#lfClear');
  if (clear) clear.hidden = LF.color.size + LF.occasion.size === 0;
}

function toggleFilter(type, val) {
  const set = LF[type];
  set.has(val) ? set.delete(val) : set.add(val);
  applyFilters();
}

function clearFilters() {
  LF.color.clear();
  LF.occasion.clear();
  applyFilters();
}

/* ---------- Sorpréndeme (respeta lo fijado, rellena lo demás) ---------- */
function surprise() {
  const pinned = selectedIds().filter((id) => PINS.has(id));
  const pinnedDress = pinned.find((id) => byId(id).zone === 'dress');
  const pinnedTorso = pinned.filter((id) => TORSO_ZONES.includes(byId(id).zone));
  const pinnedBottom = pinned.find((id) => byId(id).zone === 'bottom');
  const pinnedShoes = pinned.find((id) => byId(id).zone === 'shoes');
  const pinnedAcc = pinned.find((id) => byId(id).zone === 'accessory');

  // Ocasión coherente con lo fijado; si no hay nada fijado, una al azar.
  const pinnedTags = [...new Set(pinned.flatMap((id) => byId(id).tags || []))];
  const tagsAll = [...new Set(PRODUCTS.flatMap((p) => p.tags || []))];
  const occPool = pinnedTags.length ? pinnedTags : tagsAll;
  const occ = occPool[Math.floor(Math.random() * occPool.length)];

  // Elige una pieza de las zonas dadas, prefiriendo filtros activos y la ocasión.
  const pick = (zones, exclude = []) => {
    let pool = PRODUCTS.filter((p) => zones.includes(p.zone) && !exclude.includes(p.id));
    const byFilter = pool.filter(pieceMatchesFilters);
    if (byFilter.length) pool = byFilter;
    const byOcc = pool.filter((p) => (p.tags || []).includes(occ));
    if (byOcc.length) pool = byOcc;
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
  };

  // El modo (vestido vs. separados) lo decide lo fijado; si no hay nada, ~1/3 vestido.
  const mode = pinnedDress
    ? 'dress'
    : pinnedTorso.length || pinnedBottom
    ? 'sep'
    : Math.random() < 0.34 && hasZone('dress')
    ? 'dress'
    : 'sep';

  if (mode === 'dress') {
    LOOK.torso = [];
    LOOK.bottom = null;
    LOOK.dress = pinnedDress || pick(['dress']);
  } else {
    LOOK.dress = null;
    const torso = [...pinnedTorso];
    if (!torso.some((id) => byId(id).zone === 'top')) {
      const top = pick(['top'], torso);
      if (top) torso.unshift(top); // la base va primero (debajo en el lienzo)
    }
    if (torso.length < 2 && Math.random() < 0.6) {
      const layer = pick(['layer'], torso);
      if (layer) torso.push(layer);
    }
    LOOK.torso = torso;
    LOOK.bottom = pinnedBottom || pick(['bottom']);
  }

  // Calzado / accesorios: conserva lo fijado, completa si existen esas zonas.
  LOOK.shoes = pinnedShoes || (hasZone('shoes') ? pick(['shoes']) : null);
  LOOK.accessory = pinnedAcc || (hasZone('accessory') ? pick(['accessory']) : null);

  render();
}

/* ---------- Compartir por URL ---------- */
// Codifica el look en querystring: ?look=t6,t3,b4  (o d1 para vestido), &pin=6,3
function encodeLook() {
  const tokens = [];
  if (LOOK.dress) tokens.push('d' + LOOK.dress);
  else {
    LOOK.torso.forEach((id) => tokens.push('t' + id));
    if (LOOK.bottom) tokens.push('b' + LOOK.bottom);
  }
  if (LOOK.shoes) tokens.push('s' + LOOK.shoes);
  if (LOOK.accessory) tokens.push('a' + LOOK.accessory);

  const params = new URLSearchParams();
  if (tokens.length) params.set('look', tokens.join(','));
  const pins = selectedIds().filter((id) => PINS.has(id));
  if (pins.length) params.set('pin', pins.join(','));
  return params.toString();
}

function shareURL() {
  const qs = encodeLook();
  return location.origin + location.pathname + (qs ? '?' + qs : '');
}

// Reconstruye el look desde la URL al abrir el enlace (validando id + zona).
function hydrateFromURL() {
  const params = new URLSearchParams(location.search);
  const look = params.get('look');
  if (!look) return;

  look.split(',').forEach((tok) => {
    const prefix = tok[0];
    const id = +tok.slice(1);
    const p = byId(id);
    if (!p) return;
    const z = p.zone;
    if (prefix === 'd' && z === 'dress') LOOK.dress = id;
    else if (prefix === 't' && TORSO_ZONES.includes(z)) {
      if (!LOOK.torso.includes(id)) LOOK.torso.push(id);
    } else if (prefix === 'b' && z === 'bottom') LOOK.bottom = id;
    else if (prefix === 's' && z === 'shoes') LOOK.shoes = id;
    else if (prefix === 'a' && z === 'accessory') LOOK.accessory = id;
  });

  // Invariante: el vestido reemplaza torso + abajo.
  if (LOOK.dress) {
    LOOK.torso = [];
    LOOK.bottom = null;
  }

  // Pines: solo los que de verdad quedaron en el look.
  const pin = params.get('pin');
  if (pin) {
    const sel = selectedIds();
    pin.split(',').forEach((s) => {
      const id = +s;
      if (sel.includes(id)) PINS.add(id);
    });
  }
}

// Web Share nativo solo en táctil (móvil); en desktop preferimos copiar el enlace.
const canNativeShare = () =>
  !!navigator.share && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

async function copyLink(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

async function shareLook() {
  if (!selectedIds().length) return;
  const url = shareURL();

  if (canNativeShare()) {
    try {
      await navigator.share({ title: 'Mi look · VERÚ', text: 'Armé este look en VERÚ:', url });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return; // el usuario canceló el menú de compartir
      // cualquier otro error -> caemos a copiar
    }
  }

  const ok = await copyLink(url);
  const shared = $('#lookShared');
  if (shared) {
    shared.textContent = ok ? 'Enlace copiado ✓' : url;
    shared.hidden = false;
  }
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

  buildFilters();

  document.querySelectorAll('.piece').forEach((b) =>
    b.addEventListener('click', () => onPieceClick(b.dataset.zone, +b.dataset.id))
  );

  const addLayer = $('#addLayer');
  if (addLayer) addLayer.onclick = () => flash($('#stripTorso'));

  const addBtn = $('#lookAdd');
  if (addBtn) addBtn.onclick = addLook;
  const surpriseBtn = $('#lookSurprise');
  if (surpriseBtn) surpriseBtn.onclick = surprise;
  const shareBtn = $('#lookShare');
  if (shareBtn) shareBtn.onclick = shareLook;

  hydrateFromURL();
  applyFilters();
  render();
}
