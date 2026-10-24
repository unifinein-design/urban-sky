/* Hero pour scene, real-time 3D: an Urban Sky decanter pours cognac into a crystal snifter as you scroll.
   Falls back to the SVG scene in pour.js when WebGL is unavailable. */
import * as THREE from "three";
import { RoomEnvironment } from "../vendor/three/RoomEnvironment.js";
import { RoundedBoxGeometry } from "../vendor/three/RoundedBoxGeometry.js";

const stage = document.querySelector(".hero__stage");
const hero = document.querySelector(".hero");
const sceneEl = document.querySelector(".hero__scene");

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}

if (stage && sceneEl && webglOK()) {
  try { init(); } catch (e) { console.warn("3D scene failed, using SVG fallback", e); }
}

function init() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "hero__gl";
  sceneEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0806);
  // a dark studio with a few softboxes: crisp streak highlights on the glass instead of a grey room
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x020202);
  const box = (w, h, color, strength, x, y, z, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    m.lookAt(0, 0.6, 0);
    studio.add(m);
  };
  box(1.4, 6, 0xfff1dc, 3.2, -4.5, 2, 1.5);   // tall strip, left
  box(1.0, 5, 0xffd9a8, 2.4, 4.2, 2, 2.2);    // warm strip, right
  box(5, 1.6, 0xffffff, 1.4, 0, 6, 0.5);      // overhead
  box(3, 2, 0xff9a40, 0.8, 0, 1, -5);         // warm kicker behind
  scene.environment = pmrem.fromScene(studio, 0.03).texture;
  void RoomEnvironment;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const look = new THREE.Vector3();

  /* ---------- backdrop: blurred warm bokeh the glass can refract ---------- */
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    // tone-mapped like everything else, so it reads the same seen directly or through the glass
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  backdrop.position.set(0, 1.2, -4.5);
  scene.add(backdrop);
  const bgImg = new Image();
  bgImg.onload = () => {
    const c = document.createElement("canvas");
    c.width = 1600; c.height = 900;
    const g = c.getContext("2d");
    g.filter = "blur(26px) brightness(0.62) saturate(1.15)";
    const s = Math.max(c.width / bgImg.width, c.height / bgImg.height) * 1.12;
    g.drawImage(bgImg, (c.width - bgImg.width * s) / 2, (c.height - bgImg.height * s) / 2, bgImg.width * s, bgImg.height * s);
    g.filter = "none";
    const vg = g.createRadialGradient(c.width * 0.62, c.height * 0.55, 80, c.width * 0.5, c.height * 0.5, c.width * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(5,4,3,0.85)");
    g.fillStyle = vg;
    g.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    backdrop.material.map = t;
    backdrop.material.needsUpdate = true;
  };
  bgImg.src = "assets/img/pour-bg.jpg";

  /* ---------- table ---------- */
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 12),
    new THREE.MeshPhysicalMaterial({ color: 0x0e0b08, roughness: 0.5, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.35 })
  );
  table.rotation.x = -Math.PI / 2;
  scene.add(table);

  function shadowTex() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, "rgba(0,0,0,0.75)");
    r.addColorStop(0.5, "rgba(0,0,0,0.35)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  const sTex = shadowTex();
  const mkShadow = (w, d) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.002;
    scene.add(m);
    return m;
  };
  const glassShadow = mkShadow(1.3, 1.0);
  const bottleShadow = mkShadow(1.2, 0.9);

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0xffe8cc, 0.15));
  const key = new THREE.SpotLight(0xffd7a0, 38, 14, 0.5, 0.7, 1.6);
  key.position.set(2.6, 4.2, 2.2);
  key.target.position.set(0.2, 0.6, 0);
  scene.add(key, key.target);
  const rim = new THREE.SpotLight(0xffb070, 30, 12, 0.6, 0.8, 1.6);
  rim.position.set(-2.4, 2.2, -2.6);
  rim.target.position.set(0, 0.7, 0);
  scene.add(rim, rim.target);
  const glowLight = new THREE.PointLight(0xff8a2a, 0, 2.2, 2);
  glowLight.position.set(0, 0.55, 0.15);
  scene.add(glowLight);

  /* ---------- materials ---------- */
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02,
    transmission: 1, thickness: 0.006, ior: 1.5,
    specularIntensity: 1, envMapIntensity: 1.7,
    clearcoat: 1, clearcoatRoughness: 0.02,
    side: THREE.FrontSide,
  });
  const decanterMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03,
    transmission: 1, thickness: 0.35, ior: 1.52,
    attenuationColor: new THREE.Color(0xe8f2ee), attenuationDistance: 3,
    specularIntensity: 1, envMapIntensity: 1.6,
    clearcoat: 1, clearcoatRoughness: 0.03,
  });
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x7a2006, emissive: 0x8a2a04, emissiveIntensity: 0.5,
    roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 1.1,
  });
  const streamMat = liquidMat.clone();
  streamMat.color.set(0x9a3a08);
  streamMat.emissive.set(0x7a2c04);
  streamMat.emissiveIntensity = 0.7;
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd8b56e, metalness: 1, roughness: 0.22, envMapIntensity: 1.6 });

  /* ---------- the snifter (one closed lathe: foot, stem, bowl, lip, inner wall) ---------- */
  const CY = 0.8, A = 0.55, B = 0.42, T = 0.012;
  const pts = [];
  [[0.001, 0], [0.4, 0], [0.42, 0.008], [0.42, 0.018], [0.38, 0.026], [0.12, 0.04], [0.05, 0.07], [0.036, 0.14], [0.036, 0.27], [0.048, 0.34], [0.09, 0.382]]
    .forEach(([r, y]) => pts.push(new THREE.Vector2(r, y)));
  const TH0 = 0.32, TH1 = 2.35;
  for (let i = 0; i <= 60; i++) {
    const th = lerp(TH0, TH1, i / 60);
    pts.push(new THREE.Vector2(A * Math.sin(th), CY - B * Math.cos(th)));
  }
  const rimR = A * Math.sin(TH1), rimY = CY - B * Math.cos(TH1);
  pts.push(new THREE.Vector2(rimR - T * 0.5, rimY + 0.006));
  for (let i = 0; i <= 60; i++) {
    const th = lerp(TH1, 0.3, i / 60);
    pts.push(new THREE.Vector2((A - T) * Math.sin(th), CY - (B - T) * Math.cos(th)));
  }
  pts.push(new THREE.Vector2(0.001, CY - (B - T) * Math.cos(0.3) + 0.002));
  // lathe winding follows point order; reversed so the normals face outward
  const snifter = new THREE.Mesh(new THREE.LatheGeometry(pts.reverse(), 128), glassMat);
  scene.add(snifter);

  /* liquid inside the bowl, rebuilt as the level rises */
  const LA = A - T - 0.003, LB = B - T - 0.003;
  const Y_BOTTOM = CY - LB * Math.cos(0.3);
  const Y_FULL = 0.76;
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat);
  scene.add(liquid);
  let lastLevel = -1;
  function setLevel(y) {
    if (Math.abs(y - lastLevel) < 0.0008) return;
    lastLevel = y;
    liquid.visible = y > Y_BOTTOM + 0.004;
    if (!liquid.visible) return;
    const thL = Math.acos(clamp((CY - y) / LB, -1, 1));
    const lp = [new THREE.Vector2(0.001, Y_BOTTOM)];
    for (let i = 0; i <= 28; i++) {
      const th = lerp(0.3, thL, i / 28);
      lp.push(new THREE.Vector2(LA * Math.sin(th), CY - LB * Math.cos(th)));
    }
    lp.push(new THREE.Vector2(0.001, y));
    liquid.geometry.dispose();
    liquid.geometry = new THREE.LatheGeometry(lp.reverse(), 96);
  }
  function radiusAt(y) {
    const th = Math.acos(clamp((CY - y) / LB, -1, 1));
    return LA * Math.sin(th);
  }

  /* ---------- the decanter: origin at the mouth, body hangs below ---------- */
  const bottle = new THREE.Group();
  scene.add(bottle);
  const BODY_W = 0.62, BODY_H = 0.95, BODY_D = 0.42;
  const BODY_TOP = -0.4, BODY_Y = BODY_TOP - BODY_H / 2;
  const body = new THREE.Mesh(new RoundedBoxGeometry(BODY_W, BODY_H, BODY_D, 6, 0.07), decanterMat);
  body.position.y = BODY_Y;
  bottle.add(body);
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.2, 0.1, 48, 1), decanterMat);
  shoulder.position.y = BODY_TOP + 0.05;
  bottle.add(shoulder);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.3, 48, 1, true), decanterMat);
  neck.position.y = -0.15;
  bottle.add(neck);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.014, 16, 48), decanterMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = -0.004;
  bottle.add(lip);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.079, 0.079, 0.07, 48, 1, true), goldMat);
  collar.position.y = -0.11;
  bottle.add(collar);
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 12, 48), goldMat);
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.y = -0.148;
  bottle.add(collarRing);

  // cognac inside the decanter, drains as it pours
  const inner = new THREE.Mesh(new RoundedBoxGeometry(BODY_W - 0.06, 1, BODY_D - 0.06, 4, 0.05), liquidMat);
  bottle.add(inner);
  const INNER_FULL = BODY_H - 0.12;
  function setBottleFill(f) {
    const h = Math.max(0.05, INNER_FULL * f);
    inner.scale.y = h;
    inner.position.y = BODY_Y - BODY_H / 2 + 0.03 + h / 2;
  }

  // the Urban Sky label
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 900; labelCanvas.height = 1000;
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.49),
    new THREE.MeshPhysicalMaterial({ map: labelTex, roughness: 0.5, metalness: 0.15, clearcoat: 0.3, envMapIntensity: 0.8 })
  );
  label.position.set(0, BODY_Y - 0.04, BODY_D / 2 + 0.004);
  bottle.add(label);

  function drawLabel(logo) {
    const g = labelCanvas.getContext("2d");
    const W = labelCanvas.width, H = labelCanvas.height;
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#124632");
    bg.addColorStop(1, "#06221a");
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    const gold = g.createLinearGradient(0, 0, W, 0);
    gold.addColorStop(0, "#8a6a32");
    gold.addColorStop(0.45, "#f3dea4");
    gold.addColorStop(0.6, "#c9a45c");
    gold.addColorStop(1, "#8a6a32");
    g.strokeStyle = gold;
    g.lineWidth = 10;
    g.strokeRect(26, 26, W - 52, H - 52);
    g.lineWidth = 3;
    g.strokeRect(48, 48, W - 96, H - 96);
    if (logo) {
      const lw = 300, lh = lw * (logo.height / logo.width);
      g.drawImage(logo, (W - lw) / 2, 110, lw, lh);
    }
    g.fillStyle = gold;
    g.textAlign = "center";
    g.font = "600 112px Cinzel, serif";
    g.letterSpacing = "10px";
    g.fillText("URBAN SKY", W / 2 + 5, 600);
    g.fillRect(W / 2 - 160, 640, 320, 3);
    g.font = "400 34px Jost, sans-serif";
    g.letterSpacing = "12px";
    g.fillText("HOLDINGS (PVT) LTD", W / 2 + 6, 712);
    g.font = "italic 400 52px 'Cormorant Garamond', serif";
    g.letterSpacing = "2px";
    g.fillText("Fine Wine & Spirits", W / 2, 820);
    g.font = "500 26px Jost, sans-serif";
    g.letterSpacing = "14px";
    g.fillText("SRI LANKA", W / 2 + 7, 890);
    labelTex.needsUpdate = true;
  }
  const logo = new Image();
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  logo.onload = () => fontsReady.then(() => drawLabel(logo));
  logo.onerror = () => fontsReady.then(() => drawLabel(null));
  logo.src = "assets/img/logo.png";
  drawLabel(null);

  /* ---------- pour stream + splashes ---------- */
  const stream = new THREE.Mesh(new THREE.BufferGeometry(), streamMat);
  scene.add(stream);
  const drops = [];
  const dropGeo = new THREE.SphereGeometry(1, 10, 8);
  for (let i = 0; i < 28; i++) {
    const m = new THREE.Mesh(dropGeo, streamMat);
    m.visible = false;
    scene.add(m);
    drops.push({ m, v: new THREE.Vector3(), life: 0 });
  }
  function spawnDrop(p, power) {
    const d = drops.find((x) => x.life <= 0);
    if (!d) return;
    d.life = 1;
    d.m.visible = true;
    d.m.position.copy(p);
    d.v.set((Math.random() - 0.5) * 0.9, 0.5 + Math.random() * 0.9 * power, (Math.random() - 0.5) * 0.6);
    d.m.scale.setScalar(0.006 + Math.random() * 0.01);
  }

  /* ---------- choreography ---------- */
  const START = { x: 0.9, y: 1.355, z: -0.25, r: 0 };
  const POUR = { x: 0.3, y: 1.28, z: 0.0, r: 1.85 };
  function bottlePose(q) {
    const inP = easeInOut(seg(q, 0.02, 0.26));
    const outP = easeInOut(seg(q, 0.84, 0.98));
    const hold = seg(q, 0.26, 0.84);
    let x = lerp(START.x, POUR.x, inP);
    let y = lerp(START.y, POUR.y, inP) + Math.sin(inP * Math.PI) * 0.22;
    let z = lerp(START.z, POUR.z, inP);
    let r = lerp(START.r, POUR.r, inP) + hold * 0.12;
    x = lerp(x, START.x, outP);
    y = lerp(y, START.y, outP);
    z = lerp(z, START.z, outP);
    r = lerp(r, 0, outP);
    return { x, y, z, r };
  }

  let target = reduce ? 1 : 0;
  let p = target;
  function readScroll() {
    const rc = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    target = total > 0 ? clamp(-rc.top / total) : 0;
  }
  if (!reduce) {
    window.addEventListener("scroll", readScroll, { passive: true });
    readScroll();
  }

  let introStart = reduce ? -1e9 : null;
  const beginIntro = () => { if (introStart === null) introStart = performance.now() + (document.querySelector(".loader") ? 1500 : 200); };
  window.addEventListener("pour:intro", beginIntro);
  if (window.__usStarted) beginIntro();

  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  /* ---------- sizing / framing ---------- */
  let mobile = false;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    mobile = camera.aspect < 0.9;
    camera.fov = mobile ? 34 : 28;
    camera.updateProjectionMatrix();
    const dist = 8;
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * (dist + 4.5);
    backdrop.scale.set(vh * camera.aspect * 1.3, vh * 1.3, 1);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- render loop ---------- */
  let visible = true;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: "100px" }).observe(stage);
  document.documentElement.classList.add("has-3d");

  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const time = clock.getElapsedTime();
    const intro = introStart === null ? 0 : clamp((now - introStart) / 1700);

    p += (target - p) * 0.08;
    if (!Number.isFinite(p)) p = target;
    const q = p;

    // camera: gentle push-in with the pour, a little parallax from the pointer
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    if (mobile) {
      // narrow screens: pull back and drop the scene into the lower half, under the headline
      camera.position.set(0.35 + mouse.sx * 0.2, 1.85 - mouse.sy * 0.1, 8.5 - q * 0.4);
      look.set(0.35, 1.55, 0);
    } else {
      camera.position.set(-0.4 + mouse.sx * 0.35, 1.12 - mouse.sy * 0.18, 5.3 - q * 0.3);
      look.set(-0.42 + q * 0.04, 0.86, 0);
    }
    camera.lookAt(look);

    // bottle
    const pose = bottlePose(q);
    const enter = easeOut(intro);
    bottle.position.set(pose.x + (1 - enter) * 2.4, pose.y, pose.z);
    bottle.rotation.z = pose.r;
    setBottleFill(1 - 0.55 * easeOut(seg(q, 0.3, 0.86)));
    bottleShadow.position.set(bottle.position.x - 0.0, 0.002, bottle.position.z);
    const lifted = clamp(1 - Math.abs(pose.r) / 0.6);
    bottleShadow.material.opacity = 0.9 * lifted * enter;

    // glass fill
    const level = lerp(Y_BOTTOM, Y_FULL, easeOut(seg(q, 0.3, 0.86)));
    setLevel(level);
    liquid.rotation.y = time * 0.15;
    const fillAmt = seg(level, Y_BOTTOM, Y_FULL);
    glowLight.intensity = fillAmt * 1.6;

    // stream: a ballistic arc from the mouth down to the surface
    const pourOn = seg(q, 0.24, 0.3) * (1 - seg(q, 0.8, 0.86));
    const head = easeOut(seg(q, 0.24, 0.31));
    const tail = easeInOut(seg(q, 0.8, 0.88));
    stream.visible = head > 0 && tail < 1 && intro >= 1;
    if (stream.visible) {
      const mouth = tmp.set(0, 0.01, 0).applyMatrix4(bottle.matrixWorld);
      const dir = new THREE.Vector3(-Math.sin(pose.r), Math.cos(pose.r), 0);
      const v0 = dir.multiplyScalar(0.55);
      const g = 4.2;
      const surf = Math.max(level, Y_BOTTOM + 0.01);
      // time to reach the surface
      const a = 0.5 * g, b = -v0.y, c = surf - mouth.y;
      const tHit = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
      const t0 = tHit * tail, t1 = tHit * head;
      const n = 18, curvePts = [];
      for (let i = 0; i <= n; i++) {
        const t = lerp(t0, t1, i / n);
        const wob = Math.sin(time * 14 + i * 0.7) * 0.003 * pourOn;
        curvePts.push(new THREE.Vector3(mouth.x + v0.x * t + wob, mouth.y + v0.y * t - 0.5 * g * t * t, mouth.z + v0.z * t));
      }
      const curve = new THREE.CatmullRomCurve3(curvePts);
      stream.geometry.dispose();
      stream.geometry = new THREE.TubeGeometry(curve, 48, 0.024 + Math.sin(time * 11) * 0.002, 12, false);
      const end = curvePts[n];
      if (head >= 1 && Math.random() < 0.6 * pourOn && Math.hypot(end.x, end.z) < radiusAt(surf)) spawnDrop(end, 0.5 + pourOn);
    }

    // splashes
    const dt = 1 / 60;
    for (const d of drops) {
      if (d.life <= 0) continue;
      d.v.y -= 6 * dt;
      d.m.position.addScaledVector(d.v, dt);
      d.life -= 0.04;
      if (d.life <= 0 || d.m.position.y < level - 0.01) { d.life = 0; d.m.visible = false; }
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
