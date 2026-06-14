// Formato de precios en soles. Idéntico al `money` del sitio original: "S/" + n.
export const money = (n) => 'S/' + n;

// Porcentaje de descuento (entero) a partir de precio actual y precio anterior.
export const discountPct = (price, old) =>
  old ? Math.round((1 - price / old) * 100) : 0;
