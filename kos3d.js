// Shared 3D sculpture garden for project pages. window.mountKos3D(canvas, { seed }) -> { dispose }
(function () {
  const B = 'https://esm.sh/three@0.169.0';
  window.mountKos3D = async function (cv, opts) {
    opts = opts || {};
    const T = await import(B);
    const { RoomEnvironment } = await import(B + '/examples/jsm/environments/RoomEnvironment.js');
    const { RoundedBoxGeometry } = await import(B + '/examples/jsm/geometries/RoundedBoxGeometry.js');
    const host = cv.parentElement;
    const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false });
    R.setPixelRatio(Math.min(1.5, window.devicePixelRatio)); R.outputColorSpace = T.SRGBColorSpace; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 0.95;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); scene.environmentIntensity = 0.6;
    const sky = new T.Mesh(new T.SphereGeometry(80, 32, 16), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false,
      uniforms: { top: { value: new T.Color(0x2B2466) }, mid: { value: new T.Color(0xB9B7E8) }, bot: { value: new T.Color(0xF6F2EC) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.7, h)) : mix(mid, bot, smoothstep(0.0, -0.2, h)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }));
    scene.add(sky);
    scene.add(new T.HemisphereLight(0xEDEBFF, 0xC9B39A, 0.6));
    const sun = new T.DirectionalLight(0xFFEBD2, 2.6); sun.position.set(-8, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 10, bottom: -10, near: 1, far: 40 }); sun.shadow.radius = 4; scene.add(sun);
    const floor = new T.Mesh(new T.CircleGeometry(40, 48), new T.MeshStandardMaterial({ color: 0x93A862, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const P = o => new T.MeshPhysicalMaterial(o);
    const M = {
      red: P({ color: 0xA9121C, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 }),
      chrome: P({ color: 0xffffff, metalness: 1, roughness: 0.04 }),
      marble: P({ color: 0xF3EDE6, roughness: 0.25, clearcoat: 0.8 }),
      clay: P({ color: 0xB9643F, roughness: 0.5, sheen: 0.4, sheenColor: new T.Color(0xffc2a0) }),
      glass: P({ color: 0xffffff, transmission: 1, thickness: 1.2, roughness: 0.03, ior: 1.5, iridescence: 0.5 }),
      stone: new T.MeshStandardMaterial({ color: 0xEDE2D2, roughness: 0.85 }),
      pink: P({ color: 0xE597B8, roughness: 0.45, sheen: 1, sheenColor: new T.Color(0xffe4f6) })
    };
    const add = (g, m, x, y, z) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
    const plinth = (x, z, h) => add(new RoundedBoxGeometry(1.8, h, 1.8, 3, 0.05), M.stone, x, h / 2, z);
    const curve = new T.CatmullRomCurve3([[-1.2, 0, 0], [-0.4, 1.4, 0.6], [0.8, 2.2, -0.4], [1.1, 1.0, 0.7], [0.1, 0.4, -0.6], [-0.9, 1.8, -0.2], [0.2, 3.0, 0.3], [1.2, 2.6, 0.9]].map(p => new T.Vector3(...p)), true);
    const amph = [[0, 0], [0.45, 0.02], [0.62, 0.2], [0.9, 0.85], [1.0, 1.45], [0.86, 2.05], [0.52, 2.5], [0.34, 2.82], [0.38, 3.05], [0.5, 3.15]].map(p => new T.Vector2(p[0], p[1]));
    // each object: its own click motion
    const objs = [];
    const mk = (o, kind, extra) => { o.userData = Object.assign({ kind, y0: o.position.y, k: 0 }, extra); objs.push(o); return o; };
    plinth(-6.5, 0, 1.4); mk(add(new T.SphereGeometry(1, 64, 48), M.chrome, -6.5, 2.4, 0), 'spin');
    plinth(-2.4, -2, 1.0); { const r = add(new T.TubeGeometry(curve, 160, 0.22, 16, true), M.marble, -2.4, 1.0, -2); r.scale.setScalar(0.7); mk(r, 'twist'); }
    mk(add(new T.TorusGeometry(1.5, 0.24, 32, 96), M.red, 2.2, 1.75, -1.5), 'flip');
    plinth(6.2, 0.5, 1.2); { const v = add(new T.LatheGeometry(amph, 48), M.clay, 6.2, 1.2, 0.5); v.scale.setScalar(0.7); mk(v, 'hop'); }
    mk(add(new T.IcosahedronGeometry(0.8, 0), M.glass, 0, 3.6, 2.5), 'pulse');
    const ring = []; const rg = [new T.OctahedronGeometry(0.4, 0), new T.SphereGeometry(0.3, 24, 16), new RoundedBoxGeometry(0.5, 0.5, 0.5, 2, 0.05)], rm = [M.stone, M.chrome, M.pink];
    for (let i = 0; i < 7; i++) { const o = add(rg[i % 3], rm[(i + 1) % 3], 0, 0, 0); mk(o, 'orbit', { a: i / 7 * Math.PI * 2, sp: 1 }); ring.push(o); }
    const cam = new T.PerspectiveCamera(34, 1, 0.1, 200); const tgt = new T.Vector3(0, 2, 0);
    let W = 1, H = 1;
    const size = () => { W = host.clientWidth; H = host.clientHeight; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(host);
    const ray = new T.Raycaster(), nd = new T.Vector2(); let mx = 0, my = 0, smx = 0, smy = 0, hov = null;
    const pick = e => { const r = cv.getBoundingClientRect(); nd.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(nd, cam); const h = ray.intersectObjects(objs, false)[0]; return h ? h.object : null; };
    const move = e => { const r = host.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1; if (Math.abs(mx) <= 1 && Math.abs(my) <= 1) { hov = pick(e); cv.style.cursor = hov ? 'pointer' : 'default'; } };
    const click = e => { const o = pick(e); if (!o) return; const u = o.userData;
      if (u.kind === 'orbit') ring.forEach(r => r.userData.sp = 9); else u.k = 1; };
    window.addEventListener('pointermove', move); cv.addEventListener('click', click);
    let vis = true; const io = new IntersectionObserver(([en]) => { vis = en.isIntersecting; }); io.observe(host);
    const t0 = performance.now(); let prev = t0, raf;
    const loop = () => { raf = requestAnimationFrame(loop); if (!vis) { prev = performance.now(); return; }
      const now = performance.now(), dt = Math.min(0.05, (now - prev) / 1000), t = (now - t0) / 1000; prev = now;
      smx += (mx - smx) * 0.04; smy += (my - smy) * 0.04;
      const intro = 1 - Math.pow(1 - Math.min(1, t / 2.4), 3), rad = 17 + (1 - intro) * 8, az = 0.15 + smx * 0.12 + (1 - intro) * 0.4, el = 0.28 - smy * 0.05;
      cam.position.set(Math.sin(az) * Math.cos(el) * rad, 2 + Math.sin(el) * rad, Math.cos(az) * Math.cos(el) * rad); cam.lookAt(tgt);
      objs.forEach(o => { const u = o.userData; const k = u.k; u.k *= 0.965; const hv = o === hov ? 0.08 : 0;
        if (u.kind === 'spin') { o.rotation.y += dt * (0.3 + k * 14); o.position.y = u.y0 + hv; }
        else if (u.kind === 'twist') { o.rotation.y += dt * 0.2; o.rotation.z = Math.sin(t * 6) * 0.35 * k; o.position.y = u.y0 + hv; }
        else if (u.kind === 'flip') { o.rotation.x = Math.sin(t * 0.4) * 0.15 + (1 - k) * 0 + k * Math.PI * 2 * (1 - k); o.rotation.y = -0.6; o.position.y = u.y0 + Math.sin(t * 0.8) * 0.12 + hv; }
        else if (u.kind === 'hop') { o.position.y = u.y0 + Math.abs(Math.sin((1 - k) * Math.PI * 3)) * 1.2 * k + hv; o.rotation.y += dt * 0.1; }
        else if (u.kind === 'fan') { (u.fan || []).forEach((p, j) => { p.rotation.z = (j - 2) * (0.12 + k * 0.5 + Math.sin(t * 0.8) * 0.03); }); o.rotation.y = Math.sin(t * 0.4 + i) * 0.5; }
        else if (u.kind === 'pulse') { const s = 1 + Math.sin(t * 18) * 0.25 * k; o.scale.setScalar(s); o.rotation.x += dt * (0.2 + k * 6); o.rotation.y += dt * 0.3; o.position.y = u.y0 + Math.sin(t * 0.9) * 0.25 + hv; }
        else if (u.kind === 'orbit') { u.sp += (1 - u.sp) * 0.02; u.a += dt * 0.22 * u.sp; o.position.set(Math.cos(u.a) * 3.4 + 2.2, 4.6 + Math.sin(u.a * 2) * 0.3, Math.sin(u.a) * 3.4 - 1.5); o.rotation.x += dt * u.sp; o.rotation.y += dt * 0.7 * u.sp; }
      });
      R.render(scene, cam); };
    loop();
    return { dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', move); cv.removeEventListener('click', click); R.dispose(); } };
  };

  // ---- craft objects: things Kos works with
  const makeCraft = (T, RB, kind) => {
    const P = o => new T.MeshPhysicalMaterial(o), outer = new T.Group(), g = new T.Group(); outer.add(g); g.scale.setScalar(1.35);
    const add = (geo, m, x, y, z, par) => { const o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); (par || g).add(o); return o; };
    const pearl = (c, o) => P(Object.assign({ color: c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.25, sheenRoughness: 0.4, sheenColor: new T.Color(0xFFD6EA), iridescence: 0.18, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520] }, o || {}));
    const pink = pearl(0xFF5C9E), lilac = pearl(0x8E6BFF), pist = pearl(0x7ED957), cream = pearl(0xFFD9A8, { iridescence: 0.1 }), red = pearl(0xF0142F, { iridescence: 0.08 }),
      chrome = P({ color: 0xFF9EC8, metalness: 0.45, roughness: 0.12, clearcoat: 1, iridescence: 0.3 }), gold = P({ color: 0xFFC23D, metalness: 1, roughness: 0.16 }),
      glass = P({ color: 0xFFFFFF, transmission: 1, thickness: 0.8, roughness: 0.04, ior: 1.45, iridescence: 0.5, clearcoat: 1 });
    const lathe = (pts, m, seg) => add(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg || 72), m);
    const bead = (r, m, x, y, z) => add(new T.SphereGeometry(r, 32, 20), m, x, y, z);
    if (kind === 'bottle') {
      lathe([[0, -1.05], [0.62, -1.05], [0.82, -0.85], [0.86, -0.2], [0.78, 0.35], [0.5, 0.62], [0.24, 0.72], [0.22, 0.86], [0, 0.86]], glass);
      lathe([[0, -0.95], [0.6, -0.95], [0.74, -0.8], [0.76, -0.2], [0.66, 0.2], [0, 0.2]], pink);
      add(new T.CylinderGeometry(0.3, 0.3, 0.12, 40), gold, 0, 0.92);
      const cap = add(new T.IcosahedronGeometry(0.42, 1), chrome, 0, 1.3); cap.scale.set(1, 1.15, 1);
      const rib = add(new T.TorusGeometry(0.27, 0.06, 16, 48), lilac, 0, 0.8); rib.rotation.x = Math.PI / 2;
      bead(0.09, red, 0.3, 0.78, 0.12);
      outer.userData.label = 'Packaging'; outer.userData.motion = 'bounce'; }
    else if (kind === 'box') {
      add(new RB(1.5, 1.15, 1.5, 4, 0.12), P({ color: 0xFF5C9E, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.15, sheenColor: new T.Color(0xFFC6DD), iridescence: 0.1 }));
      add(new RB(1.64, 1.24, 0.3, 3, 0.05), red); add(new RB(0.3, 1.24, 1.64, 3, 0.05), red);
      [-1, 1].forEach(d => { const l = add(new T.TorusGeometry(0.26, 0.1, 20, 40), red, d * 0.24, 0.8, 0); l.rotation.y = d * 0.7; l.scale.set(1, 0.8, 1); });
      bead(0.13, chrome, 0, 0.72, 0);
      outer.userData.label = 'Packaging'; outer.userData.motion = 'tumble'; }
    else if (kind === 'pencil') {
      const body = add(new T.CylinderGeometry(0.32, 0.32, 1.7, 6, 1), pist); body.geometry.computeVertexNormals();
      add(new T.CylinderGeometry(0.33, 0.33, 0.06, 6), cream, 0, 0.5);
      lathe([[0.32, 0.85], [0.08, 1.38], [0, 1.4]], cream).position.y = 0;
      bead(0.1, red, 0, 1.36, 0);
      add(new T.CylinderGeometry(0.335, 0.335, 0.26, 40), chrome, 0, -0.98);
      const er = add(new T.CapsuleGeometry(0.31, 0.12, 12, 32), pink, 0, -1.22);
      g.rotation.z = 0.65; outer.userData.label = 'Illustration'; outer.userData.motion = 'spin'; }
    else if (kind === 'swatch') {
      const cols = [0xE8364A, 0xF4AFCB, 0xF6D58A, 0xBFE3A2, 0xC6B6F2]; outer.userData.fan = [];
      cols.forEach((c, i) => { const piv = new T.Group(); g.add(piv); const sw = new T.Mesh(new RB(0.62, 1.9, 0.14, 4, 0.07), pearl(c)); sw.position.y = 0.8; piv.add(sw);
        const dot = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.02, 32), cream); dot.rotation.x = Math.PI / 2; dot.position.set(0, 1.4, 0.08); piv.add(dot);
        piv.position.z = i * 0.13; piv.rotation.z = (i - 2) * 0.14; outer.userData.fan.push(piv); });
      const riv = add(new T.CylinderGeometry(0.13, 0.13, 0.8, 32), chrome, 0, 0, 0.26); riv.rotation.x = Math.PI / 2;
      outer.userData.label = 'Branding'; outer.userData.motion = 'fan'; }
    else if (kind === 'reel') {
      const d = add(new T.CylinderGeometry(1, 1, 0.26, 72), lilac); d.rotation.x = Math.PI / 2;
      const rim = add(new T.TorusGeometry(1, 0.14, 24, 96), chrome);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; bead(0.22, i % 2 ? pink : pist, Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0.12); }
      bead(0.2, red, 0, 0, 0.16);
      outer.userData.label = 'Motion'; outer.userData.motion = 'spin'; }
    else if (kind === 'knot') {
      add(new T.TorusKnotGeometry(0.62, 0.26, 240, 36, 2, 3), P({ color: 0xF7D8EA, metalness: 0.45, roughness: 0.12, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [200, 800] }));
      outer.userData.label = '3D'; outer.userData.motion = 'pulse'; }
    else if (kind === 'brush') {
      lathe([[0, -1.3], [0.16, -1.3], [0.2, -1.1], [0.15, 0.2], [0.18, 0.35], [0, 0.35]], lilac);
      add(new T.CylinderGeometry(0.24, 0.2, 0.42, 40), chrome, 0, 0.56);
      lathe([[0, 0.76], [0.26, 0.78], [0.28, 1.05], [0.16, 1.4], [0.02, 1.62], [0, 1.62]], pink);
      bead(0.12, pist, 0, -1.32, 0);
      g.rotation.z = -0.55; outer.userData.label = 'Art direction'; outer.userData.motion = 'spin'; }
    else if (kind === 'keychain') {
      g.scale.setScalar(0.62); const chromeK = P({ color: 0xFFFFFF, metalness: 1, roughness: 0.06 });
      const lil = pearl(0xB9A6F2, { roughness: 0.35, iridescence: 0.05 }), redK = P({ color: 0xE3101E, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.03 });
      // carabiner (stadium)
      const st = []; const Wd = 1.8, Rr = 0.5; for (let i = 0; i < 64; i++) { const u = i / 64 * 4; let x, y;
        if (u < 1) { x = -Wd + u * 2 * Wd; y = Rr; } else if (u < 2) { const a = Math.PI / 2 - (u - 1) * Math.PI; x = Wd + Math.cos(a) * Rr; y = Math.sin(a) * Rr; } else if (u < 3) { x = Wd - (u - 2) * 2 * Wd; y = -Rr; } else { const a = -Math.PI / 2 - (u - 3) * Math.PI; x = -Wd + Math.cos(a) * Rr; y = Math.sin(a) * Rr; }
        st.push(new T.Vector3(x, y + 1.6, 0)); }
      add(new T.TubeGeometry(new T.CatmullRomCurve3(st, true), 200, 0.12, 20, true), chromeK);
      const gate = add(new T.CylinderGeometry(0.135, 0.135, 0.5, 24), chromeK, 0.9, 1.6 + Rr, 0); gate.rotation.z = Math.PI / 2;
      const link = (par, y, rot) => { const l = new T.Mesh(new T.TorusGeometry(0.09, 0.03, 12, 24), chromeK); l.scale.set(1, 1.4, 1); l.position.y = y; l.rotation.y = rot ? Math.PI / 2 : 0; par.add(l); return l; };
      const charms = []; const hang = (x, len, ball) => { const pv = new T.Group(); pv.position.set(x, 1.6 - Rr, 0); g.add(pv); const ring = new T.Mesh(new T.TorusGeometry(0.16, 0.035, 12, 32), chromeK); ring.position.y = -0.05; pv.add(ring);
        if (ball) { for (let j = 0; j < len; j++) { const b = new T.Mesh(new T.SphereGeometry(0.045, 12, 10), chromeK); b.position.y = -0.22 - j * 0.1; pv.add(b); } }
        else for (let j = 0; j < len; j++) link(pv, -0.24 - j * 0.2, j % 2);
        const end = new T.Group(); end.position.y = ball ? -0.28 - len * 0.1 : -0.3 - len * 0.2; end.scale.setScalar(1.55); pv.add(end); charms.push(pv); return end; };
      // box
      { const e = hang(-1.85, 3); const bx = new T.Group(); bx.position.y = -0.45; bx.rotation.z = 0.25; e.add(bx);
        const body = new T.Mesh(new RB(0.62, 0.72, 0.62, 3, 0.03), lil); bx.add(body);
        const sw = new T.Mesh(new T.TorusGeometry(0.2, 0.06, 12, 32, Math.PI * 1.2), redK); sw.position.set(0, -0.05, 0.315); sw.scale.z = 0.2; bx.add(sw);
        [-1, 1].forEach(d => { const fl = new T.Mesh(new T.BoxGeometry(0.6, 0.02, 0.3), lil); fl.position.set(0, 0.36, d * 0.3); fl.rotation.x = d * 0.9; bx.add(fl); }); }
      // tags
      { const e = hang(-1.05, 5, true); [[0xF0142F, -0.18], [0xF6B9C9, 0], [0xC7EB7A, 0.18]].forEach(([c, r], j) => { const t = new T.Mesh(new RB(0.42, 0.6, 0.04, 3, 0.04), pearl(c, { iridescence: 0.05 })); t.position.set(j * 0.12, -0.3, -j * 0.05); t.rotation.z = r; e.add(t); }); }
      // flower
      { const e = hang(-0.3, 2); const fw = new T.Group(); fw.position.y = -0.4; e.add(fw);
        for (let j = 0; j < 5; j++) { const a = j / 5 * Math.PI * 2 + Math.PI / 2; const pt = new T.Mesh(new T.SphereGeometry(0.2, 28, 20), chromeK); pt.scale.set(0.75, 1.25, 0.6); pt.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0); pt.rotation.z = a - Math.PI / 2; fw.add(pt); }
        const ctr = new T.Mesh(new T.SphereGeometry(0.11, 24, 16), lil); ctr.position.z = 0.1; fw.add(ctr); }
      // KOS. text (async font)
      { const e = hang(0.6, 2); const tg = new T.Group(); tg.position.set(0, -0.25, 0.1); tg.scale.setScalar(0.62); e.add(tg); outer.userData.textHolder = tg;
        Promise.all([import(B + '/examples/jsm/loaders/FontLoader.js'), import(B + '/examples/jsm/geometries/TextGeometry.js'), fetch('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/fonts/helvetiker_bold.typeface.json').then(r => r.json())]).then(([FL, TG, js]) => {
          const font = new FL.FontLoader().parse(js); const mk = (d, m, z) => { const geo = new TG.TextGeometry('KOS.', { font, size: 0.78, depth: d, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.025, bevelSegments: 4 }); geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.max.x + bb.min.x) / 2, -bb.max.y, 0); const ms = new T.Mesh(geo, m); ms.position.z = z; tg.add(ms); };
          mk(0.08, redK, 0.06); mk(0.1, chromeK, -0.06); }).catch(() => {}); }
      // crystal
      { const e = hang(1.85, 3); const cr = new T.Group(); cr.position.y = -0.45; e.add(cr);
        const gem = new T.Mesh(new T.OctahedronGeometry(0.34, 0), P({ color: 0xC9A8FF, transmission: 0.9, thickness: 0.6, roughness: 0.05, ior: 1.6, iridescence: 0.6, clearcoat: 1 })); gem.scale.y = 1.4; cr.add(gem);
        const orb = new T.Mesh(new T.TorusGeometry(0.52, 0.018, 10, 64), chromeK); orb.rotation.set(1.25, 0, 0.35); cr.add(orb);
        const bb = new T.Mesh(new T.SphereGeometry(0.07, 16, 12), chromeK); bb.position.set(0.49, 0.06, 0.12); cr.add(bb); }
      g.position.y = -0.4; outer.userData.charms = charms; outer.userData.label = 'Kos.'; outer.userData.motion = 'swing'; }
    return outer; };
  window.__makeCraft = makeCraft;
  // floating objects on a transparent canvas (home page sections). each kind reacts differently on click.
  window.mountKosFloat = async function (cv, opts) {
    opts = opts || {};
    const T = await import(B);
    const { RoomEnvironment } = await import(B + '/examples/jsm/environments/RoomEnvironment.js');
    const { RoundedBoxGeometry } = await import(B + '/examples/jsm/geometries/RoundedBoxGeometry.js');
    const host = cv.parentElement;
    const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(1.5, window.devicePixelRatio)); R.outputColorSpace = T.SRGBColorSpace; R.toneMapping = T.ACESFilmicToneMapping;
    const scene = new T.Scene(); const pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    scene.add(new T.HemisphereLight(0xF3EEFF, 0xF6DCE8, 0.55)); const dl = new T.DirectionalLight(0xFFF0F6, 1.8); dl.position.set(-4, 6, 8); scene.add(dl); const rl = new T.PointLight(0xC6B6F2, 40, 40, 1.6); rl.position.set(6, -3, 6); scene.add(rl);
    const P = o => new T.MeshPhysicalMaterial(o);
    const MAT = { red: P({ color: 0xA9121C, roughness: 0.3, clearcoat: 1 }), chrome: P({ color: 0xffffff, metalness: 1, roughness: 0.05 }), stone: new T.MeshStandardMaterial({ color: 0xEDE2D2, roughness: 0.8 }),
      pink: P({ color: 0xE597B8, roughness: 0.4, sheen: 1, sheenColor: new T.Color(0xffe4f6) }), glass: P({ color: 0xffffff, transmission: 1, thickness: 1, roughness: 0.03, iridescence: 0.6 }), lav: P({ color: 0xB9B7E8, roughness: 0.35, clearcoat: 0.6 }) };
    const G = { oct: new T.OctahedronGeometry(1, 0), sph: new T.SphereGeometry(0.8, 48, 32), box: new RoundedBoxGeometry(1.3, 1.3, 1.3, 3, 0.08), tor: new T.TorusGeometry(0.9, 0.28, 32, 80), ico: new T.IcosahedronGeometry(1, 0) };
    const layout = opts.layout || [['oct','stone',-0.82,0.55,1.1,'spin'],['sph','chrome',-0.55,-0.5,0.9,'bounce'],['tor','red',0.62,0.6,1.0,'flip'],['box','pink',0.85,-0.45,0.8,'tumble'],['ico','glass',0.18,0.78,0.7,'pulse'],['sph','pink',-0.15,-0.82,0.5,'bounce'],['oct','lav',0.35,-0.75,0.6,'spin'],['box','stone',-0.95,-0.05,0.55,'tumble']];
    const cam = new T.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0, 20);
    let W = 1, H = 1, hw = 1, hh = 1;
    const objs = layout.map(([g, m, fx, fy, s, kind, anchor], i) => { let o; if (G[g] && m) o = new T.Mesh(G[g], MAT[m]); else { o = makeCraft(T, RoundedBoxGeometry, g); kind = o.userData.motion || kind; }
      const lbl = o.userData.label; o.traverse(c => { c.castShadow = false; }); o.userData = Object.assign(o.userData, { fx, fy, s, kind, anchor, k: 0, ph: i * 1.3, ox: 0, oy: 0, label: lbl }); o.rotation.set(i, i * 2, 0); scene.add(o); return o; });
    const size = () => { W = host.clientWidth; H = host.clientHeight; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); hh = 20 * Math.tan(T.MathUtils.degToRad(15)); hw = hh * cam.aspect; };
    size(); const ro = new ResizeObserver(size); ro.observe(host);
    const ray = new T.Raycaster(), nd = new T.Vector2(); let mx = 0, my = 0, inside = false, hov = null;
    const pick = e => { const r = cv.getBoundingClientRect(); nd.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(nd, cam); const h = ray.intersectObjects(objs, true)[0]; if (!h) return null; let o = h.object; while (o && objs.indexOf(o) < 0) o = o.parent; return o; };
    const tip = document.createElement('div'); tip.style.cssText = "position:absolute;z-index:5;pointer-events:none;opacity:0;transition:opacity .25s;font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:11.5px;letter-spacing:0.2em;text-transform:uppercase;background:#2B2466;color:#F6F2EC;padding:6px 10px;border-radius:999px;white-space:nowrap;"; host.appendChild(tip);
    const move = e => { const r = cv.getBoundingClientRect(); inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; mx = ((e.clientX - r.left) / r.width * 2 - 1) * hw; my = -((e.clientY - r.top) / r.height * 2 - 1) * hh; hov = inside ? pick(e) : null; document.body.style.cursor = hov ? 'pointer' : ''; const hr = host.getBoundingClientRect(); if (hov && hov.userData.label) { tip.textContent = hov.userData.label; tip.style.left = (e.clientX - hr.left + 16) + 'px'; tip.style.top = (e.clientY - hr.top + 14) + 'px'; tip.style.opacity = 1; } else tip.style.opacity = 0; };
    const click = e => { const o = inside && pick(e); if (o) o.userData.k = 1; };
    window.addEventListener('pointermove', move); window.addEventListener('click', click);
    let vis = true; const io = new IntersectionObserver(([en]) => { vis = en.isIntersecting; }); io.observe(host);
    const t0 = performance.now(); let prev = t0, raf;
    const loop = () => { raf = requestAnimationFrame(loop); if (!vis) { prev = performance.now(); return; }
      const now = performance.now(), dt = Math.min(0.05, (now - prev) / 1000), t = (now - t0) / 1000; prev = now;
      const sy = host.getBoundingClientRect().top / Math.max(1, window.innerHeight);
      objs.forEach((o, i) => { const u = o.userData, k = u.k; u.k *= 0.965; const sc = u.s * Math.min(1.2, Math.max(0.55, hw / 9));
        let x = u.fx * hw * 0.92, y = u.fy * hh * 0.85 + sy * (i % 2 ? 1.2 : -1.2), zz = 0;
        if (u.anchor) { const ae = document.querySelector(u.anchor); if (ae) { const ar = ae.getBoundingClientRect(), hr = host.getBoundingClientRect(); x = ((ar.left + ar.width * u.fx - hr.left) / W * 2 - 1) * hw; y = -((ar.top + ar.height * u.fy - hr.top) / H * 2 - 1) * hh; } }
        if (opts.ring) { const a = i / objs.length * Math.PI * 2 + t * 0.07; x = Math.cos(a) * hw * 0.8; y = Math.sin(a) * hh * 0.66 + Math.sin(t * 0.9 + i) * 0.12; zz = Math.sin(a) * 2.5; }
        u.ox = 0; u.oy = 0;
        x += u.ox; y += u.oy; let s = sc * (o === hov ? 1.1 : 1);
        if (u.kind === 'spin') { o.rotation.y += dt * (0.4 + k * 16); o.rotation.x += dt * 0.15; }
        else if (u.kind === 'bounce') { y += Math.abs(Math.sin((1 - k) * Math.PI * 4)) * 2.2 * k; o.rotation.y += dt * 0.3; }
        else if (u.kind === 'flip') { o.rotation.x = Math.sin(t * 0.5 + i) * 0.4 + k * Math.PI * 4 * (1 - k); o.rotation.y += dt * 0.2; }
        else if (u.kind === 'tumble') { o.rotation.x += dt * (0.2 + k * 9); o.rotation.z += dt * (0.15 + k * 7); x += Math.sin(t * 25) * 0.25 * k; }
        else if (u.kind === 'fan') { (u.fan || []).forEach((p, j) => { p.rotation.z = (j - 2) * (0.12 + k * 0.5 + Math.sin(t * 0.8) * 0.03); }); o.rotation.y = Math.sin(t * 0.4 + i) * 0.5; }
        else if (u.kind === 'pulse') { s *= 1 + Math.sin(t * 16) * 0.3 * k; o.rotation.x += dt * 0.3; o.rotation.y += dt * (0.3 + k * 5); }
        else if (u.kind === 'swing') { o.rotation.z = Math.sin(t * 0.9 + i) * 0.06 + Math.sin(t * 7) * 0.35 * k; o.rotation.y = -0.35 + Math.sin(t * 0.45) * 0.3; o.rotation.x = 0.08; (u.charms || []).forEach((c, j) => { c.rotation.z = Math.sin(t * 1.6 + j * 1.3) * 0.12 + Math.sin(t * 9 + j) * 0.6 * k; c.rotation.x = Math.sin(t * 1.1 + j) * 0.08; }); }
        o.position.set(x, y, zz); o.scale.setScalar(s); });
      R.render(scene, cam); };
    loop();
    return { dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', move); window.removeEventListener('click', click); tip.remove(); R.dispose(); } };
  };

  // ---- mini world for the contact section: hill, pink trees, kash, torii, fireflies, floating crafts
  window.mountKosWorld = async function (cv) {
    const T = await import(B);
    const { RoomEnvironment } = await import(B + '/examples/jsm/environments/RoomEnvironment.js');
    const { RoundedBoxGeometry } = await import(B + '/examples/jsm/geometries/RoundedBoxGeometry.js');
    const host = cv.parentElement;
    const R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); R.setPixelRatio(Math.min(1.5, window.devicePixelRatio)); R.outputColorSpace = T.SRGBColorSpace; R.toneMapping = T.ACESFilmicToneMapping;
    const scene = new T.Scene(); const pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); scene.environmentIntensity = 0.5;
    const hemiW = new T.HemisphereLight(0xC9C2FF, 0x4B6A2E, 0.9); scene.add(hemiW); const dl = new T.DirectionalLight(0xFFD6E8, 1.6); dl.position.set(-6, 8, 6); scene.add(dl);
    const rim = new T.PointLight(0xF2B6CF, 30, 30, 1.5); rim.position.set(4, 4, 2); scene.add(rim);
    let sd = 99; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const grassTex = (() => { const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.fillStyle = '#8DB565'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 40000; i++) { const px = Math.random() * S, py = Math.random() * S, l = 38 + Math.random() * 22, h = 84 + Math.random() * 18; x.fillStyle = 'hsla(' + h + ',' + (30 + Math.random() * 18) + '%,' + l + '%,' + (0.18 + Math.random() * 0.3) + ')'; x.beginPath(); x.arc(px, py, 0.6 + Math.random() * 1.4, 0, 7); x.fill(); }
      for (let i = 0; i < 60; i++) { const px = Math.random() * S, py = Math.random() * S, r = 20 + Math.random() * 60, gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, 'rgba(' + (Math.random() < 0.5 ? '150,190,90' : '60,95,40') + ',0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(px - r, py - r, r * 2, r * 2); }
      const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(26, 18); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; })();
    const hillG = new T.PlaneGeometry(120, 80, 160, 100); hillG.rotateX(-Math.PI / 2); { const p = hillG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i) - 8; p.setY(i, -260.5 + Math.sqrt(Math.max(0, 67600 - x * x - (z + 8) * (z + 8)))); p.setZ(i, z); } hillG.computeVertexNormals(); }
    const hill = new T.Mesh(hillG, new T.MeshStandardMaterial({ color: 0xffffff, map: grassTex, roughness: 1 })); scene.add(hill);
    const onHill = (x, z) => { const dz = z + 8; return -260.5 + Math.sqrt(Math.max(0, 67600 - x * x - dz * dz)); };
    const PX = 2.2, PZ = -4.2, PRX = 2.6, PRZ = 1.25; const prA = a => 1 + 0.13 * Math.sin(3 * a + 1) + 0.08 * Math.sin(5 * a + 2.2) + 0.06 * Math.sin(2 * a + 0.4); const warpG = g => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), f = prA(Math.atan2(y, x)); p.setXY(i, x * f, y * f); } return g; };
    const inPond = (x, z, m = 0.5) => ((x - PX) / (PRX + m)) ** 2 + ((z - PZ) / (PRZ + m)) ** 2 < 1;
    // pink trees
    const trunkM = new T.MeshStandardMaterial({ color: 0x5E4034, roughness: 0.9 }), florG = (() => { const g = new T.SphereGeometry(1, 36, 26), p = g.attributes.position, v = new T.Vector3(), col = [], c = new T.Color(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const b = 0.09 * Math.pow(Math.abs(Math.sin(v.x * 7.3) * Math.sin(v.y * 6.1 + 0.7) * Math.sin(v.z * 7.9 + 1.3)), 0.6); p.setXYZ(i, v.x * (1 + b), v.y * (1 + b), v.z * (1 + b)); const sh = 0.5 + 0.5 * (v.y * 0.5 + 0.5) + b * 0.6; c.setRGB(sh, sh, sh); col.push(c.r, c.g, c.b); } g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g; })(), trees = [];
    const tCols = [0xE597B8, 0xF2E8EA, 0xEDA3BF, 0xF5D7C4, 0x9DBB72, 0xE597B8, 0xFFFFFF];
    [[5.5, -6, 1.15], [9, -9, 1.05], [12.5, -6.5, 1.2], [7, -12.5, 0.9], [14, -12, 1], [3.8, -11, 0.8], [8.6, -1.2, 1.55]].forEach(([x, z, s], ti) => {
      const g = new T.Group(); g.position.set(x, onHill(x, z) - 0.1, z); g.scale.setScalar(s); scene.add(g);
      const tr = new T.Mesh(new T.CylinderGeometry(0.16, 0.3, 2.6, 10), trunkM); tr.position.y = 1.3; g.add(tr); const knob = new T.Mesh(new T.SphereGeometry(0.17, 14, 10), trunkM); knob.position.y = 2.6; g.add(knob);
      { const soil = new T.Mesh(new T.CircleGeometry(0.9, 24), new T.MeshStandardMaterial({ color: 0x6E5A3C, roughness: 1, transparent: true, opacity: 0.55 })); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.04; g.add(soil);
        const NR = 6; for (let r = 0; r < NR; r++) { const a = r / NR * 6.283 + rnd() * 0.5, L = 0.6 + rnd() * 0.45; const rt = new T.Mesh(new T.ConeGeometry(0.13, L, 7), trunkM); rt.position.set(Math.cos(a) * L * 0.42, 0.12, Math.sin(a) * L * 0.42); rt.rotation.set(0, 0, 0); rt.lookAt(Math.cos(a) * 3, -0.6, Math.sin(a) * 3); rt.rotateX(Math.PI / 2); g.add(rt);
          const kn = new T.Mesh(new T.SphereGeometry(0.11, 10, 8), trunkM); kn.position.set(Math.cos(a) * 0.2, 0.16, Math.sin(a) * 0.2); g.add(kn); } }
      const lobes = []; const NL = 6 + Math.floor(rnd() * 3); for (let l = 0; l < NL; l++) { const ang = l / NL * 6.283 + rnd() * 0.6, rr = l === 0 ? 0 : 0.7 + rnd() * 0.6; lobes.push({ c: new T.Vector3(Math.cos(ang) * rr, l === 0 ? 3.75 : 3.0 + rnd() * 1.0, Math.sin(ang) * rr), r: l === 0 ? 0.95 : 0.55 + rnd() * 0.35 }); }
      lobes.slice(1).forEach(lb => { const from = new T.Vector3(0, 2.55, 0), dir = lb.c.clone().sub(from), len = dir.length() * 0.92; const br = new T.Mesh(new T.CylinderGeometry(0.05, 0.13, len, 9), trunkM); br.position.copy(from).addScaledVector(dir, 0.5); br.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize()); g.add(br); });
      const PER = 46, N = PER * lobes.length, im = new T.InstancedMesh(florG, new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.7, sheen: 0.8, sheenColor: new T.Color(0xFFF0F6) }), N), M4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3(), c = new T.Color(), base = new T.Color(tCols[ti % tCols.length]); let ii = 0;
      lobes.forEach(lb => { for (let i = 0; i < PER; i++) { const u = rnd() * 2 - 1, th = rnd() * 6.283, sr = Math.sqrt(1 - u * u), depth = Math.pow(rnd(), 0.35); v.set(Math.cos(th) * sr, u * 0.82, Math.sin(th) * sr).multiplyScalar(lb.r * depth).add(lb.c);
          const ss = 0.2 + rnd() * 0.12; M4.compose(v, q.setFromEuler(e.set(rnd() * 6, rnd() * 6, rnd() * 6)), sc.set(ss, ss * 0.9, ss)); im.setMatrixAt(ii, M4);
          const leaf = rnd() < 0.12, shade = (u * 0.5 + 0.5) * 0.16 - 0.1 + (depth - 1) * 0.18; c.copy(leaf ? new T.Color(0x5B7A36) : base).offsetHSL((rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.08, shade + (rnd() - 0.5) * 0.08); im.setColorAt(ii, c); ii++; } });
      g.add(im); g.userData = { kind: 'tree', shake: 0, label: 'Shake the tree' }; trees.push(g); });
    // kash plumes
    const kPlumeG = (() => { const pts = []; for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push(new T.Vector2(0.11 * Math.sin(Math.pow(t, 0.7) * Math.PI) * (1 - t * 0.35), t)); } const g = new T.LatheGeometry(pts, 8), p = g.attributes.position, v = new T.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + 0.35 * Math.sin(v.y * 40 + Math.atan2(v.z, v.x) * 5) * Math.sin(v.y * 23); v.x *= n; v.z *= n; v.x += v.y * v.y * 0.28; p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; })();
    const KN = 620, plume = new T.InstancedMesh(kPlumeG, new T.MeshPhysicalMaterial({ color: 0xFBF7F2, roughness: 0.95, sheen: 1, sheenColor: new T.Color(0xffffff), sheenRoughness: 0.3, emissive: 0xF3EAF0, emissiveIntensity: 0.18, transparent: true, opacity: 0.92 }), KN), stem = new T.InstancedMesh(new T.CylinderGeometry(0.008, 0.02, 1, 5), new T.MeshStandardMaterial({ color: 0xB7A979, roughness: 0.8 }), KN), kd = [];
    { const CL = [[-12, -15], [-7.5, -16.5], [-3, -15.5], [1.5, -16.8], [6, -17.5], [10.5, -16.5], [15, -15], [-16, -13.5], [18, -13]]; for (let i = 0; i < 360; i++) { const x = -24 + rnd() * 48, z = -19.5 - rnd() * 3.5; if (Math.sin(x * 0.55) + 0.6 * Math.sin(x * 1.3 + 1) < -0.9) continue; kd.push({ x, z, y: onHill(x, z), h: 1.1 + rnd() * 0.8 + Math.sin(x * 0.4) * 0.25, ph: rnd() * 6, yaw: rnd() * 6.283, ps: 0.85 + rnd() * 0.45 }); }
      for (let i = 0; i < 260; i++) { const c = CL[i % CL.length], an = rnd() * 6.283, r = rnd() * 0.75, x = c[0] + Math.cos(an) * r * 1.6, z = c[1] + Math.sin(an) * r * 0.6; kd.push({ x, z, y: onHill(x, z), h: 1.3 + rnd() * 0.9, ph: rnd() * 6, yaw: rnd() * 6.283, ps: 0.75 + rnd() * 0.5 }); } }
    { const bG = (() => { const g = new T.PlaneGeometry(0.05, 1, 1, 6); g.translate(0, 0.5, 0); const p = g.attributes.position, col = []; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (1 - y * 0.9)); p.setZ(i, y * y * 0.4); const s = 0.55 + y * 0.5; col.push(s, s, s); } g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g; })();
      const BN = 9000, bl = new T.InstancedMesh(bG, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: T.DoubleSide }), BN), m4 = new T.Matrix4(), qq = new T.Quaternion(), ee = new T.Euler(), vv = new T.Vector3(), s3 = new T.Vector3(), cc = new T.Color(), GR = [0x8E9A55, 0x7E9C58, 0x9BAE63, 0x6F8E4F]; let bi = 0;
      kd.forEach(s => { for (let j = 0; j < 9 && bi < BN; j++) { const a = rnd() * 6.283, r = rnd() * 0.45; const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r; vv.set(x, onHill(x, z), z); s3.set(1, 0.35 + rnd() * 0.55, 1); m4.compose(vv, qq.setFromEuler(ee.set(0, rnd() * 6.283, 0)), s3); bl.setMatrixAt(bi, m4); cc.set(GR[bi % 4]); bl.setColorAt(bi, cc); bi++; } });
      while (bi < BN) { const x = -24 + rnd() * 48, z = -9 - Math.pow(rnd(), 0.6) * 14; if (inPond(x, z, 0.2)) continue; vv.set(x, onHill(x, z), z); s3.set(1, 0.15 + rnd() * 0.25, 1); m4.compose(vv, qq.setFromEuler(ee.set(0, rnd() * 6.283, 0)), s3); bl.setMatrixAt(bi, m4); cc.set(GR[bi % 4]); bl.setColorAt(bi, cc); bi++; }
      bl.frustumCulled = false; scene.add(bl); }
    stem.frustumCulled = plume.frustumCulled = false; plume.castShadow = true; scene.add(stem, plume);
    { const PN = 900, pg = new T.CircleGeometry(0.05, 6); pg.rotateX(-Math.PI / 2); pg.scale(1, 1, 0.6); const pet = new T.InstancedMesh(pg, new T.MeshStandardMaterial({ roughness: 0.8, side: T.DoubleSide }), PN), m4 = new T.Matrix4(), qq = new T.Quaternion(), ee = new T.Euler(), vv = new T.Vector3(), s3 = new T.Vector3(1, 1, 1), cc = new T.Color(); let pi = 0;
      for (let n = 0; n < PN * 2 && pi < PN; n++) { const tx = [5.5, 9, 12.5, 7, 14, 3.8][n % 6], tz = [-6, -9, -6.5, -12.5, -12, -11][n % 6], a = rnd() * 6.283, r = Math.pow(rnd(), 0.6) * 2.6, x = tx + Math.cos(a) * r, z = tz + Math.sin(a) * r; if (inPond(x, z, 0.1)) continue; vv.set(x, onHill(x, z) + 0.012, z); m4.compose(vv, qq.setFromEuler(ee.set(0, rnd() * 6, 0)), s3.setScalar(0.7 + rnd() * 0.7)); pet.setMatrixAt(pi, m4); cc.set([0xF2B3CC, 0xF7D6E2, 0xE58FB3, 0xFBEAF0][pi % 4]); pet.setColorAt(pi, cc); pi++; }
      pet.count = pi; scene.add(pet);
      const stG = new T.CylinderGeometry(0.32, 0.36, 0.06, 18), stM = new T.MeshStandardMaterial({ color: 0xCFC3B2, roughness: 0.9 }); [[-1.5, -0.8], [-0.6, -1.6], [0.2, -2.3], [0.9, -2.9]].forEach(([x, z], i) => { const s = new T.Mesh(stG, stM); s.scale.set(1 + (i % 2) * 0.15, 1, 0.8); s.rotation.y = i; s.position.set(x, onHill(x, z) + 0.02, z); s.receiveShadow = true; scene.add(s); }); }
    { const marbleM = new T.MeshPhysicalMaterial({ color: 0xF1ECE6, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 }), plM = new T.MeshStandardMaterial({ color: 0xE3D6C4, roughness: 0.85 }), x = 7.2, z = -2.6, y = onHill(x, z);
      const pl = new T.Mesh(new RoundedBoxGeometry(1.1, 1.0, 1.1, 3, 0.05), plM); pl.position.set(x, y + 0.5, z); pl.castShadow = pl.receiveShadow = true; scene.add(pl);
      const kn = new T.Mesh(new T.TorusKnotGeometry(0.42, 0.13, 220, 32, 2, 3), marbleM); kn.position.set(x, y + 1.62, z); kn.castShadow = true; scene.add(kn); scene.userData.statue = kn;
      const orb = new T.Mesh(new T.SphereGeometry(0.16, 32, 20), new T.MeshPhysicalMaterial({ color: 0xC41E2A, roughness: 0.2, clearcoat: 1 })); orb.position.set(x + 0.62, y + 1.12, z + 0.32); scene.add(orb); }
    { const GN = 900, gp = new Float32Array(GN * 3), gph = new Float32Array(GN); for (let i = 0; i < GN; i++) { const low = i < 380; gp[i * 3] = (rnd() - 0.5) * 34; gp[i * 3 + 1] = low ? 0.25 + rnd() * 2.2 : 4 + rnd() * 9; gp[i * 3 + 2] = low ? -0.5 - rnd() * 12 : -6 - rnd() * 20; gph[i] = rnd() * 6.283; }
      const gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3)); gg.setAttribute('ph', new T.BufferAttribute(gph, 1));
      const gm = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { time: { value: 0 } },
        vertexShader: 'attribute float ph; uniform float time; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); float tw = pow(max(0., sin(time * 1.9 + ph * 3.)), 4.); vA = tw; gl_PointSize = (8. + 34. * tw) * (12. / -mv.z); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'varying float vA; void main(){ vec2 p = gl_PointCoord - .5; float d = length(p); float core = smoothstep(.18, 0., d); float star = max(smoothstep(.05, 0., abs(p.x)) * smoothstep(.5, 0., abs(p.y)), smoothstep(.05, 0., abs(p.y)) * smoothstep(.5, 0., abs(p.x))); float a = (core + star * .9) * (.25 + vA); gl_FragColor = vec4(1., .97, .92, a); }' });
      const gl = new T.Points(gg, gm); gl.frustumCulled = false; scene.add(gl); scene.userData.glitter = gm; }
    // torii
    const toriiM = new T.MeshPhysicalMaterial({ color: 0xC41E2A, roughness: 0.3, clearcoat: 1, emissive: 0xC41E2A, emissiveIntensity: 0.05 }), torii = new T.Group();
    [-1.1, 1.1].forEach(x => { const p = new T.Mesh(new T.CylinderGeometry(0.13, 0.15, 3, 16), toriiM); p.position.set(x, 1.5, 0); torii.add(p); });
    const top = new T.Mesh(new RoundedBoxGeometry(3.4, 0.24, 0.32, 2, 0.06), toriiM); top.position.y = 3.05; torii.add(top); const mid = new T.Mesh(new T.BoxGeometry(2.7, 0.14, 0.2), toriiM); mid.position.y = 2.55; torii.add(mid);
    torii.position.set(1.5, onHill(1.5, -9) - 0.1, -9); torii.visible = false; torii.userData = { kind: 'gate', label: 'Light the gate', glow: 0 };
    // shrubs + flower clusters
    const shrubM = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.7, sheen: 0.7, sheenColor: new T.Color(0xEAFFD0) }), SB = 26, shrub = new T.InstancedMesh(florG, shrubM, SB * 3), sm4 = new T.Matrix4(), sq = new T.Quaternion(), sv = new T.Vector3(), ss3 = new T.Vector3(), scl = new T.Color(); let sk = 0;
    for (let b = 0; b < SB; b++) { const x = (rnd() - 0.5) * 32, z = -1.5 - rnd() * 12; if ((x < 1 && z > -7 && rnd() < 0.7) || inPond(x, z, 0.9)) { b--; continue; } const y = onHill(x, z), base = 0.35 + rnd() * 0.45;
      for (let p = 0; p < 3; p++) { sv.set(x + (p - 1) * base * 0.8, y + base * (0.55 + (p === 1 ? 0.25 : 0)), z + (rnd() - 0.5) * 0.4); const r = base * (p === 1 ? 1 : 0.78); ss3.set(r, r * 0.85, r); sm4.compose(sv, sq, ss3); shrub.setMatrixAt(sk, sm4); scl.set([0x7E9C58, 0x6F8E4F, 0x8AA764, 0x6F8E4F][(b + p) % 4]); shrub.setColorAt(sk, scl); sk++; } }
    shrub.count = sk; scene.add(shrub);
    const FL = 26, flower = new T.InstancedMesh(new T.SphereGeometry(0.11, 12, 10), new T.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 1, emissive: 0xffffff, emissiveIntensity: 0.12 }), FL);
    for (let n = 0; n < FL; n++) { let x = (rnd() - 0.5) * 32, z = -1 - rnd() * 12; while (inPond(x, z)) { x = (rnd() - 0.5) * 32; z = -1 - rnd() * 12; } sv.set(x, onHill(x, z) + 0.12, z); const r = 0.7 + rnd() * 0.7; ss3.set(r, r, r); sm4.compose(sv, sq, ss3); flower.setMatrixAt(n, sm4); scl.set([0xF29BC0, 0xFFFFFF, 0xF6D58A, 0xC6B6F2, 0xE8364A][n % 5]); flower.setColorAt(n, scl); }
    scene.add(flower);
    // fireflies
    const FN = 24, fPos = new Float32Array(FN * 3), fCol = new Float32Array(FN * 3), fc = new T.Color(); for (let i = 0; i < FN; i++) { fPos[i * 3] = (rnd() - 0.5) * 30; fPos[i * 3 + 1] = 0.3 + rnd() * 5; fPos[i * 3 + 2] = -1 - rnd() * 13; fc.set([0xFFD84A, 0xFFE57A, 0xFFC93A, 0xFFF1A6][i % 4]); fCol[i * 3] = fc.r; fCol[i * 3 + 1] = fc.g; fCol[i * 3 + 2] = fc.b; }
    const gcv = document.createElement('canvas'); gcv.width = gcv.height = 64; const gx = gcv.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64); const glowTex = new T.CanvasTexture(gcv);
    const fGeo = new T.BufferGeometry(); fGeo.setAttribute('position', new T.BufferAttribute(fPos, 3)); fGeo.setAttribute('color', new T.BufferAttribute(fCol, 3)); const fMat = new T.PointsMaterial({ vertexColors: true, map: glowTex, alphaTest: 0.01, size: 0.55, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending }); scene.add(new T.Points(fGeo, fMat));
    // POND_AND_EXTRAS
    { const { Reflector } = await import(B + '/examples/jsm/objects/Reflector.js'); const py = onHill(PX, PZ) + 0.02;
      const water = new Reflector(warpG(new T.CircleGeometry(1, 128)), { textureWidth: 1024, textureHeight: 1024, color: 0x8FA3B4, clipBias: 0.003 }); water.rotation.x = -Math.PI / 2; water.scale.set(PRX, PRZ, 1); water.position.set(PX, py, PZ); scene.add(water);
      const edgeG = warpG(new T.RingGeometry(0.82, 1.16, 160, 1)); { const p = edgeG.attributes.position, col = []; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)) / prA(Math.atan2(p.getY(i), p.getX(i))); const a = r < 1 ? Math.min(1, (r - 0.82) / 0.18) * 0.85 : Math.max(0, 1 - (r - 1) / 0.16) * 0.85; col.push(0.3, 0.27, 0.22, a * 0.7); } edgeG.setAttribute('color', new T.Float32BufferAttribute(col, 4)); }
      const edge = new T.Mesh(edgeG, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false })); edge.rotation.x = -Math.PI / 2; edge.scale.set(PRX, PRZ, 1); edge.position.set(PX, py + 0.008, PZ); scene.add(edge);
      { const reedG = new T.ConeGeometry(0.018, 1, 4); reedG.translate(0, 0.5, 0); const reedM = new T.MeshStandardMaterial({ color: 0x4F6B33, roughness: 0.8 }), RN = 160, reeds = new T.InstancedMesh(reedG, reedM, RN), m4 = new T.Matrix4(), qq = new T.Quaternion(), ee = new T.Euler(), vv = new T.Vector3(), s3 = new T.Vector3(), cc = new T.Color();
        for (let i = 0; i < RN; i++) { const cl = (i % 8), an = cl * 0.785 + 0.4 + (rnd() - 0.5) * 0.22, rr = 1.02 + rnd() * 0.1, x = PX + Math.cos(an) * PRX * rr, z = PZ + Math.sin(an) * PRZ * rr; vv.set(x, onHill(x, z), z); s3.set(1, 0.35 + rnd() * 0.55, 1); m4.compose(vv, qq.setFromEuler(ee.set((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5)), s3); reeds.setMatrixAt(i, m4); cc.set([0x4F6B33, 0x6B8A45, 0x7E9C58][i % 3]); reeds.setColorAt(i, cc); } scene.add(reeds); }
      const tint = new T.Mesh(warpG(new T.CircleGeometry(1, 128)), new T.MeshPhysicalMaterial({ color: 0x3A5A78, transparent: true, opacity: 0.42, roughness: 0.02, clearcoat: 1 })); tint.rotation.x = -Math.PI / 2; tint.scale.set(PRX, PRZ, 1); tint.position.set(PX, py + 0.004, PZ); scene.add(tint);
      const stoneM = new T.MeshStandardMaterial({ color: 0x7D786E, roughness: 0.9 }), stG = new T.DodecahedronGeometry(1, 1);
      for (let i = 0; i < 56; i++) { const a = i / 56 * 6.283 + (rnd() - 0.5) * 0.12, f = prA(a), off = 1.0 + rnd() * 0.12, sx = PX + Math.cos(a) * PRX * f * off, sz = PZ + Math.sin(a) * PRZ * f * off, st = new T.Mesh(stG, stoneM), r = (i % 5 === 0 ? 0.16 : 0.06) + rnd() * 0.08; st.scale.set(r * 1.4, r * 0.55, r * (0.9 + rnd() * 0.4)); st.rotation.set(rnd(), rnd() * 6, rnd()); st.position.set(sx, onHill(sx, sz) + r * 0.15, sz); st.material = stoneM.clone(); st.material.color.offsetHSL(0, 0, (rnd() - 0.5) * 0.12); scene.add(st); }
      const padTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const gr = x.createRadialGradient(128, 128, 4, 128, 128, 128); gr.addColorStop(0, '#6FA34A'); gr.addColorStop(1, '#2F6A2E'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(190,220,150,0.35)'; x.lineWidth = 2; for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.cos(a) * 125, 128 + Math.sin(a) * 125); x.stroke(); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
      const padM = new T.MeshPhysicalMaterial({ map: padTex, roughness: 0.35, clearcoat: 0.6, side: T.DoubleSide }), padG = new T.CircleGeometry(0.3, 40, 0.2, 6.0);
      const petal = (() => { const g = new T.PlaneGeometry(0.2, 0.42, 8, 16); g.translate(0, 0.21, 0); const p = g.attributes.position, col = []; const base = new T.Color(0xFFF8F2), mid = new T.Color(0xFBD3E0), tip = new T.Color(0xE04A86), c = new T.Color();
        for (let i = 0; i < p.count; i++) { let X = p.getX(i), Y = p.getY(i); const u = Y / 0.42, w = Math.sin(Math.min(1, u * 1.05) * Math.PI) * (1 - u * 0.25) + (u > 0.85 ? -0.4 * (u - 0.85) * 6 : 0); X *= Math.max(0.02, w) * 1.1; const cup = (X / 0.11) * (X / 0.11); p.setXYZ(i, X, Y, cup * 0.045 - u * u * 0.06 + Math.sin(u * Math.PI) * 0.015);
          c.copy(base).lerp(mid, Math.min(1, u * 1.4)).lerp(tip, Math.pow(Math.max(0, u - 0.55) / 0.45, 1.3) * 0.85); const vein = 0.94 + 0.06 * Math.cos(X * 180); c.multiplyScalar(vein); col.push(c.r, c.g, c.b); }
        g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g; })();
      const petalM = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, sheen: 1, sheenColor: new T.Color(0xFFEFF5), sheenRoughness: 0.4, transmission: 0.25, thickness: 0.04, side: T.DoubleSide, emissive: 0xF27BAA, emissiveIntensity: 0.06 });
      const coreM = new T.MeshPhysicalMaterial({ color: 0xF2C94C, roughness: 0.45, clearcoat: 0.4, emissive: 0x7A5200, emissiveIntensity: 0.25 }), stamenM = new T.MeshStandardMaterial({ color: 0xFFE08A, emissive: 0xC98A10, emissiveIntensity: 0.35 });
      const stamenG = new T.CylinderGeometry(0.004, 0.004, 0.06, 4); stamenG.translate(0, 0.03, 0);
      scene.userData.lotus = [];
[[-0.9, 0.3, 1], [0.7, -0.45, 0], [1.6, 0.5, 1], [-1.9, -0.2, 0], [0.1, 0.85, 0], [-0.4, -0.75, 1], [2.2, -0.25, 0]].forEach(([dx, dz, lotus], i) => {
        const x = PX + dx, z = PZ + dz, s = 0.8 + (i % 3) * 0.25; const pad = new T.Mesh(padG, padM); pad.rotation.set(-Math.PI / 2, 0, i * 1.3); pad.scale.setScalar(s); pad.position.set(x, py + 0.012, z); scene.add(pad);
        if (lotus) { const fl = new T.Group(); fl.position.set(x + 0.04, py + 0.02, z); fl.rotation.y = i;
          [[10, 0.95, 1.25, 0], [9, 0.9, 0.85, 0.3], [8, 0.78, 0.5, 0.15], [6, 0.6, 0.22, 0.5]].forEach(([n, sc, open, off]) => { for (let p = 0; p < n; p++) { const piv = new T.Group(); piv.rotation.y = p / n * 6.283 + off; const m = new T.Mesh(petal, petalM); m.rotation.x = -(Math.PI / 2 - open); m.scale.setScalar(sc); m.position.z = 0.02; piv.add(m); fl.add(piv); } });
          const core = new T.Mesh(new T.CylinderGeometry(0.06, 0.04, 0.05, 20), coreM); core.position.y = 0.05; fl.add(core);
          for (let s = 0; s < 22; s++) { const st = new T.Mesh(stamenG, stamenM), a = s / 22 * 6.283; st.position.set(Math.cos(a) * 0.07, 0.05, Math.sin(a) * 0.07); st.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); fl.add(st); }
          const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xFFC9DD, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.setScalar(0.9); gl.position.y = 0.12; fl.add(gl);
          fl.scale.setScalar(0.9 + (i % 2) * 0.2); scene.add(fl); scene.userData.lotus.push({ fl, gl, ph: i * 1.9, y0: fl.position.y }); } }); }
    { const bulbG = new T.SphereGeometry(0.032, 12, 10), bulbM = new T.MeshStandardMaterial({ color: 0xFFE9A8, emissive: 0xFFC24A, emissiveIntensity: 2.2 }), wireM = new T.LineBasicMaterial({ color: 0x3A2E24, transparent: true, opacity: 0.6 }); scene.userData.bulbs = [];
      trees.forEach((tr, ti) => { const pts = []; for (let i = 0; i <= 160; i++) { const u = i / 160, y = 0.35 + u * 2.15, a = u * 6.283 * 3.5 + ti, r = 0.3 - 0.14 * y / 2.6 + 0.022; pts.push(new T.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
        const cur = new T.CatmullRomCurve3(pts); const wire = new T.Mesh(new T.TubeGeometry(cur, 600, 0.009, 5), new T.MeshStandardMaterial({ color: 0x2E2620, roughness: 0.6 })); tr.add(wire);
        for (let b = 0; b < 22; b++) { const p = cur.getPointAt((b + 0.5) / 22), m = new T.Mesh(bulbG, new T.MeshPhysicalMaterial({ color: 0xF4F1EA, roughness: 0.25, transmission: 0.2, thickness: 0.02, emissive: 0xFFC24A, emissiveIntensity: 0 })); m.position.copy(p).multiply(new T.Vector3(1.12, 1, 1.12)); m.position.y -= 0.012; tr.add(m); const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xFFC85A, transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.setScalar(0.32); gl.position.copy(m.position); tr.add(gl); scene.userData.bulbs.push({ m, gl, ph: b * 0.7 + ti }); }
        const pl = new T.PointLight(0xFFC060, 2.2, 6, 1.8); pl.position.set(0, 1.9, 0); tr.add(pl); scene.userData.bulbs.push({ pl }); }); }
    { const py = onHill(PX, PZ); scene.userData.bank = []; const shellM = new T.MeshStandardMaterial({ color: 0xB0744A, roughness: 0.8 }), flameG = new T.SphereGeometry(0.035, 10, 8); flameG.scale(1, 1.7, 1);
      for (let i = 0; i < 22; i++) { const an = i / 22 * 6.283 + (i % 2) * 0.08, x = PX + Math.cos(an) * (PRX + 0.18), z = PZ + Math.sin(an) * (PRZ + 0.14), y = onHill(x, z);
        const diya = new T.Mesh(new T.CylinderGeometry(0.07, 0.045, 0.045, 14), shellM); diya.position.set(x, y + 0.03, z); scene.add(diya);
        const fm = new T.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0 }), fl = new T.Mesh(flameG, fm); fl.position.set(x, y + 0.1, z); scene.add(fl);
        const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xFFB858, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.setScalar(0.45); gl.position.copy(fl.position); scene.add(gl);
        scene.userData.bank.push({ fm, gl, fl, ph: i * 1.7 }); }
      for (let i = 0; i < 5; i++) { const an = i * 1.37, x = PX + Math.cos(an) * PRX * 0.55, z = PZ + Math.sin(an) * PRZ * 0.5; const diya = new T.Mesh(new T.CylinderGeometry(0.06, 0.04, 0.04, 14), shellM); diya.position.set(x, py + 0.04, z); scene.add(diya); const fm = new T.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0 }), fl = new T.Mesh(flameG, fm); fl.position.set(x, py + 0.1, z); scene.add(fl); const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xFFB858, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.setScalar(0.5); gl.position.copy(fl.position); scene.add(gl); scene.userData.bank.push({ fm, gl, fl, ph: i * 2.3, float: { d: diya, x, z, y: py + 0.04 } }); }
      const pl = new T.PointLight(0xFFB060, 0, 7, 1.6); pl.position.set(PX, py + 0.5, PZ); scene.add(pl); scene.userData.bankLight = pl; }
    { scene.userData.bflies = []; const wTex = (h1, h2) => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const gr = x.createRadialGradient(0, 128, 6, 0, 128, 250); gr.addColorStop(0, h1); gr.addColorStop(0.8, h2); gr.addColorStop(1, '#2A1A22'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(40,20,30,0.6)'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = -1.1 + i * 0.44; x.beginPath(); x.moveTo(2, 128); x.lineTo(2 + Math.cos(a) * 250, 128 + Math.sin(a) * 250); x.stroke(); } x.fillStyle = '#FFF6EE'; for (let i = 0; i < 9; i++) { const a = -1 + i * 0.25; x.beginPath(); x.arc(2 + Math.cos(a) * 232, 128 + Math.sin(a) * 232, 5, 0, 7); x.fill(); } const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
      const fw = new T.Shape(); fw.moveTo(0, 0); fw.bezierCurveTo(0.1, 0.38, 0.55, 0.7, 0.95, 0.62); fw.bezierCurveTo(1.08, 0.42, 0.9, 0.1, 0.6, 0.02); fw.bezierCurveTo(0.38, -0.03, 0.15, -0.02, 0, 0);
      const hw = new T.Shape(); hw.moveTo(0, 0); hw.bezierCurveTo(0.22, -0.02, 0.66, -0.06, 0.76, -0.36); hw.bezierCurveTo(0.82, -0.62, 0.5, -0.8, 0.3, -0.68); hw.bezierCurveTo(0.12, -0.5, 0.02, -0.2, 0, 0);
      const uvFix = g => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), 0.5 + p.getY(i) * 0.5); return g; }; const FG = uvFix(new T.ShapeGeometry(fw, 20)), HG = uvFix(new T.ShapeGeometry(hw, 20));
      [['#FBE3EE', '#E79BC0'], ['#E6DCFF', '#9C86F0']].forEach(([a, b], i) => { const g = new T.Group(), m = new T.MeshPhysicalMaterial({ map: wTex(a, b), roughness: 0.45, sheen: 0.6, sheenColor: new T.Color(0xffffff), iridescence: i ? 0.8 : 0.2, side: T.DoubleSide });
        const body = new T.Mesh(new T.CapsuleGeometry(0.03, 0.3, 6, 10), new T.MeshStandardMaterial({ color: 0x2A1E26 })); body.rotation.x = Math.PI / 2; g.add(body);
        const mk = sd => { const w = new T.Group(); [[FG, 0.04], [HG, -0.01]].forEach(([gg, zz]) => { const mm = new T.Mesh(gg, m); mm.rotation.x = -Math.PI / 2; mm.position.z = zz; mm.scale.setScalar(0.32); w.add(mm); }); w.scale.x = sd; g.add(w); return w; };
        const L = mk(1), R = mk(-1); scene.add(g); scene.userData.bflies.push({ g, L, R, c: new T.Vector3(i ? 6.5 : -1.5, 0, i ? -4 : -5.5), ph: i * 2.4 }); }); }

    const dragons = [];
    const wingTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'); x.clearRect(0, 0, 512, 128);
      const gr = x.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, 'rgba(120,90,40,0.55)'); gr.addColorStop(0.15, 'rgba(230,240,235,0.18)'); gr.addColorStop(1, 'rgba(230,245,240,0.12)'); x.fillStyle = gr; x.fillRect(0, 0, 512, 128);
      x.strokeStyle = 'rgba(40,40,40,0.55)'; x.lineWidth = 2; [24, 44, 64, 84, 104].forEach(y => { x.beginPath(); x.moveTo(0, 64); x.quadraticCurveTo(200, y, 512, y * 0.9 + 6); x.stroke(); });
      x.lineWidth = 0.8; x.strokeStyle = 'rgba(40,40,40,0.35)'; for (let i = 0; i < 90; i++) { const X = 30 + i * 5.3; x.beginPath(); x.moveTo(X, 14 + (i % 3) * 3); x.lineTo(X + 4, 114 - (i % 4) * 3); x.stroke(); }
      x.fillStyle = 'rgba(60,40,30,0.85)'; x.fillRect(440, 22, 26, 12);
      const t2 = new T.CanvasTexture(c); t2.colorSpace = T.SRGBColorSpace; return t2; })();
    const wingM = new T.MeshPhysicalMaterial({ map: wingTex, transparent: true, roughness: 0.08, metalness: 0, iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [250, 650], side: T.DoubleSide, depthWrite: false, alphaTest: 0.02 });
    const wingG = (() => { const sh = new T.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.12, 0.08, 0.6, 0.11, 0.82, 0.035); sh.bezierCurveTo(0.86, 0, 0.82, -0.04, 0.72, -0.05); sh.bezierCurveTo(0.42, -0.07, 0.14, -0.05, 0, 0); const g = new T.ShapeGeometry(sh, 24); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.86, 0.5 + p.getY(i) / 0.24); return g; })();
    const segG = new T.SphereGeometry(1, 14, 10), eyeG = new T.SphereGeometry(1, 20, 14);
    const hues = [[0x1F6F8B, 0x6FD3C8], [0x8B2F3A, 0xE07A5F], [0x2E4A8B, 0x7FA7E8]];
    for (let d = 0; d < 6; d++) { const g = new T.Group(), [dk, lt] = hues[d % 3];
      const bodyM = new T.MeshPhysicalMaterial({ color: dk, roughness: 0.25, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.6, iridescenceIOR: 1.6 }), bandM = new T.MeshPhysicalMaterial({ color: lt, roughness: 0.3, metalness: 0.2, clearcoat: 1 });
      for (let sgi = 0; sgi < 10; sgi++) { const m = new T.Mesh(segG, sgi % 2 ? bandM : bodyM), r = 0.026 - sgi * 0.0012; m.scale.set(r, r, 0.034); m.position.set(-0.07 - sgi * 0.052, 0, 0); m.rotation.y = Math.PI / 2; g.add(m); }
      const thorax = new T.Mesh(segG, bodyM); thorax.scale.set(0.06, 0.045, 0.045); thorax.position.x = 0.0; g.add(thorax);
      const head = new T.Mesh(segG, bodyM); head.scale.set(0.03, 0.035, 0.04); head.position.x = 0.07; g.add(head);
      const eyeM = new T.MeshPhysicalMaterial({ color: 0x3A2A1E, roughness: 0.15, clearcoat: 1, iridescence: 0.9 });
      [1, -1].forEach(sd => { const ey = new T.Mesh(eyeG, eyeM); ey.scale.setScalar(0.03); ey.position.set(0.085, 0.012, 0.028 * sd); g.add(ey); });
      const wings = []; [[0.02, 1, 1], [0.02, -1, 1], [-0.025, 1, 0], [-0.025, -1, 0]].forEach(([x, sd, fore]) => { const pv = new T.Group(); pv.position.set(x, 0.035, 0.012 * sd); const w = new T.Mesh(wingG, wingM); w.rotation.x = -Math.PI / 2; w.rotation.z = sd * Math.PI / 2 + (fore ? 0.18 : -0.22) * sd; w.scale.set(fore ? 0.5 : 0.48, fore ? 0.5 : 0.62, 1); pv.add(w); g.add(pv); wings.push({ pv, sd }); });
      g.scale.setScalar(0.55 + rnd() * 0.2); scene.add(g);
      dragons.push({ g, wings, cx: -9 + rnd() * 22, cy: 0.9 + rnd() * 2.2, cz: -3 - rnd() * 8, rx: 2 + rnd() * 3, ry: 0.3 + rnd() * 0.4, sp: 0.25 + rnd() * 0.3, ph: rnd() * 6, dart: 0 }); }
    const dragPos = d => new T.Vector3(d.cx + Math.sin(d.tt) * d.rx, d.cy + Math.sin(d.tt * 2.3) * d.ry, d.cz + Math.cos(d.tt * 0.8) * d.rx * 0.5);
    { const U = scene.userData, woodM = new T.MeshStandardMaterial({ color: 0x8A5E3C, roughness: 0.75 }), woodD = new T.MeshStandardMaterial({ color: 0x5E3E28, roughness: 0.8 }), ropeM = new T.MeshStandardMaterial({ color: 0xD9C7A3, roughness: 0.9 }), brassM = new T.MeshPhysicalMaterial({ color: 0xD4A853, metalness: 1, roughness: 0.22, clearcoat: 0.5 });
      // swing
      { const ax = 7.4, az = -0.9, gy = onHill(ax, az), top = gy + 3.1; const sw = new T.Group(); sw.position.set(ax, top, az); scene.add(sw);
        const br = new T.Mesh(new T.CylinderGeometry(0.06, 0.09, 1.6, 10), woodD); br.rotation.z = Math.PI / 2 - 0.12; br.position.set(ax + 0.3, top + 0.02, az); scene.add(br);
        [-0.3, 0.3].forEach(dx => { const r = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 2.45, 6), ropeM); r.position.set(dx, -1.22, 0); sw.add(r); });
        const seat = new T.Mesh(new RoundedBoxGeometry(0.78, 0.06, 0.3, 2, 0.02), woodM); seat.position.y = -2.46; seat.castShadow = true; sw.add(seat); U.swing = sw; }
      // bench
      { const bx = 4.6, bz = -1.9, gy = onHill(bx, bz), b = new T.Group(); b.position.set(bx, gy, bz); b.rotation.y = -0.55; scene.add(b); U.benchProc = b;
        for (let i = 0; i < 4; i++) { const sl = new T.Mesh(new RoundedBoxGeometry(1.4, 0.04, 0.09, 2, 0.015), woodM); sl.position.set(0, 0.42, -0.15 + i * 0.1); sl.castShadow = true; b.add(sl); }
        for (let i = 0; i < 3; i++) { const sl = new T.Mesh(new RoundedBoxGeometry(1.4, 0.08, 0.035, 2, 0.012), woodM); sl.position.set(0, 0.6 + i * 0.12, -0.24); sl.rotation.x = -0.18; b.add(sl); }
        [[-0.6, -0.15], [0.6, -0.15], [-0.6, 0.15], [0.6, 0.15]].forEach(([x, z]) => { const l = new T.Mesh(new T.BoxGeometry(0.06, 0.42, 0.06), woodD); l.position.set(x, 0.21, z); b.add(l); }); }
      // wind chimes
      { const cx = 5.2, cz = -5.4, gy = onHill(cx, cz), ch = new T.Group(); ch.position.set(cx, gy + 3.2, cz); scene.add(ch); const tubes = [];
        const ring = new T.Mesh(new T.TorusGeometry(0.12, 0.012, 8, 24), brassM); ring.rotation.x = Math.PI / 2; ring.position.y = -0.2; ch.add(ring);
        const str = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 0.2, 4), ropeM); str.position.y = -0.1; ch.add(str);
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, L = 0.32 + (i % 3) * 0.1, g = new T.Group(); g.position.set(Math.cos(a) * 0.1, -0.22, Math.sin(a) * 0.1); const s = new T.Mesh(new T.CylinderGeometry(0.003, 0.003, 0.1, 3), ropeM); s.position.y = -0.05; g.add(s); const tb = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, L, 12), brassM); tb.position.y = -0.1 - L / 2; g.add(tb); ch.add(g); tubes.push({ g, ph: i * 1.1 }); }
        const bell = new T.Mesh(new T.SphereGeometry(0.08, 20, 14, 0, 6.283, 0, 1.9), brassM); bell.position.y = -0.24; ch.add(bell); U.chimes = { ch, tubes }; }
      // koi
      { const py = onHill(PX, PZ) + 0.01, kG = new T.SphereGeometry(0.1, 16, 10); kG.scale(0.45, 0.25, 1.4); const tG = new T.ConeGeometry(0.07, 0.16, 8); tG.rotateX(-Math.PI / 2); tG.scale(1, 0.25, 1); U.koi = [];
        [[0xF26A21, 0xFFFFFF], [0xFFFFFF, 0xE8401C], [0xF5A623, 0xF5A623], [0xE8401C, 0x1A1A1A], [0xFFFFFF, 0xF26A21]].forEach(([c1, c2], i) => { const g = new T.Group(); const bm = new T.MeshStandardMaterial({ color: c1, roughness: 0.4 }); const body = new T.Mesh(kG, bm); g.add(body); const spot = new T.Mesh(new T.SphereGeometry(0.04, 10, 8), new T.MeshStandardMaterial({ color: c2 })); spot.scale.set(1, 0.4, 1.4); spot.position.set(0, 0.018, 0.02); g.add(spot); const tail = new T.Mesh(tG, bm); tail.position.z = -0.2; g.add(tail); g.position.y = py; g.scale.setScalar(1.1); scene.add(g); U.koi.push({ g, tail, ph: i * 1.25, sp: 0.18 + i * 0.03, r: 0.55 + (i % 3) * 0.22, py }); }); }
      // sky lanterns (dusk)
      { const lG = new T.CylinderGeometry(0.11, 0.08, 0.2, 10, 1, true), U2 = scene.userData; U2.lanterns = [];
        for (let i = 0; i < 0; i++) { const m = new T.MeshStandardMaterial({ color: 0xFFD9A0, emissive: 0xFF9A3C, emissiveIntensity: 1.6, transparent: true, opacity: 0, side: T.DoubleSide }), l = new T.Mesh(lG, m); const gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: 0xFFB45A, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.setScalar(1.1); l.add(gl); l.scale.setScalar(1.4); scene.add(l); U2.lanterns.push({ l, gl, m, x0: PX + (rnd() - 0.5) * 9, z0: PZ + 1 - rnd() * 4, ph: i / 20 }); } } }
    (async () => { try { await new Promise(r => setTimeout(r, 2500)); const { GLTFLoader } = await import(B + '/examples/jsm/loaders/GLTFLoader.js'); const L = new GLTFLoader(), U = scene.userData;
        const get = id => { L.manager.setURLModifier(u => { const m = u.match(/textures\/([^/?#]+)$/); return m ? 'https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/' + id + '/' + m[1] : u; }); return L.loadAsync('https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/' + id + '/' + id + '_1k.gltf').then(g => g.scene); };
        const fit = (o, size, axis) => { const bb = new T.Box3().setFromObject(o), s = new T.Vector3(); bb.getSize(s); o.scale.multiplyScalar(size / (axis === 'y' ? s.y : Math.max(s.x, s.z))); const bb2 = new T.Box3().setFromObject(o); o.position.y -= bb2.min.y; return o; };
        const shadow = o => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        get('painted_wooden_bench').then(m => { fit(m, 1.5, 'x'); shadow(m); const g = new T.Group(); g.add(m); const p = U.benchProc.position; g.position.set(p.x, p.y, p.z); g.rotation.y = U.benchProc.rotation.y; scene.add(g); U.benchProc.visible = false; }).catch(e => console.warn('bench', e));
      } catch (e) { console.warn('scans', e); } })();
    // floating crafts
    const crafts = ['bottle', 'swatch', 'pencil', 'reel', 'box', 'K', 'knot', 'brush'].map((kd2, i) => { const o = makeCraft(T, RoundedBoxGeometry, kd2); const a = i / 8 * Math.PI * 2; o.userData = Object.assign(o.userData, { kind: 'craft', a, k: 0, base: o.rotation.clone() }); o.scale.setScalar(0.62); scene.add(o); return o; });
    crafts.forEach(o => { o.visible = false; });
    const cam = new T.PerspectiveCamera(36, 1, 0.1, 200), tgt = new T.Vector3(0, 2.2, -7);
    let W = 1, H = 1; const size = () => { W = host.clientWidth; H = host.clientHeight; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }; size(); const ro = new ResizeObserver(size); ro.observe(host);
    const pickables = [...trees], ray = new T.Raycaster(), nd = new T.Vector2();
    const tip = document.createElement('div'); tip.style.cssText = "position:absolute;z-index:5;pointer-events:none;opacity:0;transition:opacity .25s;font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:11.5px;letter-spacing:0.2em;text-transform:uppercase;background:#F6F2EC;color:#2B2466;padding:6px 10px;border-radius:999px;white-space:nowrap;"; host.appendChild(tip);
    const pick = e => { const r = cv.getBoundingClientRect(); nd.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(nd, cam); const h = ray.intersectObjects(pickables, true)[0]; if (!h) return null; let o = h.object; while (o && pickables.indexOf(o) < 0) o = o.parent; return o; };
    let mx = 0, my = 0, inside = false, hov = null, burst = 0;
    const move = e => { const r = cv.getBoundingClientRect(); inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1;
      hov = inside ? pick(e) : null; document.body.style.cursor = hov ? 'pointer' : ''; if (hov && hov.userData.label) { tip.textContent = hov.userData.label; tip.style.left = (e.clientX - r.left + 16) + 'px'; tip.style.top = (e.clientY - r.top + 14) + 'px'; tip.style.opacity = 1; } else tip.style.opacity = 0; };
    const click = e => { if (!inside) return; const o = pick(e); if (!o) return; const u = o.userData; if (u.kind === 'tree') u.shake = 1; else if (u.kind === 'gate') { u.glow = 1; burst = 1; } else u.k = 1; };
    window.addEventListener('pointermove', move); window.addEventListener('click', click);
    let vis = true; const io = new IntersectionObserver(([en]) => { vis = en.isIntersecting; }); io.observe(host);
    const M4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), sc = new T.Vector3(); const t0 = performance.now(); let prev = t0, raf, smx = 0, smy = 0;
    const loop = () => { raf = requestAnimationFrame(loop); if (!vis) { prev = performance.now(); return; }
      const now = performance.now(), dt = Math.min(0.05, (now - prev) / 1000), t = (now - t0) / 1000; prev = now; smx += (mx - smx) * 0.04; smy += (my - smy) * 0.04;
      cam.position.set(smx * 1.6, 3.4 - smy * 0.6, 7); cam.lookAt(tgt);
      trees.forEach((g, i) => { const u = g.userData; u.shake *= 0.95; g.rotation.z = Math.sin(t * 0.6 + i) * 0.015 + Math.sin(t * 14 + i) * 0.08 * u.shake; g.scale.y = g.scale.x * (1 + Math.sin(t * 20) * 0.03 * u.shake) / 1; });
      kd.forEach((s, i) => { const sw = Math.sin(t * 1.2 + s.ph + s.x * 0.2) * 0.12 + burst * Math.sin(t * 12 + i) * 0.2; e.set(0, 0, sw); q.setFromEuler(e);
        M4.compose(v.set(s.x, s.y + s.h / 2, s.z), q, sc.set(1, s.h, 1)); stem.setMatrixAt(i, M4); M4.compose(v.set(s.x - Math.sin(sw) * s.h, s.y + s.h * Math.cos(sw) - 0.05, s.z), q.setFromEuler(e.set(0, s.yaw, sw)), sc.set(s.ps, s.ps * 0.95, s.ps)); plume.setMatrixAt(i, M4); });
      stem.count = plume.count = kd.length; stem.instanceMatrix.needsUpdate = true; plume.instanceMatrix.needsUpdate = true; burst *= 0.97;
      torii.userData.glow *= 0.97; toriiM.emissiveIntensity = 0.05 + torii.userData.glow * 1.4 + (hov === torii ? 0.2 : 0); rim.intensity = 30 + torii.userData.glow * 80;
      for (let i = 0; i < FN; i++) { fPos[i * 3] += Math.sin(t * 0.5 + i) * 0.006; fPos[i * 3 + 1] += Math.cos(t * 0.7 + i * 1.3) * 0.005 + burst * 0.02; if (fPos[i * 3 + 1] > 7) fPos[i * 3 + 1] = 0; } fGeo.attributes.position.needsUpdate = true; fMat.opacity = 0.7 + Math.sin(t * 3) * 0.25 + burst * 0.3; fMat.size = 0.5;
      dragons.forEach(d => { d.dart = Math.max(0, d.dart - dt); const hop = (Math.sin(t * 0.9 + d.ph) > 0.93) ? 3.5 : 1; d.tt = (d.tt || d.ph) + dt * d.sp * hop;
        const p = dragPos(d), p2 = (d.tt += 0.02, dragPos(d)); d.tt -= 0.02; d.g.position.copy(p); d.g.lookAt(p2); d.g.rotateY(-Math.PI / 2);
        const fl = Math.sin(t * 55 + d.ph) * 0.55; d.wings.forEach((w, k) => { w.pv.rotation.x = w.sd * (fl * (k < 2 ? 1 : -1) * 0.8); }); });
      crafts.forEach((o, i) => { const u = o.userData; u.k *= 0.965; u.a += dt * (0.12 + u.k * 2); const k = u.k;
        o.position.set(Math.cos(u.a) * 6.5, 4.6 + Math.sin(u.a * 2 + i) * 0.6 + Math.abs(Math.sin((1 - k) * 9)) * k * 1.5, -7 + Math.sin(u.a) * 2.5);
        o.rotation.y += dt * (0.4 + k * 10); o.rotation.x = u.base.x + Math.sin(t * 0.6 + i) * 0.2; if (u.fan) u.fan.forEach((p, j) => p.rotation.z = (j - 2) * (0.12 + k * 0.5));
        o.scale.setScalar(0.62 * (o === hov ? 1.15 : 1)); });
      if (!scene.userData.dusk) { const D = scene.userData.dusk = { k: window.__kosDusk ? 1 : 0, hT: [new T.Color(0xC9C2FF), new T.Color(0x8A6FD0)], hB: [new T.Color(0x4B6A2E), new T.Color(0x3A2D4A)], dlC: [new T.Color(0xFFD6E8), new T.Color(0xFF9A6A)], hillC: [new T.Color(0xffffff), new T.Color(0xB7A8C4)] };
          const sg = new T.BufferGeometry(), SP = new Float32Array(900 * 3); for (let i = 0; i < 900; i++) { const a = rnd() * 6.283, el = 0.15 + rnd() * 1.2, r = 80; SP[i * 3] = Math.cos(a) * Math.cos(el) * r; SP[i * 3 + 1] = Math.sin(el) * r * 0.6 + 4; SP[i * 3 + 2] = -Math.abs(Math.sin(a) * Math.cos(el) * r) - 10; } sg.setAttribute('position', new T.BufferAttribute(SP, 3));
          D.stars = new T.Points(sg, new T.PointsMaterial({ color: 0xFFF4E6, size: 0.35, transparent: true, opacity: 0, depthWrite: false, fog: false })); scene.add(D.stars);
          D.sky = new T.Mesh(new T.SphereGeometry(90, 48, 24), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, transparent: true, fog: false,
            uniforms: { op: { value: 0 }, top: { value: new T.Color(0xA08CC6) }, mid: { value: new T.Color(0xBBA6D6) }, hor: { value: new T.Color(0xD6C2E0) }, sunDir: { value: new T.Vector3(0.55, 0.06, -1).normalize() }, time: { value: 0 } },
            vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
            fragmentShader: 'uniform float op, time; uniform vec3 top, mid, hor, sunDir; varying vec3 vP; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); } float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; } void main(){ float y = vP.y; vec3 c = mix(hor, mid, smoothstep(-0.01, 0.06, y)); c = mix(c, top, smoothstep(0.06, 0.24, y)); float sd = max(dot(vP, sunDir), 0.); c += vec3(1.,.9,.95) * pow(sd, 40.) * .25 + vec3(.95,.85,1.) * pow(sd, 6.) * .06; c += vec3(1.,.96,.88) * smoothstep(.9975, .999, sd); vec2 uv = vP.xz / max(vP.y + .25, .08) * .6 + vec2(time * .006, 0.); float cl = smoothstep(.5, .85, fbm(uv * 1.4)) * smoothstep(0., .25, y) * (1. - smoothstep(.55, .9, y)); vec3 cc = mix(vec3(.78,.68,.86), vec3(.93,.86,.95), pow(sd, 3.) + .25); c = mix(c, cc, cl * .55); gl_FragColor = vec4(c, op); }' }));
          D.sky.renderOrder = -10; scene.add(D.sky);
          { const cG = new T.SphereGeometry(1, 32, 20), cM = new T.MeshStandardMaterial({ color: 0xFBE6F0, roughness: 1, emissive: 0xF2C2D8, emissiveIntensity: 0.45, fog: false }), cS = new T.MeshStandardMaterial({ color: 0xD9C2E6, roughness: 1, emissive: 0xB89CCB, emissiveIntensity: 0.35, fog: false }); D.clouds = [];
            [[-22, 5.2, -30, 1.5], [-9, 6.4, -34, 1.9], [4, 5.6, -31, 1.4], [16, 6.8, -36, 2.0], [28, 5.4, -33, 1.6], [-32, 6.6, -38, 1.8], [10, 8.2, -42, 2.2], [-15, 8.6, -44, 2.1]].forEach(([x, y, z, s]) => { const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); for (let i = 0; i < 9; i++) { const r = 1.1 + rnd() * 1.2, a = (i / 9 - 0.5) * 6.5, o = new T.Mesh(cG, i < 3 ? cS : cM); o.position.set(a + (rnd() - 0.5), (i < 3 ? -0.4 : 0.2) + rnd() * 0.8, (rnd() - 0.5) * 1.5); o.scale.set(r, r * 0.8, r); g.add(o); } scene.add(g); D.clouds.push({ g, x0: x, sp: 0.15 + rnd() * 0.15 }); }); }
          D.blossomM = []; scene.traverse(o => { if (o.isMesh && o.material && o.material.color && o !== hill && o.material !== trunkM && o.material.emissive && o.geometry === florG) D.blossomM.push(o.material); });
          D.lamps = []; [[-3.5, -3.2], [-1.2, -4.5], [3.2, -3.8], [6.8, -5], [9.5, -7.5], [-6.5, -5.5]].forEach(([x, z]) => { const y = onHill(x, z), g = new T.Group(); g.position.set(x, y, z);
            const pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.04, 0.9, 8), trunkM); pole.position.y = 0.45; g.add(pole);
            const bulbM = new T.MeshStandardMaterial({ color: 0xFFE6B8, emissive: 0xFFB866, emissiveIntensity: 0 }); const bulb = new T.Mesh(new T.SphereGeometry(0.11, 16, 12), bulbM); bulb.position.y = 0.98; g.add(bulb);
            const pl = new T.PointLight(0xFFB070, 0, 5, 1.6); pl.position.y = 1; g.add(pl); scene.add(g); D.lamps.push({ g, bulbM, pl }); }); }
        { const D = scene.userData.dusk; D.k += ((window.__kosDusk ? 1 : 0) - D.k) * 0.03; const d = D.k;
          hemiW.color.lerpColors(D.hT[0], D.hT[1], d); hemiW.groundColor.lerpColors(D.hB[0], D.hB[1], d); hemiW.intensity = 0.9 - 0.35 * d;
          dl.color.lerpColors(D.dlC[0], D.dlC[1], d); dl.intensity = 1.6 - 0.75 * d; scene.environmentIntensity = 0.5 - 0.22 * d; hill.material.color.lerpColors(D.hillC[0], D.hillC[1], d);
          D.stars.material.opacity = d * (0.55 + Math.sin(t * 2) * 0.08); D.stars.visible = d > 0.01;
          (D.clouds || []).forEach(c => { c.g.position.x = c.x0 + Math.sin(t * 0.02 * c.sp * 10) * 3; });
          D.sky.material.uniforms.op.value = d; if (!D.masked) { D.masked = 1; cv.style.webkitMaskImage = cv.style.maskImage = 'linear-gradient(180deg, transparent 0%, #000 22%)'; } D.sky.material.uniforms.time.value = t; D.sky.visible = d > 0.005; D.sky.position.copy(cam.position);
          dl.position.set(-6 + 14 * d, 8 - 6.5 * d, 6 - 14 * d); rim.color.setRGB(0.95 + 0.05 * d, 0.71 - 0.15 * d, 0.81 - 0.45 * d); rim.intensity = 30 + 40 * d;
          D.blossomM.forEach(m => { m.emissive.setRGB(0.35 * d, 0.12 * d, 0.2 * d); });
          (scene.userData.lotus || []).forEach(l => { l.fl.position.y = l.y0 + Math.sin(t * 0.9 + l.ph) * 0.008; l.fl.rotation.z = Math.sin(t * 0.7 + l.ph) * 0.03; l.gl.material.opacity = 0.18 + 0.4 * d; });
          if (scene.userData.statue) scene.userData.statue.rotation.y = t * 0.15;
          (scene.userData.diyaL || []).forEach(l => { const f = 0.85 + Math.sin(t * 7 + l.ph) * 0.1 + Math.sin(t * 13 + l.ph) * 0.05; l.pl.intensity = 6 * d * f; l.gl.material.opacity = 0.8 * d * f; l.g.rotation.z = Math.sin(t * 0.9 + l.ph) * 0.05; }); if (scene.userData.hurricane) scene.userData.hurricane.intensity = 4 * d * (0.9 + Math.sin(t * 8) * 0.08);
          { const U = scene.userData; if (U.swing) U.swing.rotation.x = Math.sin(t * 0.9) * 0.16;
            if (U.chimes) { U.chimes.ch.rotation.z = Math.sin(t * 0.8) * 0.06; U.chimes.tubes.forEach(c => { c.g.rotation.x = Math.sin(t * 1.7 + c.ph) * 0.12; c.g.rotation.z = Math.cos(t * 1.3 + c.ph) * 0.1; }); }
            (U.koi || []).forEach(f => { const a = t * f.sp + f.ph * 1.3, x = PX + Math.cos(a) * f.r * PRX * 0.7, z = PZ + Math.sin(a * 1.1) * f.r * PRZ * 0.7, nx = PX + Math.cos(a + 0.05) * f.r * PRX * 0.7, nz = PZ + Math.sin((a + 0.05) * 1.1) * f.r * PRZ * 0.7; f.g.position.set(x, f.py, z); f.g.rotation.y = Math.atan2(nx - x, nz - z); f.tail.rotation.y = Math.sin(t * 6 + f.ph) * 0.4; });
            (U.lanterns || []).forEach(L => { const u = ((t * 0.03 + L.ph) % 1), y = onHill(L.x0, L.z0) + 0.3 + u * 16; L.l.position.set(L.x0 + Math.sin(u * 9 + L.ph * 6) * 0.6 + u * 3, y, L.z0 - u * 10); const fade = d * Math.min(1, u * 8) * Math.min(1, (1 - u) * 4); L.m.opacity = fade * 0.95; L.gl.material.opacity = fade * 0.85; L.m.emissiveIntensity = 1.4 + Math.sin(t * 6 + L.ph * 20) * 0.2; L.l.visible = fade > 0.01; }); } if (scene.userData.glitter) scene.userData.glitter.uniforms.time.value = t;
          (scene.userData.bank || []).forEach(l => { const tw = 0.85 + Math.sin(t * 7 + l.ph) * 0.1 + Math.sin(t * 13 + l.ph) * 0.05; l.fm.opacity = d * tw; l.gl.material.opacity = 0.9 * d * tw; l.fl.scale.y = 0.9 + Math.sin(t * 9 + l.ph) * 0.12; if (l.float) { const dx = Math.sin(t * 0.2 + l.ph) * 0.15, dz = Math.cos(t * 0.17 + l.ph) * 0.1; l.float.d.position.set(l.float.x + dx, l.float.y + Math.sin(t * 1.3 + l.ph) * 0.006, l.float.z + dz); l.fl.position.set(l.float.x + dx, l.float.y + 0.06, l.float.z + dz); l.gl.position.copy(l.fl.position); } }); if (scene.userData.bankLight) scene.userData.bankLight.intensity = 5 * d;
          (scene.userData.lamps2 || []).forEach(l => { const tw = 0.92 + Math.sin(t * 5 + l.ph) * 0.05 + Math.sin(t * 11 + l.ph * 2) * 0.03; l.lm.emissiveIntensity = (0.6 + 2.2 * d) * tw; l.gl.material.opacity = (0.15 + 0.6 * d) * tw; l.pl.intensity = (0.3 + 2.6 * d) * tw; });
          (scene.userData.bulbs || []).forEach(b => { if (b.pl) { b.pl.intensity = 4 * d; b.pl.visible = d > 0.03; return; } const on = d > 0.03, tw = 0.8 + Math.sin(t * 2.4 + b.ph) * 0.2; b.m.visible = true; b.gl.visible = on; b.m.material.emissiveIntensity = 3.2 * d * tw; b.m.material.color.setRGB(0.957 + 0.043 * d, 0.945 - 0.05 * d, 0.918 - 0.35 * d); b.gl.material.opacity = 0.85 * d * tw; b.gl.scale.setScalar(0.45 + Math.sin(t * 1.7 + b.ph) * 0.05); });
          (scene.userData.wires || []).forEach(w => { w.visible = d > 0.03; });
          (scene.userData.bflies || []).forEach(f => { const a = t * 0.5 + f.ph, x = f.c.x + Math.cos(a) * 1.6, z = f.c.z + Math.sin(a * 1.3) * 1.1; f.g.position.set(x, onHill(x, z) + 0.5 + Math.sin(a * 2.1) * 0.25 + Math.sin(t * 9 + f.ph) * 0.03, z); f.g.rotation.y = -a + Math.PI / 2; const fl = 0.3 + Math.sin(t * 13 + f.ph) * 1.0; f.L.rotation.z = fl; f.R.rotation.z = -fl; });
          D.lamps.forEach((l, i) => { const fl = 0.9 + Math.sin(t * 6 + i * 2) * 0.06; l.bulbM.emissiveIntensity = d * 4 * fl; l.pl.intensity = d * 14 * fl; l.g.visible = false; });
          fMat.opacity = Math.min(1, fMat.opacity + d * 0.35); fMat.size = 0.5; }
      R.render(scene, cam); if (window.__snapReq) { window.__snapReq = 0; window.__snapImg = cv.toDataURL('image/jpeg', 0.85); } };
    loop();
    return { dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', move); window.removeEventListener('click', click); tip.remove(); R.dispose(); } };
  };
})();
