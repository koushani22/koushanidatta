// Loads each video only when it scrolls near the screen, and pauses it when it leaves.
(function () {
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (!v.getAttribute('src') && v.dataset.lazy) { v.preload = 'auto'; v.src = v.dataset.lazy; }
        var p = v.play && v.play(); if (p && p.catch) p.catch(function () {});
      } else if (!v.paused) { v.pause(); }
    });
  }, { rootMargin: '300px 0px' });
  function scan() {
    document.querySelectorAll('video[data-lazy]').forEach(function (v) {
      if (v.__lz) return; v.__lz = 1; v.muted = true; v.playsInline = true; io.observe(v);
    });
  }
  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
