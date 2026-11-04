(function () {
  if (window.__kosSound) return;
  window.__kosSound = 1;
  const AMBIENT_LEVEL = 0.05; // Same 5% starting level as the approved demo.
  let on = false;
  let ctx, master, ambient, effects, fadeTimer = 0, barsFrame = 0, phase = 0;
  let lastType = -Infinity, lastObject = -Infinity, lastAction = -Infinity;
  const scheduled = new Set();

  function fade(parameter, value, seconds) {
    const now = ctx.currentTime;
    if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
    else {
      const current = parameter.value;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
    }
    parameter.linearRampToValueAtTime(value, now + seconds);
  }

  function init() {
    if (ctx) return;
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) throw new Error('Audio is unavailable');
    ctx = new AudioEngine();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    ambient = ctx.createGain(); ambient.gain.value = 0; ambient.connect(master);
    effects = ctx.createGain(); effects.gain.value = 0.65; effects.connect(master);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass'; tone.frequency.value = 900; tone.Q.value = 0.4;
    const dry = ctx.createGain(); dry.gain.value = 0.8;
    tone.connect(dry); dry.connect(ambient);
    const reverb = ctx.createConvolver(), length = Math.floor(ctx.sampleRate * 3.8);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.5);
    }
    reverb.buffer = impulse;
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    tone.connect(reverb); reverb.connect(wet); wet.connect(ambient);
    [130.8128, 195.9977, 261.6256, 293.6648, 329.6276].forEach((frequency, index) => {
      const voice = ctx.createGain(); voice.gain.value = 0.14 / (1 + index * 0.6);
      const pan = ctx.createStereoPanner(); pan.pan.value = (index - 2) * 0.2;
      voice.connect(pan); pan.connect(tone);
      [-2.5, 2.5].forEach(detune => {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = detune;
        oscillator.connect(voice); oscillator.start();
      });
      const drift = ctx.createOscillator(), depth = ctx.createGain();
      drift.frequency.value = 0.032 + index * 0.009; depth.gain.value = voice.gain.value * 0.14;
      drift.connect(depth); depth.connect(voice.gain); drift.start();
    });
  }

  const audible = () => on && ctx && ctx.state === 'running' && !document.hidden;

  function tone(frequency, endFrequency, volume, duration, attack = 0.003) {
    if (!audible()) return;
    const time = ctx.currentTime, oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain); gain.connect(effects);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(time); oscillator.stop(time + duration + 0.01);
  }

  function breath(duration, volume, startFrequency, endFrequency, attack = 0.004, q = 0.7) {
    if (!audible()) return;
    const time = ctx.currentTime, source = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    filter.type = 'bandpass'; filter.Q.value = q;
    filter.frequency.setValueAtTime(startFrequency, time);
    filter.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(effects);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(time); source.stop(time + duration + 0.01);
  }

  function later(callback, delay) {
    const timer = setTimeout(() => { scheduled.delete(timer); if (audible()) callback(); }, delay);
    scheduled.add(timer);
  }
  function clearSounds() { scheduled.forEach(clearTimeout); scheduled.clear(); }

  function tak(index) {
    const now = performance.now();
    if (!audible() || now - lastType < 42) return;
    lastType = now;
    const variation = (index % 3 - 1) * 18;
    breath(0.028, 0.034, 1800 + variation, 850, 0.001);
    tone(340 + variation, 190, 0.018, 0.045, 0.001);
  }

  function rattle() {
    [[0, 1300, 0.010], [90, 1660, 0.007], [230, 1120, 0.004]].forEach(([delay, frequency, volume]) => {
      const clink = () => {
        tone(frequency, frequency * 0.98, volume, 0.085);
        tone(frequency * 1.48, frequency * 1.45, volume * 0.25, 0.06);
        breath(0.018, volume * 0.5, 4200, 2400, 0.001);
      };
      if (delay) later(clink, delay); else clink();
    });
  }

  const materials = {
    Packaging: () => tone(760, 720, 0.021, 0.16),
    Dieline: () => { breath(0.055, 0.026, 650, 350); tone(180, 130, 0.013, 0.065); },
    Illustration: () => { tone(420, 240, 0.025, 0.065); breath(0.018, 0.018, 1600, 900, 0.001); },
    Branding: () => breath(0.08, 0.024, 2700, 1400, 0.012),
    Motion: () => breath(0.13, 0.018, 700, 1050, 0.025, 2),
    '3D': () => tone(280, 150, 0.034, 0.12),
    'Art direction': () => breath(0.12, 0.019, 4800, 2200, 0.025),
    'Kos.': rattle
  };

  function action(callback) {
    const now = performance.now();
    if (!audible() || now - lastAction < 85) return;
    lastAction = now; callback();
  }
  function content(open) {
    action(() => breath(open ? 0.14 : 0.10, open ? 0.025 : 0.019, open ? 500 : 1400, open ? 1400 : 500, 0.025));
  }

  window.addEventListener('kos-obj-hover', event => {
    const now = performance.now(), effect = materials[event.detail];
    if (!audible() || !effect || now - lastObject < 150) return;
    lastObject = now; effect();
  });
  window.addEventListener('kos-obj-click', event => action(() => {
    if (event.detail === 'Kos.') rattle();
    else tone(310, 130, 0.032, 0.14);
  }));
  window.addEventListener('kos-keychain', () => action(rattle));
  window.addEventListener('kos-content-toggle', event => content(event.detail === 'open'));

  const btn = document.createElement('button');
  btn.type = 'button'; btn.setAttribute('aria-label', 'Toggle sound');
  btn.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:9999;display:flex;align-items:center;gap:9px;padding:9px 14px 9px 11px;border-radius:999px;border:1px solid rgba(255,255,255,0.7);background:rgba(20,17,15,0.55);color:#FFFFFF;font:600 10.5px/1 'IBM Plex Mono',monospace;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 10px 30px -12px rgba(43,36,102,0.6);";
  const bars = document.createElement('span');
  bars.setAttribute('aria-hidden', 'true');
  bars.style.cssText = 'display:flex;align-items:flex-end;gap:2px;height:12px;';
  for (let i = 0; i < 4; i++) {
    const bar = document.createElement('span');
    bar.style.cssText = 'width:2px;border-radius:2px;background:#FFFFFF;transition:height .3s;';
    bars.appendChild(bar);
  }
  const label = document.createElement('span'); btn.append(bars, label);

  function animate() {
    barsFrame = 0;
    if (!on || document.hidden) return;
    phase += 0.12;
    [...bars.children].forEach((bar, i) => { bar.style.height = (4 + 8 * Math.abs(Math.sin(phase + i * 1.3))) + 'px'; });
    barsFrame = requestAnimationFrame(animate);
  }
  function paint() {
    label.textContent = on ? 'Sound on' : 'Sound off';
    btn.setAttribute('aria-pressed', String(on));
    cancelAnimationFrame(barsFrame); barsFrame = 0;
    if (on && !document.hidden) barsFrame = requestAnimationFrame(animate);
    else [...bars.children].forEach(bar => { bar.style.height = '3px'; });
  }
  async function activate() {
    try {
      init(); clearTimeout(fadeTimer);
      await ctx.resume();
      if (!on || document.hidden) return;
      fade(master.gain, 1, 0.35);
      fade(ambient.gain, AMBIENT_LEVEL * 0.5, 3.5);
    } catch (_) {
      on = false;
      paint();
    }
  }
  function set(value) {
    on = value;
    clearTimeout(fadeTimer); clearSounds();
    if (on) activate();
    else if (ctx) {
      fade(master.gain, 0, 0.35);
      fadeTimer = setTimeout(() => { if (!on && ctx.state !== 'closed') ctx.suspend(); }, 450);
    }
    paint();
  }
  btn.onclick = event => { event.stopPropagation(); set(!on); };
  const mount = () => {
    if (!document.body) { setTimeout(mount, 50); return; }
    document.body.appendChild(btn); paint();
  };
  mount();

  // Only deliberate interaction makes a sound; automatic animations stay quiet.
  window.addEventListener('pointerdown', event => {
    if (on && !btn.contains(event.target) && (!ctx || ctx.state === 'suspended')) activate();
  }, true);
  window.addEventListener('keydown', event => {
    if (on && (event.key === 'Enter' || event.key === ' ') && !btn.contains(event.target) && (!ctx || ctx.state === 'suspended')) activate();
  }, true);
  document.addEventListener('pointerover', event => {
    const target = event.target.closest && event.target.closest('[data-l]');
    if (target && !target.contains(event.relatedTarget)) tak(+target.dataset.l || 0);
  }, true);
  document.addEventListener('click', event => {
    if (!audible() || btn.contains(event.target) || !event.target.closest) return;
    const summary = event.target.closest('summary');
    if (summary) {
      const details = summary.closest('details');
      if (details) action(() => {
        breath(0.045, details.open ? 0.015 : 0.020, 1600, 900, 0.001);
        tone(230, details.open ? 160 : 270, 0.010, 0.06);
      });
      return;
    }
    if (event.target.closest('a')) action(() => breath(0.035, 0.016, 1400, 900, 0.001));
  });
  document.addEventListener('visibilitychange', () => {
    clearSounds(); paint();
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (on) activate();
  });
  window.addEventListener('pagehide', event => {
    clearTimeout(fadeTimer); clearSounds(); cancelAnimationFrame(barsFrame);
    if (!ctx) return;
    if (event.persisted) ctx.suspend();
    else ctx.close();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { paint(); if (on && ctx) activate(); } });
})();
