// Datos de producto para el cliente, inyectados por Base.astro con imágenes ya
// optimizadas en build (#veru-data). Reemplaza a las constantes PRODUCTS del original.
let PRODUCTS = [];
try {
  const el = document.getElementById('veru-data');
  PRODUCTS = el ? JSON.parse(el.textContent) : [];
} catch (e) {
  console.error('[veru] No se pudo leer #veru-data', e);
  PRODUCTS = [];
}

export { PRODUCTS };
export const byId = (id) => PRODUCTS.find((p) => p.id === id);
export const money = (n) => 'S/' + n;
export const $ = (s) => document.querySelector(s);
