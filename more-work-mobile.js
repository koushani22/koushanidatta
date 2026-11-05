(function () {
  if (window.kosMountMobileMoreWork) return;
  const style = document.createElement('style');
  style.textContent = `
.kos-more-mobile { height:auto!important; margin-top:24px!important; padding:0 18px 48px; perspective:none!important; overflow:visible!important; cursor:auto!important; -webkit-mask-image:none!important; mask-image:none!important; }
.kos-more-mobile [data-space-world],.kos-more-mobile [data-space-close] { display:none!important; }
.kos-mobile-work-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:22px 14px; }
.kos-mobile-work-grid button { display:block; width:100%; padding:0; border:0; background:transparent; color:#2B2466; text-align:left; font:500 12px/1.5 'DM Sans',system-ui,sans-serif; cursor:pointer; }
.kos-mobile-work-grid button[hidden] { display:none; }
.kos-mobile-work-grid .work-thumb-frame { position:relative; display:grid; place-items:center; width:100%; aspect-ratio:4/5; padding:6px; overflow:hidden; border:1px solid rgba(43,36,102,.16); border-radius:10px; background:#F3ECF6; }
.kos-mobile-work-grid img { display:block; width:100%; height:100%; object-fit:contain; }
.kos-mobile-work-grid .work-caption { display:block; margin-top:8px; }
.kos-mobile-work-grid .work-video-label { position:absolute; left:8px; bottom:8px; padding:4px 7px; border-radius:5px; background:#14110F; color:#F6F2EC; font:500 11px/1.4 'IBM Plex Mono',monospace; }
.kos-mobile-work-more { display:block; min-height:48px; width:100%; margin:24px 0 0; padding:10px 16px; border:1px solid #4A3E8C; border-radius:8px; background:#F6F2EC; color:#2B2466; font:500 13px/1.5 'IBM Plex Mono',monospace; cursor:pointer; }
.kos-mobile-work-dialog { box-sizing:border-box; width:calc(100% - 16px); max-width:960px; max-height:calc(100svh - 16px); padding:0; overflow:auto; border:0; border-radius:12px; background:#F6F2EC; color:#14110F; }
.kos-mobile-work-dialog::backdrop { background:rgba(20,17,15,.86); }
.kos-work-viewer-header { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 12px; }
.kos-work-viewer-header h3 { margin:0; font:500 14px/1.5 'DM Sans',system-ui,sans-serif; }
.kos-work-viewer-controls { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:8px 12px 12px; }
.kos-mobile-work-dialog button { min-width:48px; min-height:44px; padding:8px 12px; border:1px solid #CDC4C0; border-radius:7px; background:#F6F2EC; color:#14110F; font:500 13px/1.5 system-ui,sans-serif; cursor:pointer; }
.kos-mobile-work-dialog button:focus-visible,.kos-more-mobile button:focus-visible { outline:3px solid #C41E2A; outline-offset:3px; }
.kos-work-viewer-stage { display:grid; place-items:center; height:65svh; min-height:240px; padding:8px; background:#EAE3EC; }
.kos-work-viewer-stage img,.kos-work-viewer-stage video { display:block; width:100%; height:100%; object-fit:contain; }
.kos-work-viewer-count { font:500 12px/1.5 'IBM Plex Mono',monospace; }
`;
  document.head.appendChild(style);
  window.kosMountMobileMoreWork = function (host, items) {
    const abort = new AbortController(), signal = abort.signal;
    const hint = host.parentElement.querySelector('[data-more-help]');
    const originalHint = hint && hint.textContent, originalHintStyle = hint && hint.getAttribute('style');
    if (hint) {
      hint.textContent = 'Tap a piece to view · Scroll to browse';
      hint.style.fontSize = '12px'; hint.style.lineHeight = '1.6'; hint.style.letterSpacing = '0.08em';
    }
    host.classList.add('kos-more-mobile');
    const grid = document.createElement('div'); grid.className = 'kos-mobile-work-grid'; grid.dataset.moreGrid = '';
    const more = document.createElement('button'); more.type = 'button'; more.className = 'kos-mobile-work-more';
    more.setAttribute('aria-expanded','false');
    grid.id = 'kos-mobile-more-grid'; more.setAttribute('aria-controls',grid.id);
    const dialog = document.createElement('dialog'); dialog.className = 'kos-mobile-work-dialog'; dialog.dataset.moreViewer = '';
    dialog.setAttribute('aria-labelledby','kos-work-viewer-title');
    dialog.innerHTML = '<div class="kos-work-viewer-header"><h3 id="kos-work-viewer-title"></h3><button type="button" data-viewer-close aria-label="Close artwork">Close ×</button></div><div class="kos-work-viewer-stage"></div><div class="kos-work-viewer-controls"><button type="button" data-viewer-prev aria-label="Previous artwork">←</button><span class="kos-work-viewer-count" aria-live="polite"></span><button type="button" data-viewer-next aria-label="Next artwork">→</button></div>';
    document.body.appendChild(dialog);
    const stage = dialog.querySelector('.kos-work-viewer-stage'), title = dialog.querySelector('h3'), count = dialog.querySelector('.kos-work-viewer-count');
    let active = 0, trigger = null, previousOverflow = '', expanded = false;
    function clearMedia() {
      stage.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
      stage.replaceChildren();
    }
    function show(index) {
      active = (index + items.length) % items.length;
      clearMedia();
      const item = items[active], video = item[2] === 'v';
      title.textContent = item[1]; count.textContent = (active + 1) + ' / ' + items.length;
      const media = document.createElement(video ? 'video' : 'img');
      if (video) {
        media.controls = true; media.playsInline = true; media.muted = true; media.preload = 'metadata';
        media.poster = item[0].replace('.mp4','-poster.webp');
        media.setAttribute('aria-label',item[1]);
      } else { media.alt = item[1]; media.decoding = 'async'; }
      media.src = item[0]; stage.appendChild(media);
      if (video) media.play().catch(() => {});
    }
    function open(index, button) {
      trigger = button;
      show(index);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      window.dispatchEvent(new CustomEvent('kos-content-toggle',{detail:'open'}));
    }
    const buttons = items.map((item,index) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.workItem = String(index);
      button.setAttribute('aria-label','Open ' + item[1]); button.setAttribute('aria-haspopup','dialog');
      button.hidden = index >= 8;
      const frame = document.createElement('span'); frame.className = 'work-thumb-frame';
      const image = document.createElement('img'); image.loading = 'lazy'; image.decoding = 'async'; image.alt = '';
      const filename = item[0].split('/').pop().replace(/\.(mp4|png|webp)$/i,'');
      image.src = /^(m\d{2}|n\d{2})$/.test(filename)
        ? 'assets/more/mobile/' + filename + '.webp'
        : item[2] === 'v' ? item[0].replace('.mp4','-poster.webp') : item[0];
      frame.appendChild(image);
      if (item[2] === 'v') { const badge = document.createElement('span'); badge.className = 'work-video-label'; badge.textContent = 'Play film'; frame.appendChild(badge); }
      const caption = document.createElement('span'); caption.className = 'work-caption'; caption.textContent = item[1];
      button.append(frame,caption);
      button.addEventListener('click',()=>open(index,button),{signal});
      grid.appendChild(button); return button;
    });
    const paintMore = () => { more.textContent = expanded ? 'Show fewer works' : 'Show all ' + items.length + ' works'; more.setAttribute('aria-expanded',String(expanded)); };
    more.addEventListener('click',()=>{ expanded = !expanded; buttons.forEach((button,index)=>button.hidden = !expanded && index >= 8); paintMore(); },{signal});
    paintMore(); host.append(grid,more);
    dialog.querySelector('[data-viewer-close]').addEventListener('click',()=>dialog.close(),{signal});
    dialog.querySelector('[data-viewer-prev]').addEventListener('click',()=>show(active-1),{signal});
    dialog.querySelector('[data-viewer-next]').addEventListener('click',()=>show(active+1),{signal});
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();},{signal});
    dialog.addEventListener('keydown',event=>{
      if (event.target.tagName === 'VIDEO') return;
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(active+(event.key==='ArrowLeft'?-1:1));}
    },{signal});
    dialog.addEventListener('close',()=>{
      clearMedia(); document.body.style.overflow = previousOverflow;
      if(trigger && trigger.isConnected)trigger.focus();
      window.dispatchEvent(new CustomEvent('kos-content-toggle',{detail:'close'}));
    },{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stage.querySelectorAll('video').forEach(video=>video.pause());},{signal});
    return () => {
      if(dialog.open){dialog.close();document.body.style.overflow=previousOverflow;}
      clearMedia();abort.abort();dialog.remove();grid.remove();more.remove();host.classList.remove('kos-more-mobile');
      if(hint){hint.textContent=originalHint;hint.setAttribute('style',originalHintStyle);}
    };
  };
})();

