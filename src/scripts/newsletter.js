// Newsletter: validación de correo en cliente.
import { $ } from './data.js';

export function initNewsletter() {
  const btn = $('#newsBtn');
  if (!btn) return;
  btn.onclick = () => {
    const v = $('#newsEmail').value.trim();
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
    $('#newsOk').textContent = ok
      ? '¡Listo! Revisa tu correo para confirmar. ✶'
      : 'Ingresa un correo válido.';
    $('#newsOk').style.color = ok ? 'var(--mauve)' : '#E89';
    if (ok) $('#newsEmail').value = '';
  };
}
