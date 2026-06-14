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

export function initQuickview() {
  const stage = $('#modalStage');
  if (!stage) return;

  $('#zoomIn').onclick = () => {
    zoom = Math.min(zoom + 0.4, 3);
    stage.classList.toggle('zoomed', zoom > 1);
    applyZoom();
  };
  $('#zoomOut').onclick = () => {
    zoom = Math.max(zoom - 0.4, 1);
    if (zoom === 1) {
      panX = panY = 0;
    }
    stage.classList.toggle('zoomed', zoom > 1);
    applyZoom();
  };
  stage.addEventListener('click', (e) => {
    if (e.target.closest('.zbtn')) return;
    if (zoom === 1) {
      zoom = 2;
      stage.classList.add('zoomed');
    } else {
      resetZoom();
    }
    applyZoom();
  });

  // Arrastrar para mover cuando hay zoom.
  let drag = false,
    sx,
    sy,
    bx,
    by;
  stage.addEventListener('mousedown', (e) => {
    if (zoom <= 1) return;
    drag = true;
    stage.classList.add('drag');
    sx = e.clientX;
    sy = e.clientY;
    bx = panX;
    by = panY;
  });
  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    panX = bx + (e.clientX - sx) / zoom;
    panY = by + (e.clientY - sy) / zoom;
    applyZoom();
  });
  window.addEventListener('mouseup', () => {
    drag = false;
    stage.classList.remove('drag');
  });

  $('#modalAdd').onclick = () => {
    addToCart(curProd.id, curSize);
    closeQuick();
  };
  $('#modalClose').onclick = closeQuick;
  $('#modalOverlay').onclick = closeQuick;
}
