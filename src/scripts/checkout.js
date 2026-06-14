// Checkout: resumen del pedido, totales, validación y cierre por WhatsApp + Yape/Plin.
import { $, byId, money } from './data.js';
import {
  state,
  persist,
  clearCart,
  updateBadges,
  ORDERS_KEY,
  LAST_ORDER_KEY,
} from './store.js';
import { SITE, waLink } from '../config.js';

const shippingFor = (subtotal) =>
  subtotal > 0 && subtotal < SITE.freeShippingFrom ? SITE.flatShipping : 0;

function totals() {
  const subtotal = state.cart.reduce((s, i) => s + byId(i.id).price * i.q, 0);
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

function renderSummary() {
  const lines = $('#coLines');
  if (!lines) return;
  const empty = $('#coEmpty'),
    form = $('#coForm');

  if (!state.cart.length) {
    if (empty) empty.style.display = '';
    if (form) form.style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';
  if (form) form.style.display = '';

  lines.innerHTML = state.cart
    .map((i) => {
      const p = byId(i.id);
      return `<div class="co-line">
      <div class="co-line__img"><img src="${p.thumb}" alt="${p.name}" onerror="this.onerror=null;this.src=fb(this,'${p.name}',['#36202F','#17121B'])"></div>
      <div>
        <div class="co-line__name">${p.name}</div>
        <div class="co-line__meta">Talla ${i.size} · ${p.cat}</div>
        <div class="qty">
          <button type="button" data-dec="${i.key}" aria-label="Menos">−</button><span>${i.q}</span>
          <button type="button" data-inc="${i.key}" aria-label="Más">+</button>
        </div>
      </div>
      <div class="co-line__price">${money(p.price * i.q)}</div>
    </div>`;
    })
    .join('');

  const { subtotal, shipping, total } = totals();
  $('#coSubtotal').textContent = money(subtotal);
  $('#coShip').textContent = shipping === 0 ? 'Gratis' : money(shipping);
  $('#coTotal').textContent = money(total);

  lines.querySelectorAll('[data-inc]').forEach(
    (b) =>
      (b.onclick = () => {
        state.cart.find((i) => i.key === b.dataset.inc).q++;
        persist();
        updateBadges();
        renderSummary();
      })
  );
  lines.querySelectorAll('[data-dec]').forEach(
    (b) =>
      (b.onclick = () => {
        const it = state.cart.find((i) => i.key === b.dataset.dec);
        it.q--;
        if (it.q <= 0) state.cart = state.cart.filter((x) => x !== it);
        persist();
        updateBadges();
        renderSummary();
      })
  );
}

function setupPayments() {
  const radios = document.querySelectorAll('#coPays input[name="pay"]');
  const sync = () => {
    radios.forEach((r) => r.closest('.pay-opt').classList.toggle('sel', r.checked));
    const val = [...radios].find((r) => r.checked)?.value;
    document.querySelectorAll('.pay-detail').forEach((d) => {
      d.style.display = d.dataset.pay === val ? '' : 'none';
    });
  };
  radios.forEach((r) => r.addEventListener('change', sync));
  sync();
}

function validate(form) {
  let firstBad = null;
  form.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
  form.querySelectorAll('.field .err').forEach((e) => (e.textContent = ''));

  form.querySelectorAll('.field[data-req]').forEach((f) => {
    const input = f.querySelector('input, select, textarea');
    if (!input.value.trim()) {
      f.classList.add('invalid');
      const err = f.querySelector('.err');
      if (err) err.textContent = 'Campo obligatorio';
      if (!firstBad) firstBad = input;
    }
  });

  const email = form.querySelector('#co-email');
  if (email && email.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) {
    const f = email.closest('.field');
    f.classList.add('invalid');
    f.querySelector('.err').textContent = 'Correo no válido';
    if (!firstBad) firstBad = email;
  }

  if (firstBad) {
    firstBad.focus();
    firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

function orderCode() {
  return 'VERU-' + Date.now().toString().slice(-6);
}

export function buildMessage(order) {
  const L = [];
  L.push(`*Nuevo pedido ${SITE.brand}* — ${order.code}`);
  L.push('—'.repeat(16));
  order.items.forEach((it) =>
    L.push(`• ${it.name} (Talla ${it.size}) x${it.q} — ${money(it.price * it.q)}`)
  );
  L.push('—'.repeat(16));
  L.push(`Subtotal: ${money(order.subtotal)}`);
  L.push(`Envío: ${order.shipping === 0 ? 'Gratis' : money(order.shipping)}`);
  L.push(`*Total: ${money(order.total)}*`);
  L.push('—'.repeat(16));
  L.push(`*Cliente:* ${order.customer.name}`);
  L.push(`*Tel:* ${order.customer.phone}`);
  if (order.customer.email) L.push(`*Correo:* ${order.customer.email}`);
  L.push(`*Entrega:* ${order.customer.address}, ${order.customer.district}, ${order.customer.dep}`);
  if (order.customer.ref) L.push(`*Referencia:* ${order.customer.ref}`);
  L.push(`*Pago:* ${order.method}`);
  if (order.notes) L.push(`*Notas:* ${order.notes}`);
  return L.join('\n');
}

export function initCheckout() {
  const form = $('#coForm');
  if (!form) return;

  renderSummary();
  setupPayments();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.cart.length) return;
    if (!validate(form)) return;

    const f = (id) => $(id).value.trim();
    const { subtotal, shipping, total } = totals();
    const order = {
      code: orderCode(),
      date: new Date().toISOString(),
      items: state.cart.map((i) => {
        const p = byId(i.id);
        return { id: i.id, name: p.name, size: i.size, q: i.q, price: p.price };
      }),
      subtotal,
      shipping,
      total,
      method: document.querySelector('#coPays input[name="pay"]:checked').value,
      customer: {
        name: f('#co-name'),
        phone: f('#co-phone'),
        email: f('#co-email'),
        district: f('#co-district'),
        dep: f('#co-dep'),
        address: f('#co-address'),
        ref: f('#co-ref'),
      },
      notes: f('#co-notes'),
    };

    // Guardar el pedido e historial.
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      orders.push(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    } catch (err) {
      /* sin almacenamiento: el pedido igual va por WhatsApp */
    }

    // Abrir WhatsApp con el detalle y vaciar el carrito.
    const waUrl = waLink(buildMessage(order));
    clearCart();
    updateBadges();
    window.open(waUrl, '_blank');
    window.location.href = '/pedido-confirmado';
  });
}
