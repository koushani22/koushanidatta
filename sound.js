(function () {
  if (window.__kosSound) return; window.__kosSound = 1;
  const KEY = 'kos-sound-on';
  let ctx = null, master = null, amb = null, on = localStorage.getItem(KEY) === '1', lastHover = 0;
  const init = () => {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const verb = ctx.createConvolver(), len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.55; verb.connect(wet); wet.connect(master);
    master.verb = verb;
    amb = ctx.createGain(); amb.gain.value = 0.11; amb.connect(master); amb.connect(verb);
    const chord = [174.6, 261.6, 329.6, 392, 523.3];
    chord.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 2) * 4;
      g.gain.value = 0.16 / (i + 1);
      lfo.frequency.value = 0.05 + i * 0.023; lg.gain.value = g.gain.value * 0.8; lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(amb); o.start(); lfo.start();
    });
    const tw = () => { if (on) bell(1046.5 * [1, 1.122, 1.335, 1.498, 2][Math.random() * 5 | 0], 0.025, 2.6); setTimeout(tw, 2600 + Math.random() * 5200); };
    setTimeout(tw, 2500);
  };
  const bell = (f, v, dur) => {
    if (!ctx || !on) return; const t = ctx.currentTime;
    [1, 2.01, 3.02].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v / (i + 1), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (i + 1));
      o.connect(g); g.connect(master); g.connect(master.verb); o.start(t); o.stop(t + dur);
    });
  };
  const noise = (dur, v, f0, f1, q = 1.2) => {
    if (!ctx || !on) return; const t = ctx.currentTime, n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; n.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(master); g.connect(master.verb); n.start(t); n.stop(t + dur);
  };
  const pluck = (f, v, dur = 0.9) => {
    if (!ctx || !on) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(master); g.connect(master.verb); o.start(t); o.stop(t + dur);
  };
  const pop = (f0, f1, v, dur = 0.35) => {
    if (!ctx || !on) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); g.connect(master.verb); o.start(t); o.stop(t + dur);
  };
  const seq = (fn, list, gap) => list.forEach((x, i) => setTimeout(() => fn(x), i * gap));
  const OBJ = {
    'Packaging': () => { noise(0.28, 0.05, 2400, 900, 0.8); setTimeout(() => bell(1174.7, 0.03, 1.6), 140); },
    'Dieline': () => { pluck(392, 0.05); setTimeout(() => pluck(587.3, 0.04), 110); },
    'Illustration': () => { noise(0.12, 0.035, 3800, 5200, 3); setTimeout(() => noise(0.14, 0.03, 4200, 3000, 3), 130); },
    'Branding': () => seq(f => bell(f, 0.028, 1.2), [1046.5, 1318.5, 1568], 70),
    'Motion': () => { noise(0.6, 0.04, 400, 3200, 0.7); },
    '3D': () => pop(520, 180, 0.07),
    'Art direction': () => seq(f => pluck(f, 0.03, 1.4), [523.3, 659.3, 784, 987.8, 1174.7], 45),
    'Kos.': () => seq(f => bell(f, 0.03, 2), [1568, 2093, 2637, 3136], 60)
  };
  window.addEventListener('kos-obj-hover', e => { const f = OBJ[e.detail]; if (f) { lastHover = performance.now(); f(); } });
  window.addEventListener('kos-obj-click', () => sparkle());
  const LET = [392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7];
  const sparkle = () => { [1318.5, 1568, 2093, 2637].forEach((f, i) => setTimeout(() => bell(f, 0.05, 1.6), i * 55)); };
  const set = v => {
    on = v; localStorage.setItem(KEY, v ? '1' : '0');
    if (v) { init(); ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.2); setTimeout(sparkle, 120); }
    else if (ctx) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    paint();
  };
  const btn = document.createElement('button');
  btn.type = 'button'; btn.setAttribute('aria-label', 'Toggle sound');
  btn.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:9999;display:flex;align-items:center;gap:9px;padding:9px 14px 9px 11px;border-radius:999px;border:1px solid rgba(255,255,255,0.7);background:rgba(20,17,15,0.55);color:#FFFFFF;font:600 10.5px/1 'IBM Plex Mono',monospace;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 10px 30px -12px rgba(43,36,102,0.6);";
  const bars = document.createElement('span'); bars.style.cssText = 'display:flex;align-items:flex-end;gap:2px;height:12px;';
  for (let i = 0; i < 4; i++) { const b = document.createElement('span'); b.style.cssText = 'width:2px;border-radius:2px;background:#FFFFFF;transition:height .3s;'; bars.appendChild(b); }
  const lab = document.createElement('span'); btn.append(bars, lab);
  let ph = 0; const anim = () => { ph += 0.12; [...bars.children].forEach((b, i) => b.style.height = on ? (4 + 8 * Math.abs(Math.sin(ph + i * 1.3))) + 'px' : '3px'); requestAnimationFrame(anim); };
  const paint = () => { lab.textContent = on ? 'Sound on' : 'Sound off'; };
  btn.onclick = e => { e.stopPropagation(); set(!on); };
  const mount = () => { if (!document.body) return setTimeout(mount, 50); document.body.appendChild(btn); paint(); anim(); };
  mount();
  if (on) { const first = () => { set(true); window.removeEventListener('pointerdown', first, true); }; window.addEventListener('pointerdown', first, true); }
  const NOTES = [784, 880, 987.8, 1174.7, 1318.5];
  document.addEventListener('pointerover', e => {
    if (!on) return;
    const L = e.target.closest && e.target.closest('[data-l]');
    if (L && !L.contains(e.relatedTarget)) { const now = performance.now(); if (now - lastHover > 45) { lastHover = now; pluck(LET[(+L.getAttribute('data-l') || 0) % LET.length], 0.026, 0.7); } return; } const el = e.target.closest && e.target.closest('a, button, [data-card], [data-g]');
    if (!el || el === btn || el.contains(e.relatedTarget)) return;
    const now = performance.now(); if (now - lastHover < 90) return; lastHover = now;
    bell(NOTES[Math.random() * NOTES.length | 0], 0.022, 1.1);
  }, true);
  document.addEventListener('click', e => {
    if (!on || btn.contains(e.target)) return;
    const el = e.target.closest && e.target.closest('a, button, [data-card]');
    if (el) sparkle(); else bell(659.3, 0.03, 1.8);
  }, true);
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
})();
