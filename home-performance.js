// Homepage-only loading controls. Project pages keep their own video sequencing.
(function () {
  if (window.kosHomePerformance) return;

  function watchMedia() {
    const videos = new Set(), visible = new Set(), watched = new WeakSet();
    const imageQueue = new Set();
    let imageActive = 0, stopped = false;
    const drainImages = () => {
      if (stopped) return;
      while (imageActive < 3 && imageQueue.size) {
        const distance = el => Math.max(0, el.getBoundingClientRect().top - innerHeight);
        const img = [...imageQueue].sort((a, b) => distance(a) - distance(b))[0];
        imageQueue.delete(img);
        imageActive++;
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          img.removeEventListener('load', done); img.removeEventListener('error', done);
          imageActive--; drainImages();
        };
        img.addEventListener('load', done); img.addEventListener('error', done);
        // The observer already controls loading; do not defer it a second time.
        img.loading = 'eager';
        img.src = img.dataset.src;
        if (img.complete) done();
      }
    };
    const imageLoad = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        imageQueue.add(entry.target); imageLoad.unobserve(entry.target);
      });
      drainImages();
    }, { rootMargin: '1800px 0px' });
    const valid = value => value && !value.includes('{{');
    const play = video => {
      if (document.hidden || !visible.has(video) || !video.getAttribute('src')) return;
      if (!video.paused) return;
      const result = video.play();
      if (result && result.catch) result.catch(() => {});
    };
    const load = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const source = element.dataset.lazy || element.dataset.src;
        if (!valid(source)) return;
        element.setAttribute('src', source);
        load.unobserve(element);
        if (element.tagName === 'VIDEO') play(element);
      });
    }, { rootMargin: '300px 0px' });
    const playback = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) { visible.add(video); play(video); }
        else { visible.delete(video); video.pause(); }
      });
    }, { threshold: 0.05 });
    const scan = root => {
      const elements = [];
      if (root.matches && root.matches('video, img[data-src]')) elements.push(root);
      if (root.querySelectorAll) elements.push(...root.querySelectorAll('video, img[data-src]'));
      elements.forEach(element => {
        if (watched.has(element) || element.closest('x-dc')) return;
        const source = element.dataset.lazy || element.dataset.src;
        if (!valid(source)) return;
        watched.add(element);
        if (element.tagName === 'VIDEO') {
          element.autoplay = false;
          element.removeAttribute('autoplay');
          element.preload = 'metadata';
          element.muted = true;
          element.defaultMuted = true;
          element.loop = true;
          element.playsInline = true;
          videos.add(element);
          playback.observe(element);
        }
        if (element.tagName === 'IMG') imageLoad.observe(element);
        else load.observe(element);
      });
    };
    const resume = () => videos.forEach(video => {
      if (document.hidden) video.pause();
      else play(video);
    });
    const changes = new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); });
    }));
    scan(document);
    changes.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', resume);
    document.addEventListener('pointerdown', resume);
    return () => {
      stopped = true; imageQueue.clear(); imageLoad.disconnect();
      load.disconnect(); playback.disconnect(); changes.disconnect();
      document.removeEventListener('visibilitychange', resume);
      document.removeEventListener('pointerdown', resume);
      videos.forEach(video => video.pause());
      videos.clear(); visible.clear();
    };
  }

  // Wait for the section to approach the screen and let the page paint first.
  function observeScene(target, mount) {
    let cancelled = false, started = false, handle, frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (started || !entries.some(entry => entry.isIntersecting)) return;
      started = true;
      observer.disconnect();
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (cancelled) return;
          Promise.resolve().then(mount).then(result => {
            if (cancelled) { if (result && result.dispose) result.dispose(); }
            else handle = result;
          }).catch(error => console.warn('3D failed', error));
        });
      });
    }, { rootMargin: '150px 0px' });
    observer.observe(target);
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      if (handle && handle.dispose) handle.dispose();
    };
  }

  // Keep the last rendered garden frame while scrolling or awaiting visible art.
  let lastScroll = -Infinity, lastCheck = -Infinity, artworkPending = false;
  window.addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  function canRenderWorld() {
    const now = performance.now();
    if (document.hidden || now - lastScroll < 180) return false;
    if (now - lastCheck > 150) {
      lastCheck = now;
      artworkPending = [...document.images].some(img => {
        if (img.closest('x-dc') || img.complete || !img.getAttribute('src')) return false;
        const r = img.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      });
    }
    return !artworkPending;
  }
  window.kosHomePerformance = { watchMedia, observeScene, canRenderWorld };
})();
