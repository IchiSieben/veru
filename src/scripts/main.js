// Punto de entrada del cliente: expone fb() global e inicializa todos los módulos.
import { fb } from './fallback.js';
import { initUI } from './ui.js';
import { initCatalog } from './catalog.js';
import { initQuickview } from './quickview.js';
import { initLookbook } from './lookbook.js';
import { initCountdown } from './countdown.js';
import { initNewsletter } from './newsletter.js';
import { initPDP } from './pdp.js';
import { initCheckout } from './checkout.js';
import { initConfirm } from './confirm.js';
import { renderCart } from './cart.js';
import { renderFavs } from './favs.js';
import { load, updateBadges, CART_KEY, FAVS_KEY } from './store.js';

// onerror inline de la grilla/carrito usa fb() en scope global (igual al original).
window.fb = fb;

function refresh() {
  renderCart();
  renderFavs();
  updateBadges();
}

function boot() {
  load(); // hidratar carrito/favoritos desde localStorage
  initUI();
  initCatalog();
  initQuickview();
  initLookbook();
  initCountdown();
  initNewsletter();
  initPDP();
  initCheckout();
  initConfirm();
  refresh();

  // Sincronizar entre pestañas.
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY || e.key === FAVS_KEY) {
      load();
      refresh();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
