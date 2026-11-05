(function () {
  if (window.__kosSound) return;
  window.__kosSound = 1;
  const AMBIENT_LEVEL = 0.08; // Approved warm-keys demo at 8%.
  let on = false;
  let ctx, master, ambient, effects, fadeTimer = 0, barsFrame = 0, phase = 0;
  let musicDry, musicWet, musicTimer = 0, musicStep = 0, musicNext = 0;
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
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1500; filter.Q.value = 0.35;
    filter.connect(ambient);
    musicDry = ctx.createGain(); musicDry.gain.value = 0.85; musicDry.connect(filter);
    const reverb = ctx.createConvolver(), length = Math.floor(ctx.sampleRate * 2.8);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    let seed = 17123;
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        seed = (seed * 16807) % 2147483647;
        samples[i] = ((seed / 2147483647) * 2 - 1) * Math.pow(1 - i / length, 3.2);
      }
    }
    reverb.buffer = impulse;
    musicWet = ctx.createGain(); musicWet.gain.value = 0.20;
    musicWet.connect(reverb); reverb.connect(filter);
  }

  function musicVoice(midi, time, duration, amplitude, pad, panPosition) {
    const gain = ctx.createGain(), pan = ctx.createStereoPanner();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(amplitude, time + (pad ? 0.8 : 0.035));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    pan.pan.value = panPosition;
    gain.connect(pan); pan.connect(musicDry); pan.connect(musicWet);
    const partials = pad ? [[1,1]] : [[1,1],[2,0.16],[3,0.035]];
    let remaining = partials.length;
    partials.forEach(([ratio, level], index) => {
      const oscillator = ctx.createOscillator(), partialGain = ctx.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12) * ratio;
      partialGain.gain.setValueAtTime(level, time);
      if (index) partialGain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.15, duration / (index + 1)));
      oscillator.connect(partialGain); partialGain.connect(gain);
      oscillator.onended = () => {
        oscillator.disconnect(); partialGain.disconnect();
        if (!--remaining) { gain.disconnect(); pan.disconnect(); }
      };
      oscillator.start(time); oscillator.stop(time + duration + 0.02);
    });
  }

  function stopMusic() {
    clearInterval(musicTimer); musicTimer = 0; musicNext = 0;
  }
  function startMusic() {
    if (musicTimer || !audible()) return;
    const chords = [[48,52,55,59], [45,52,55,59], [53,57,60,64], [43,50,55,57]];
    const beat = 60 / 72;
    musicNext = ctx.currentTime + 0.12;
    const schedule = () => {
      if (!audible()) return;
      while (musicNext < ctx.currentTime + 0.18) {
        const position = musicStep % 16, chord = chords[Math.floor(musicStep / 16) % chords.length];
        if (!position) chord.forEach((note, index) => musicVoice(note, musicNext, beat * 7.6, 0.020, true, (index - 1.5) * 0.18));
        const part = [0,5,11].indexOf(position);
        if (part >= 0) musicVoice(chord[[0,2,1][part]] + 12, musicNext, 2.8, part ? 0.19 : 0.23, false, [-0.15,0.15,0][part]);
        musicStep++; musicNext += beat / 2;
      }
    };
    schedule(); musicTimer = setInterval(schedule, 50);
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

  // Short, inharmonic steel contacts for the About-section keychain.
  // Separate from the landing-page 3D object's existing effect.
  let keychainBuffer, lastKeychain = -Infinity;
  function keychainJingle() {
    const now = performance.now();
    if (!audible() || now - lastKeychain < 1200) return;
    lastKeychain = now;
    if (!keychainBuffer) {
      const rate = ctx.sampleRate, length = Math.ceil(rate * 1.08);
      keychainBuffer = ctx.createBuffer(1, length, rate);
      const samples = keychainBuffer.getChannelData(0);
      const contacts = [[0,0.24,0.97],[0.105,1,1],[0.121,0.44,1.13],[0.352,0.55,0.91],[0.371,0.24,1.08],[0.603,0.27,1.04],[0.622,0.12,0.94],[0.855,0.09,1.10]];
      const modes = [[860,0.13,0.018],[1880,1,0.032],[3017,0.64,0.024],[4580,0.38,0.017],[6340,0.20,0.012],[8170,0.10,0.008]];
      let seed = 7283;
      contacts.forEach(([at, strength, pitch]) => {
        const start = Math.round(at * rate), count = Math.ceil(0.16 * rate);
        let previousNoise = 0;
        for (let i = 0; i < count && start + i < length; i++) {
          const t = i / rate;
          let value = 0;
          modes.forEach(([frequency, level, decay]) => {
            value += Math.sin(2 * Math.PI * frequency * pitch * t) * level * Math.exp(-t / decay);
          });
          seed = seed * 16807 % 2147483647;
          const noise = seed / 2147483647 * 2 - 1;
          value += (noise - previousNoise) * 0.16 * Math.exp(-t / 0.004);
          previousNoise = noise;
          samples[start + i] += value * strength * Math.min(1, t / 0.0007);
        }
      });
      let peak = 0;
      for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(samples[i]));
      if (peak) for (let i = 0; i < length; i++) samples[i] *= 0.065 / peak;
    }
    const source = ctx.createBufferSource();
    source.buffer = keychainBuffer; source.connect(effects);
    source.onended = () => source.disconnect();
    source.start();
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
  window.addEventListener('kos-keychain', keychainJingle);
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
      fade(ambient.gain, AMBIENT_LEVEL * 0.9, 1.5);
      startMusic();
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
      stopMusic();
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
    if (document.hidden) { stopMusic(); ctx.suspend(); }
    else if (on) activate();
  });
  window.addEventListener('pagehide', event => {
    clearTimeout(fadeTimer); clearSounds(); stopMusic(); cancelAnimationFrame(barsFrame);
    if (!ctx) return;
    if (event.persisted) ctx.suspend();
    else ctx.close();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { paint(); if (on && ctx) activate(); } });
})();
