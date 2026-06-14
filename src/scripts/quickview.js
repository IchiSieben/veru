// Vista rápida con zoom/pan. Usa la imagen 'zoom' optimizada (1000px).
import { byId, money, $ } from './data.js';
import { addToCart } from './cart.js';
import { fb } from './fallback.js';

let zoom = 1,
  panX = 0,
  panY = 0,
  curProd = null,
  curSize = null;

export function openQuick(id) {
  const p = byId(id);
  if (!p) return;
  curProd = p;
  curSize = p.sizes[1] || p.sizes[0];
  const im = $('#modalImg');
  im.src = p.zoom;
  im.alt = p.name;
  im.onerror = function () {
    this.onerror = null;
    this.src = fb(this, p.name, ['#36202F', '#17121B']);
  };
  $('#modalCat').textContent = p.cat;
  $('#modalName').textContent = p.name;
  $('#modalPrice').innerHTML = (p.old ? `<s>${money(p.old)}</s>` : '') + money(p.price);
  $('#modalDesc').textContent = p.desc;
  const detail = $('#modalDetail');
  if (detail) detail.href = `/producto/${p.slug}`;
  $('#modalSw').innerHTML = p.colors
    .map((c, i) => `<span class="sw${i === 0 ? ' active' : ''}" style="background:${c}"></span>`)
    .join('');
  $('#modalSw')
    .querySelectorAll('.sw')
    .forEach(
      (sw) =>
        (sw.onclick = () => {
          $('#modalSw')
            .querySelectorAll('.sw')
            .forEach((x) => x.classList.remove('active'));
          sw.classList.add('active');
        })
    );
  $('#modalSizes').innerHTML = p.sizes
    .map(
      (s, i) =>
        `<button class="size${i === (p.sizes[1] ? 1 : 0) ? ' active' : ''}" data-s="${s}">${s}</button>`
    )
    .join('');
  $('#modalSizes')
    .querySelectorAll('.size')
    .forEach(
      (b) =>
        (b.onclick = () => {
          $('#modalSizes')
            .querySelectorAll('.size')
            .forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          curSize = b.dataset.s;
        })
    );
  resetZoom();
  $('#modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeQuick() {
  const m = $('#modal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

function resetZoom() {
  zoom = 1;
  panX = 0;
  panY = 0;
  applyZoom();
  $('#modalStage').classList.remove('zoomed');
}
function applyZoom() {
  $('#modalImg').style.transform = `scale(${zoom}) translate(${panX}px,${panY}px)`;
}

function zoomTo(stage, z) {
  zoom = Math.min(3, Math.max(1, z));
  if (zoom === 1) {
    panX = panY = 0;
  }
  stage.classList.toggle('zoomed', zoom > 1);
  applyZoom();
}

export function initQuickview() {
  const stage = $('#modalStage');
  if (!stage) return;

  $('#zoomIn').onclick = () => zoomTo(stage, zoom + 0.4);
  $('#zoomOut').onclick = () => zoomTo(stage, zoom - 0.4);

  // Pointer Events: cubren mouse y táctil. Un dedo = pan (con zoom); dos dedos = pinch.
  const pointers = new Map();
  let dragging = false,
    sx,
    sy,
    bx,
    by,
    moved = false,
    pinchDist = 0,
    pinchZoom = 1;

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.zbtn')) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1 && zoom > 1) {
      dragging = true;
      stage.classList.add('drag');
      sx = e.clientX;
      sy = e.clientY;
      bx = panX;
      by = panY;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (err) {}
    } else if (pointers.size === 2) {
      dragging = false;
      const p = [...pointers.values()];
      pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      pinchZoom = zoom;
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinchDist > 0) {
      const p = [...pointers.values()];
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      moved = true;
      zoomTo(stage, pinchZoom * (d / pinchDist));
      e.preventDefault();
    } else if (dragging) {
      panX = bx + (e.clientX - sx) / zoom;
      panY = by + (e.clientY - sy) / zoom;
      moved = true;
      applyZoom();
      e.preventDefault();
    }
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0) {
      dragging = false;
      stage.classList.remove('drag');
    }
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  // Tap/click para alternar zoom (sólo si no hubo gesto de arrastre o pinch).
  stage.addEventListener('click', (e) => {
    if (e.target.closest('.zbtn')) return;
    if (moved) {
      moved = false;
      return;
    }
    if (zoom === 1) zoomTo(stage, 2);
    else resetZoom();
  });

  $('#modalAdd').onclick = () => {
    addToCart(curProd.id, curSize);
    closeQuick();
  };
  $('#modalClose').onclick = closeQuick;
  $('#modalOverlay').onclick = closeQuick;
}
