// Punto de entrada del cliente: expone fb() global e inicializa todos los módulos.
import { fb } from './fallback.js';
import { initUI } from './ui.js';
import { initCatalog } from './catalog.js';
import { initQuickview } from './quickview.js';
import { initLookbook } from './lookbook.js';
import { initCountdown } from './countdown.js';
import { initNewsletter } from './newsletter.js';
import { renderCart } from './cart.js';
import { renderFavs } from './favs.js';
import { updateBadges } from './store.js';

// onerror inline de la grilla/carrito usa fb() en scope global (igual al original).
window.fb = fb;

function boot() {
  initUI();
  initCatalog();
  initQuickview();
  initLookbook();
  initCountdown();
  initNewsletter();
  renderCart();
  renderFavs();
  updateBadges();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
