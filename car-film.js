// Plays the SQ FT. car film clips back to back, seamlessly, on loop.
(function () {
  function setup(box) {
    if (box.__car) return; box.__car = true;
    var v = [].slice.call(box.querySelectorAll('video[data-car]')).sort(function (a, b) { return a.dataset.car - b.dataset.car; });
    if (!v.length) return;
    v.forEach(function (el) { if (!el.getAttribute('src')) el.src = el.dataset.src; el.loop = false; el.muted = true; el.playsInline = true; el.preload = 'auto'; });
    var cur = 0;
    function show(i) { v.forEach(function (el, k) { el.style.opacity = k === i ? '1' : '0'; }); }
    v.forEach(function (el, i) {
      el.addEventListener('timeupdate', function () {
        if (i !== cur || !el.duration) return;
        var n = v[(i + 1) % v.length];
        if (el.duration - el.currentTime < 0.6 && n.paused) { n.currentTime = 0; n.play().catch(function () {}); }
      });
      el.addEventListener('ended', function () {
        if (i !== cur) return;
        cur = (i + 1) % v.length; var n = v[cur];
        if (n.paused) { n.currentTime = 0; n.play().catch(function () {}); }
        show(cur);
      });
    });
    v.forEach(function (el, i) { if (i) el.pause(); });
    show(0); v[0].currentTime = 0; v[0].play().catch(function () {});
  }
  setInterval(function () { document.querySelectorAll('[data-car-film]').forEach(setup); }, 500);
})();
