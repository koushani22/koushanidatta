(function () {
  const EASE = 'cubic-bezier(.77,0,.18,1)';
  const anim = el => (el.style.animation || el.style.animationName || '');
  function build(w) {
    let steps = null, n = 0;
    const fades = [...w.querySelectorAll(':scope > [data-show]')];
    const strip = [...w.querySelectorAll('*')].find(e => /mycSlide/.test(anim(e)));
    const w3 = [...w.querySelectorAll('*')].filter(e => /lethW3b|lethW3c/.test(anim(e)));
    const sw = [...w.querySelectorAll('*')].filter(e => /lethSwap|lethFade/.test(anim(e)));
    if (fades.length > 1) {
      n = fades.length;
      steps = k => fades.forEach((el, i) => el.style.opacity = i === k ? 1 : 0);
    } else if (strip) {
      n = strip.children.length; strip.style.animation = 'none'; strip.style.transition = 'transform 1s ' + EASE;
      steps = k => strip.style.transform = 'translateX(' + (-100 * k / n) + '%)';
    } else if (w3.length) {
      const L = w3.sort((a, b) => /W3b/.test(anim(a)) ? -1 : 1); n = L.length + 1;
      L.forEach(e => { e.style.animation = 'none'; e.style.transition = 'clip-path .9s ' + EASE; });
      steps = k => L.forEach((e, i) => e.style.clipPath = k > i ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)');
    } else if (sw.length) {
      n = 2; sw.forEach(e => { const f = /lethFade/.test(anim(e)); e.style.animation = 'none'; e.style.transition = (f ? 'opacity' : 'clip-path') + ' .9s ' + EASE; e.dataset.navf = f ? 1 : ''; });
      steps = k => sw.forEach(e => { if (e.dataset.navf) e.style.opacity = k ? 1 : 0; else e.style.clipPath = k ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)'; });
    }
    if (!steps || n < 2) return;
    w.dataset.nav = '1';
    let k = 0, timer;
    let dots = [...w.querySelectorAll('[data-dot]')];
    if (!dots.length) {
      const bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:8px;z-index:6;';
      for (let i = 0; i < n; i++) { const d = document.createElement('span'); d.setAttribute('data-dot', i); d.style.cssText = 'width:9px;height:9px;border-radius:50%;background:#FFFFFF;box-shadow:0 0 0 1px rgba(0,0,0,0.25);transition:opacity .4s;'; bar.appendChild(d); }
      w.appendChild(bar); dots = [...bar.children];
    }
    const show = i => { k = (i + n) % n; steps(k); dots.forEach((d, j) => d.style.opacity = j === k ? 1 : 0.4); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(k + 1), 3600); };
    const btn = (dir) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', dir < 0 ? 'Previous' : 'Next');
      b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + (dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>';
      b.style.cssText = 'position:absolute;top:50%;' + (dir < 0 ? 'left' : 'right') + ':clamp(8px,1.4vw,18px);transform:translateY(-50%);z-index:6;width:clamp(34px,3.4vw,46px);height:clamp(34px,3.4vw,46px);border-radius:50%;border:1px solid rgba(255,255,255,0.55);background:rgba(12,10,9,0.42);color:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .25s,transform .25s;padding:0;';
      b.onmouseenter = () => { b.style.background = 'rgba(196,30,42,0.85)'; };
      b.onmouseleave = () => { b.style.background = 'rgba(12,10,9,0.42)'; };
      b.onclick = e => { e.preventDefault(); e.stopPropagation(); show(k + dir); auto(); };
      w.appendChild(b);
    };
    btn(-1); btn(1);
    let x0 = null;
    w.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    w.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { show(k + (dx < 0 ? 1 : -1)); auto(); } x0 = null; });
    show(0); auto();
  }
  let tries = 0;
  const scan = () => { document.querySelectorAll('[data-slide-wrap]:not([data-nav])').forEach(build); if (++tries < 20) setTimeout(scan, 600); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
