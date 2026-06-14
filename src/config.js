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

export const waLink = (text) =>
  `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
