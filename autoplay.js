(function () {
  if (window.__kosAutoplay) return; window.__kosAutoplay = true;
  const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) { v.play().catch(() => {}); } }), { threshold: 0.05 });
  const prep = v => { if (v.__kos) return; v.__kos = true; v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); io.observe(v); v.play().catch(() => {}); };
  const scan = () => document.querySelectorAll('video').forEach(prep);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scan); scan();
  document.addEventListener('pointerdown', () => document.querySelectorAll('video').forEach(v => v.paused && v.play().catch(() => {})), { once: true });
})();
