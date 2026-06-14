// Fallback de imagen en duotono editorial (no bloque plano) — idéntico al original.
// Se expone en window.fb para que los atributos onerror inline (grilla/carrito) lo usen.
export function fb(el, label, cols) {
  const [a, b] = cols || ['#36202F', '#17121B'];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient>
      <radialGradient id='h' cx='75%' cy='18%' r='70%'>
      <stop offset='0' stop-color='#B4849F' stop-opacity='.35'/><stop offset='1' stop-color='${b}' stop-opacity='0'/></radialGradient></defs>
    <rect width='600' height='800' fill='url(#g)'/><rect width='600' height='800' fill='url(#h)'/>
    <text x='50%' y='51%' fill='#F1EBE3' opacity='.85' font-family='Bodoni Moda, Georgia, serif'
      font-style='italic' font-size='34' text-anchor='middle'>${label || 'VERÚ'}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
