// <hv-cup src="..."> — real 3D paper cup; wraps a flat cup dieline (annular sector) onto a cone frustum.
class HvCup extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.style.cssText = 'display:block;position:absolute;inset:0;';
    const cv = document.createElement('canvas'); cv.style.cssText = 'width:100%;height:100%;display:block;';
    this.appendChild(cv); this.start(cv);
  }
  disconnectedCallback() { this._off && this._off(); this._init = false; }
  async start(cv) {
    const T = await import('https://esm.sh/three@0.160.0');
    const { RoomEnvironment } = await import('https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js');
    const r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(2, devicePixelRatio)); r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.3;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    const sc = new T.Scene(), pm = new T.PMREMGenerator(r); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    const cam = new T.PerspectiveCamera(24, 1, 0.1, 100); cam.position.set(0, 0.6, 11); cam.lookAt(0, 0.05, 0);
    // dieline geometry (px in 1280x800 file): circle centre, inner/outer radius of the black print area, half-angle
    const IW = 1280, IH = 800, CX = 683, CY = 2320, R1 = 2168, R0 = 1690, PHI = 14.0 * Math.PI / 180;
    const rTop = 1.0, rBot = 0.76, hgt = 3.05;
    const tex = await new T.TextureLoader().loadAsync(this.getAttribute('src'));
    tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = r.capabilities.getMaxAnisotropy();
    const body = new T.CylinderGeometry(rTop, rBot, hgt, 200, 24, true), uv = body.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i), v = uv.getY(i), a = (0.5 - u) * 2 * PHI, R = R0 + v * (R1 - R0);
      uv.setXY(i, (CX + R * Math.sin(a)) / IW, 1 - (CY - R * Math.cos(a)) / IH);
    }
    const paper = new T.MeshPhysicalMaterial({ color: 0xF6F2EA, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.5 });
    const g = new T.Group();
    const outer = new T.Mesh(body, new T.MeshPhysicalMaterial({ map: tex, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.2 }));
    outer.castShadow = true; g.add(outer);
    // white unprinted band + base at the bottom edge, like a real cup's bottom curl
    const band = new T.Mesh(new T.CylinderGeometry(rBot + 0.003, rBot - 0.012, 0.09, 160, 1, true), paper); band.position.y = -hgt / 2 - 0.045; band.castShadow = true; g.add(band);
    const base = new T.Mesh(new T.CircleGeometry(rBot - 0.012, 96), paper); base.rotation.x = Math.PI / 2; base.position.y = -hgt / 2 - 0.09; g.add(base);
    const rim = new T.Mesh(new T.TorusGeometry(rTop + 0.012, 0.035, 24, 200), paper); rim.rotation.x = Math.PI / 2; rim.position.y = hgt / 2; g.add(rim);
    // lid: skirt, ridge, slightly domed top, sip slot
    const lidM = new T.MeshPhysicalMaterial({ color: 0xDE351E, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    const skirt = new T.Mesh(new T.CylinderGeometry(rTop + 0.06, rTop + 0.075, 0.16, 200), lidM); skirt.position.y = hgt / 2 + 0.06; skirt.castShadow = true; g.add(skirt);
    const ridge = new T.Mesh(new T.CylinderGeometry(rTop - 0.04, rTop + 0.05, 0.12, 200), lidM); ridge.position.y = hgt / 2 + 0.2; g.add(ridge);
    const dome = new T.Mesh(new T.SphereGeometry(rTop * 3.2, 96, 16, 0, Math.PI * 2, 0, 0.29), lidM); dome.position.y = hgt / 2 + 0.26 - rTop * 3.2 * Math.cos(0.29) + 0.02; g.add(dome);
    const sip = new T.Mesh(new T.CapsuleGeometry(0.035, 0.26, 8, 16), new T.MeshBasicMaterial({ color: 0x050505 })); sip.rotation.z = Math.PI / 2; sip.position.set(0, hgt / 2 + 0.3, rTop - 0.22); g.add(sip);
    g.rotation.x = 0.06; sc.add(g);
    const sun = new T.DirectionalLight(0xfff4e6, 2.2); sun.position.set(-4, 6, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); sun.shadow.radius = 6; sc.add(sun);
    sc.add(new T.HemisphereLight(0xffffff, 0xd9cbb5, 0.5));
    const fl = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({ opacity: 0.14 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -hgt / 2 - 0.09; fl.receiveShadow = true; sc.add(fl);
    const size = () => { const w = this.clientWidth || 1, h = this.clientHeight || 1; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(this);
    let mx = 0, raf, drag = null, rot = Math.PI + 0.25, vel = 0.012;
    const pd = e => { drag = e.clientX; vel = 0; cv.setPointerCapture(e.pointerId); };
    const pmv = e => { if (drag !== null) { const d = (e.clientX - drag) * 0.01; rot += d; vel = d * 0.15; drag = e.clientX; } };
    const pu = () => { drag = null; if (Math.abs(vel) < 0.006) vel = 0.012 * Math.sign(vel || 1); };
    cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pmv); cv.addEventListener('pointerup', pu); cv.style.cursor = 'grab';
    const loop = () => { raf = requestAnimationFrame(loop); if (drag === null) rot += vel; g.rotation.y = rot; r.render(sc, cam); };
    loop();
    this._off = () => { cancelAnimationFrame(raf); ro.disconnect(); r.dispose(); };
  }
}
if (!customElements.get('hv-cup')) customElements.define('hv-cup', HvCup);
