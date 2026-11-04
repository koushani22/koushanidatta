// Homepage-only loading controls. Project pages keep their own video sequencing.
(function () {
  if (window.kosHomePerformance) return;

  function watchMedia() {
    const videos = new Set(), visible = new Set(), watched = new WeakSet();
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
        load.observe(element);
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

  window.kosHomePerformance = { watchMedia, observeScene };
})();
