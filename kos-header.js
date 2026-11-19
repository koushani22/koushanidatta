// Floating corner header + "unboxing" menu. Injected outside the page template so it
// stays independent of the rest of the homepage. Remove the two <helmet> lines to undo.
(function () {
  if (window.__kosHeader) return;
  window.__kosHeader = 1;

  const FONTS = [
    { f: "'Instrument Serif',serif", v: 'normal', s: 'normal', w: 400 },
    { f: "'Instrument Serif',serif", v: 'normal', s: 'italic', w: 400 },
    { f: "'Anybody',sans-serif", v: "'wdth' 100,'wght' 650", s: 'normal', w: 650 }
  ];
  const ITEMS = [
    { href: '#work', label: 'Work', img: 'assets/thumbs/bloom.jpg', cap: 'Latest · Bloom' },
    { href: '#about', label: 'About', img: 'assets/me/koushani-portrait-real.webp', cap: "Hi, I'm Kos" },
    { href: '#experience', label: 'Journey', img: 'assets/me/penta-duo-1800.jpg', cap: 'Pentawards Bronze 2026' },
    { href: '#contact', label: 'Contact', img: 'assets/me/keychain-kos.webp', cap: 'Say hi', contain: true }
  ];


  function setF(el, i) {
    const F = FONTS[i % FONTS.length];
    el.style.fontFamily = F.f; el.style.fontVariationSettings = F.v; el.style.fontStyle = F.s; el.style.fontWeight = F.w;
    el.dataset.f = i % FONTS.length;
  }

  function build() {
    if (document.querySelector('.kh')) return;
    const hdr = document.createElement('header');
    hdr.className = 'kh';
    hdr.innerHTML =
      '<a class="kh-brand" href="#" aria-label="Koushani Datta, back to top">Koushani Datta</a>' +
      '<div class="kh-right"><span class="kh-clock"><i></i>London <span class="kh-time">--:--</span></span>' +
        '<button class="kh-btn" type="button" aria-expanded="false" aria-controls="kh-menu"><span class="kh-lbl">Menu</span></button></div>';

    const box = document.createElement('nav');
    box.className = 'kh-box'; box.id = 'kh-menu'; box.setAttribute('aria-label', 'Main');
    box.innerHTML =
      '<div class="kh-in"><div class="kh-sky" aria-hidden="true"></div><div class="kh-items">' +
      ITEMS.map((it, i) => '<a class="kh-item" href="' + it.href + '" data-i="' + i + '"><small>0' + (i + 1) + '</small><span class="kh-word" aria-label="' + it.label + '"></span><span class="kh-arrow" aria-hidden="true">↗</span></a>').join('') +
      '</div><figure class="kh-peek" aria-hidden="true"><img alt=""><figcaption></figcaption></figure>' +
      '<div class="kh-foot"><span><a href="mailto:koushanidatta22@gmail.com">Email</a><a href="https://www.linkedin.com/in/koushanidatta" target="_blank" rel="noopener">LinkedIn</a>' +
      '<a href="https://www.behance.net/koushanidatta" target="_blank" rel="noopener">Behance</a><a href="https://www.instagram.com/inkosistent" target="_blank" rel="noopener">Instagram</a></span>' +
      '<span>Brand &amp; packaging · London</span></div></div><div class="kh-lid" aria-hidden="true"></div>';

    document.body.appendChild(box);
    document.body.appendChild(hdr);

    // menu words: each letter in a different font, reshuffled on hover
    box.querySelectorAll('.kh-word').forEach((w, wi) => {
      [...ITEMS[wi].label].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); setF(s, (i * 2 + wi) % FONTS.length); w.appendChild(s); });
    });


    // London clock
    const tEl = hdr.querySelector('.kh-time');
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    const tick = () => { tEl.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 15000);

    // open / close
    const btn = hdr.querySelector('.kh-btn'), lbl = btn.querySelector('.kh-lbl'), root = document.documentElement;
    let skyBuilt = false;
    const setOpen = o => {
      if (o && !skyBuilt) { buildSky(box.querySelector('.kh-sky')); skyBuilt = true; }
      root.classList.toggle('kh-open', o); btn.setAttribute('aria-expanded', o); lbl.textContent = o ? 'Close' : 'Menu';
      if (o) setTimeout(() => { const f = box.querySelector('.kh-item'); f && f.focus({ preventScroll: true }); }, 500);
    };
    btn.addEventListener('click', () => setOpen(!root.classList.contains('kh-open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('kh-open')) { setOpen(false); btn.focus(); } });
    hdr.querySelector('.kh-brand').addEventListener('click', e => { e.preventDefault(); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); });

    const peek = box.querySelector('.kh-peek'), pimg = peek.querySelector('img'), pcap = peek.querySelector('figcaption');
    box.querySelectorAll('.kh-item').forEach(a => {
      const it = ITEMS[+a.dataset.i];
      a.addEventListener('pointerenter', () => {
        a.querySelectorAll('.kh-word span').forEach(s => setF(s, +s.dataset.f + 1 + ((Math.random() * 3) | 0)));
        pimg.src = it.img; pcap.textContent = it.cap; peek.classList.toggle('contain', !!it.contain); peek.classList.add('on');
      });
      a.addEventListener('pointerleave', () => peek.classList.remove('on'));
      a.addEventListener('click', e => {
        const target = document.querySelector(it.href);
        if (!target) return;
        e.preventDefault(); setOpen(false);
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 350);
      });
    });
  }

  function buildSky(sky) {
    let seed = 5; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const parts = [[0, 0, 46], [24, 10, 60], [52, 4, 50], [74, 0, 40], [36, -6, 44]];
    let html = '';
    for (let i = 0; i < 9; i++) {
      const near = i > 3, w = near ? 28 + r() * 12 : 16 + r() * 8;
      html += '<div class="kh-cl ' + (i % 3 === 1 ? 'pk' : '') + '" style="left:' + (-10 + (i % 5) * 24 + r() * 6) + '%;bottom:' + (near ? -8 + r() * 4 : 18 + r() * 10) + '%;width:' + w + 'vw;--d:' + (24 + i * 3) + 's;opacity:' + (near ? 1 : .7) + '">' +
        parts.map(([x, y, s]) => '<span style="left:' + x + '%;bottom:' + y + '%;width:' + s + '%"></span>').join('') + '</div>';
    }
    const cols = ['#fff', '#fff', '#FFE7A8', '#F7B9D6', '#D9C8FF'];
    for (let i = 0; i < 26; i++) {
      const s = [12, 14, 18, 22, 28][i % 5];
      html += '<span class="kh-sp" style="left:' + r() * 96 + '%;top:' + r() * 80 + '%;width:' + s + 'px;height:' + s + 'px;background:' + cols[i % 5] + ';--d:' + (2.4 + r() * 2.4) + 's;--dl:' + (-r() * 4) + 's"></span>';
    }
    sky.innerHTML = html;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
