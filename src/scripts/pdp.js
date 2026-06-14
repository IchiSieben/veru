// Ficha de producto: galería, selección de talla/color, acordeón, add-to-cart.
// Reutiliza la vista rápida (zoom/pan) al hacer click en la imagen principal.
import { $ } from './data.js';
import { addToCart } from './cart.js';
import { openQuick } from './quickview.js';

export function initPDP() {
  const pdp = document.querySelector('.pdp');
  if (!pdp) return;
  const id = +pdp.dataset.id;

  // Cambiar imagen principal con las miniaturas.
  const mainImg = $('#pdpMainImg');
  document.querySelectorAll('.pdp__thumb').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.pdp__thumb').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      if (mainImg) mainImg.src = t.dataset.full;
    });
  });

  // Click en la imagen principal -> vista rápida con zoom.
  const main = $('#pdpMain');
  if (main) {
    main.addEventListener('click', () => openQuick(id));
    main.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openQuick(id);
      }
    });
  }

  // Selección de color.
  const sw = $('#pdpSw');
  if (sw) {
    sw.querySelectorAll('.sw').forEach((s) =>
      s.addEventListener('click', () => {
        sw.querySelectorAll('.sw').forEach((x) => x.classList.remove('active'));
        s.classList.add('active');
      })
    );
  }

  // Selección de talla (actualiza data-size del botón Agregar).
  const addBtn = $('#pdpAdd');
  const sizes = $('#pdpSizes');
  if (sizes && addBtn) {
    sizes.querySelectorAll('.size').forEach((b) =>
      b.addEventListener('click', () => {
        sizes.querySelectorAll('.size').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        addBtn.dataset.size = b.dataset.s;
      })
    );
  }

  // Agregar al carrito con la talla elegida.
  if (addBtn) {
    addBtn.addEventListener('click', () => addToCart(id, addBtn.dataset.size));
  }

  // Acordeón de detalles.
  document.querySelectorAll('#pdpAcc .acc__item').forEach((item) => {
    const head = item.querySelector('.acc__head');
    const body = item.querySelector('.acc__body');
    const sync = () => {
      body.style.maxHeight = item.classList.contains('open') ? body.scrollHeight + 'px' : '0px';
    };
    sync();
    head.addEventListener('click', () => {
      item.classList.toggle('open');
      sync();
    });
  });
}
