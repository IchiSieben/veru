// Confirmación de pedido: lee el último pedido de localStorage y muestra resumen + pago.
import { $, money } from './data.js';
import { LAST_ORDER_KEY } from './store.js';
import { SITE, waLink } from './../config.js';
import { buildMessage } from './checkout.js';

function payInstructions(order) {
  switch (order.method) {
    case 'Yape':
      return `Yapea <b>${money(order.total)}</b> a <b>${SITE.yape.number}</b> (${SITE.yape.name}) y envíanos la captura por WhatsApp.`;
    case 'Plin':
      return `Plinea <b>${money(order.total)}</b> a <b>${SITE.plin.number}</b> (${SITE.plin.name}) y envíanos la captura por WhatsApp.`;
    case 'Transferencia':
      return `Transfiere <b>${money(order.total)}</b> a <b>${SITE.bank.name}</b> · Cuenta <b>${SITE.bank.account}</b> · CCI <b>${SITE.bank.cci}</b> (${SITE.bank.holder}) y envía el voucher por WhatsApp.`;
    case 'Contra entrega':
      return `Pagas <b>${money(order.total)}</b> en efectivo o Yape al recibir tu pedido (solo Lima Metropolitana).`;
    default:
      return '';
  }
}

export function initConfirm() {
  const root = $('#okRoot');
  if (!root) return;

  let order = null;
  try {
    order = JSON.parse(localStorage.getItem(LAST_ORDER_KEY));
  } catch (e) {
    order = null;
  }

  if (!order) {
    $('#okIntro').textContent = 'No encontramos un pedido reciente en este dispositivo.';
    ['#okCode', '#okBox', '#okPay', '#okWa'].forEach((s) => {
      const el = $(s);
      if (el) el.style.display = 'none';
    });
    return;
  }

  $('#okCode').textContent = order.code;
  $('#okIntro').textContent =
    'Te abrimos WhatsApp con el detalle. Coordina el pago y te confirmamos el envío. ✶';

  const itemsHtml = order.items
    .map(
      (it) =>
        `<div class="row"><span>${it.name} · T${it.size} ×${it.q}</span><b>${money(it.price * it.q)}</b></div>`
    )
    .join('');
  $('#okBox').innerHTML = `
    <h3>Pedido ${order.code}</h3>
    ${itemsHtml}
    <div class="row"><span>Subtotal</span><b>${money(order.subtotal)}</b></div>
    <div class="row"><span>Envío</span><b>${order.shipping === 0 ? 'Gratis' : money(order.shipping)}</b></div>
    <div class="row" style="margin-top:.4rem;padding-top:.6rem;border-top:1px solid var(--sand)"><span>Total</span><b>${money(order.total)}</b></div>
    <div class="row"><span>Pago</span><b>${order.method}</b></div>
    <div class="row"><span>Entrega</span><b>${order.customer.district}, ${order.customer.dep}</b></div>`;

  $('#okPay').innerHTML = payInstructions(order);

  const wa = $('#okWa');
  if (wa) wa.href = waLink(buildMessage(order));
}
