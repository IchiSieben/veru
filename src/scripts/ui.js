// Chrome de UI: drawers/overlay, header en scroll, reveal on-scroll, contadores, parallax.
import { $ } from './data.js';
import { closeQuick } from './quickview.js';

// Detección de puntero fino para tilt/parallax (se respeta reduced-motion).
const mm = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false });
export const tiltOn =
  mm('(hover:hover) and (pointer:fine)').matches &&
  !mm('(prefers-reduced-motion:reduce)').matches;

/* ---------- Drawers / overlay ---------- */
export function openDrawer(sel) {
  $(sel).classList.add('open');
  $('#overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}
export function closeAll() {
  document.querySelectorAll('.drawer').forEach((d) => d.classList.remove('open'));
  $('#overlay').classList.remove('show');
  if (!$('#modal') || !$('#modal').classList.contains('open')) document.body.style.overflow = '';
}

/* ---------- Reveal on scroll + contadores ---------- */
export const io =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              if (e.target.classList.contains('manifesto')) runCounters();
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.16 }
      )
    : {
        observe(el) {
          el.classList.add('in');
          if (el.classList.contains('manifesto')) runCounters();
        },
        unobserve() {},
      };

export const observe = (el) => io.observe(el);

let counted = false;
function runCounters() {
  if (counted) return;
  counted = true;
  document.querySelectorAll('.stat b[data-count]').forEach((el) => {
    const target = +el.dataset.count,
      suf = el.dataset.suf || '',
      txt = el.dataset.text;
    if (txt) {
      el.textContent = txt;
      return;
    }
    let n = 0;
    const step = Math.max(1, Math.round(target / 40));
    const t = setInterval(() => {
      n += step;
      if (n >= target) {
        n = target;
        clearInterval(t);
      }
      el.textContent = n + suf;
    }, 24);
  });
}

/* ---------- Header scroll + back-to-top + parallax ---------- */
function onScroll() {
  const header = $('#header'),
    heroEl = $('#hero');
  if (!header) return;
  const y = scrollY;
  header.classList.toggle('scrolled', y > 40);
  const totop = $('#totop');
  if (totop) totop.classList.toggle('show', y > 700);

  if (heroEl) {
    const heroBottom = heroEl.offsetTop + heroEl.offsetHeight - 90;
    header.classList.toggle('on-dark', y < heroBottom);
    if (tiltOn) {
      const hm = $('#heroMedia');
      if (hm) hm.style.transform = `translateY(${y * 0.18}px)`;
      const mp = $('#manifestoPar');
      if (mp) {
        const r = mp.parentElement.getBoundingClientRect();
        const off = (window.innerHeight - r.top) * 0.06;
        mp.style.transform = `translateY(${Math.max(-40, Math.min(40, off - 20))}px)`;
      }
    }
  } else {
    // Páginas sin hero: header siempre sólido.
    header.classList.remove('on-dark');
  }
}

export function initUI() {
  const heroEl = $('#hero');

  // Botones que abren drawers.
  $('#cartBtn') && ($('#cartBtn').onclick = () => openDrawer('#cartDrawer'));
  $('#favBtn') && ($('#favBtn').onclick = () => openDrawer('#favDrawer'));
  $('#burger') && ($('#burger').onclick = () => openDrawer('#menuDrawer'));
  $('#overlay') && ($('#overlay').onclick = closeAll);
  document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = closeAll));
  document.querySelectorAll('.mlink').forEach((a) => a.addEventListener('click', closeAll));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAll();
      closeQuick();
    }
  });

  // Reveal: observar secciones + activar hero.
  document.querySelectorAll('.r-up,.r-stag,.manifesto').forEach((el) => io.observe(el));
  if (heroEl) setTimeout(() => heroEl.classList.add('in'), 120);

  // Scroll.
  window.addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  const totop = $('#totop');
  if (totop) totop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

  onScroll();
}
