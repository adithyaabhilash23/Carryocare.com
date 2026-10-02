// CarryO Care — Scripts
// ── PROGRESS BAR
const pb = document.getElementById('progressBar');
function updateProgress() {
  const h = document.documentElement;
  const pct = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  pb.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });

// ── NAV SCROLL
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ── HAMBURGER / DRAWER
const hbg = document.getElementById('hamburger');
const drawer = document.getElementById('drawer');
hbg.addEventListener('click', () => {
  hbg.classList.toggle('active');
  drawer.classList.toggle('open');
  document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
});
drawer.addEventListener('click', e => {
  if (e.target === drawer) { hbg.classList.remove('active'); drawer.classList.remove('open'); document.body.style.overflow = ''; }
});
document.querySelectorAll('.drawer-link,.drawer-cta').forEach(el => {
  el.addEventListener('click', () => { hbg.classList.remove('active'); drawer.classList.remove('open'); document.body.style.overflow = ''; });
});

// ── REVEAL ON SCROLL
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('up'); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => revealObs.observe(el));

// ── TIMELINE FILL
const tlFill = document.getElementById('tlFill');
const tlSection = document.getElementById('how');
const tlObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) tlFill.classList.add('active'); });
}, { threshold: 0.2 });
tlObs.observe(tlSection);



// ── SERVICES SCROLL DOTS
const svcScroll = document.getElementById('svcScroll');
const dots = document.querySelectorAll('#svcDots .dot');
const cards = svcScroll.querySelectorAll('.svc-card');
function updateDots() {
  const cardW = cards[0].offsetWidth + 14;
  const idx = Math.round(svcScroll.scrollLeft / cardW);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  // active card highlight
  cards.forEach((c, i) => c.classList.toggle('active-card', i === idx));
}
svcScroll.addEventListener('scroll', updateDots, { passive: true });
updateDots();

// ── STICKY BAR
const stickyBar = document.getElementById('stickyBar');
const heroSection = document.getElementById('hero');
const stickyObs = new IntersectionObserver(entries => {
  entries.forEach(e => stickyBar.classList.toggle('visible', !e.isIntersecting));
}, { threshold: 0 });
stickyObs.observe(heroSection);

// ── SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── SPLIDE CAROUSEL INITIALIZATION ──
function initSplide() {
  var el = document.getElementById('choices-splide');
  if (el && !el.classList.contains('is-initialized')) {
    try {
      new Splide(el, {
        type: 'slide',
        perPage: 2,
        gap: '1.5rem',
        pagination: true,
        arrows: true,
        breakpoints: {
          768: {
            perPage: 1,
          }
        }
      }).mount();
    } catch (e) {
      console.error('Splide init failed:', e);
    }
  }
}
document.addEventListener('DOMContentLoaded', initSplide);
window.addEventListener('load', initSplide);
initSplide();
