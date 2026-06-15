// Configuración de contacto, pagos y envío de VERÚ.
// IMPORTANTE: reemplazar los números/cuentas de ejemplo por los reales antes de producción.
export const SITE = {
  brand: 'VERÚ',
  // Número de WhatsApp del negocio en formato internacional sin "+" (Perú = 51).
  whatsapp: '51999999999',
  yape: { number: '999 999 999', name: 'VERÚ Moda' },
  plin: { number: '999 999 999', name: 'VERÚ Moda' },
  bank: {
    name: 'BCP',
    account: '000-00000000-0-00',
    cci: '00000000000000000000',
    holder: 'VERÚ S.A.C.',
  },
  // Envío gratis desde este monto (S/); por debajo se cobra tarifa plana.
  freeShippingFrom: 199,
  flatShipping: 15,
};

// Nombres legibles para los hex de producto (filtro por color y chips activos).
export const COLOR_NAMES = {
  '#B4849F': 'Malva',
  '#8B5A77': 'Malva profundo',
  '#EBDCE4': 'Rosa malva',
  '#36202F': 'Berenjena',
  '#17121B': 'Negro',
  '#E2D8CC': 'Arena',
};

export const waLink = (text) =>
  `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
