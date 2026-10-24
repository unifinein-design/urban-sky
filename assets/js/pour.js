/* Hero pour scene: scroll-driven bottle pour into a crystal tumbler */
(function () {
  const svg = document.getElementById("pour");
  if (!svg) return;

  const $ = (id) => document.getElementById(id);
  const bottle = $("bottle");
  const liquid = $("liquid");
  const stream = $("stream");
  const streamCore = $("stream-core");
  const ice = $("ice");
  const glow = $("glow");
  const splash = $("splash");
  const bubbles = $("bubbles");
  const NS = "http://www.w3.org/2000/svg";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // geometry (viewBox 0 0 1000 1000)
  const GLASS_L = 360, GLASS_R = 640, FLOOR = 872, FULL = 692;
  const START = { x: 800, y: 250, r: 0 };
  const POUR = { x: 548, y: 400, r: -116 };
  const BOTTLE_SCALE = 0.82;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  let target = reduce ? 1 : 0; // scroll progress 0..1
  let p = target;              // smoothed progress
  let intro = reduce ? 1 : 0;  // load-in 0..1
  let t0 = performance.now();
  const drops = [];

  // scroll progress from the tall hero section
  const hero = document.querySelector(".hero");
  function readScroll() {
    const r = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    target = total > 0 ? clamp(-r.top / total) : 0;
  }
  if (!reduce) {
    window.addEventListener("scroll", readScroll, { passive: true });
    readScroll();
  }
  // the bottle glides in once the age gate and loader are out of the way
  let introStart = null;
  const beginIntro = () => { if (introStart === null) introStart = performance.now() + (document.querySelector(".loader") ? 1500 : 200); };
  window.addEventListener("pour:intro", beginIntro);
  if (window.__usStarted) beginIntro();

  // bubbles inside the glass
  for (let i = 0; i < 14; i++) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", (Math.random() * 2.2 + 0.8).toFixed(1));
    c.setAttribute("fill", "rgba(255,230,180,0.55)");
    c._x = lerp(GLASS_L + 30, GLASS_R - 30, Math.random());
    c._s = 0.4 + Math.random() * 0.9;
    c._o = Math.random();
    bubbles.appendChild(c);
  }

  function bottlePose(q) {
    // q: progress through the scroll timeline
    const inP = easeInOut(seg(q, 0.02, 0.26));
    const outP = easeInOut(seg(q, 0.84, 0.98));
    const hold = seg(q, 0.26, 0.84);
    let x = lerp(START.x, POUR.x, inP);
    let y = lerp(START.y, POUR.y, inP) - Math.sin(inP * Math.PI) * 60;
    let r = lerp(START.r, POUR.r, inP) - hold * 8; // tips further as it empties
    // return: lift away and stand upright to the side
    x = lerp(x, 812, outP);
    y = lerp(y, 214, outP);
    r = lerp(r, 0, outP);
    return { x, y, r };
  }

  function mouthWorld(pose) {
    // mouth sits at the group's origin
    return { x: pose.x, y: pose.y };
  }

  function surfacePath(level, time, agitation) {
    const y = lerp(FLOOR, FULL, level);
    const pts = [];
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const x = lerp(GLASS_L, GLASS_R, i / n);
      const w =
        Math.sin(i * 0.55 + time * 2.4) * (1.6 + agitation * 5) +
        Math.sin(i * 1.3 - time * 3.7) * (0.8 + agitation * 3.2);
      pts.push([x, y + w]);
    }
    let d = `M${GLASS_L - 10},${FLOOR + 30} L${GLASS_L - 10},${pts[0][1]}`;
    for (const [x, yy] of pts) d += ` L${x.toFixed(1)},${yy.toFixed(1)}`;
    d += ` L${GLASS_R + 10},${pts[n][1]} L${GLASS_R + 10},${FLOOR + 30} Z`;
    return { d, y };
  }

  function spawnDrop(x, y, power) {
    if (drops.length > 40) return;
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("fill", "url(#dropGrad)");
    splash.appendChild(c);
    drops.push({
      el: c, x, y,
      vx: (Math.random() - 0.5) * 3.4 * power,
      vy: -(2 + Math.random() * 4.5) * power,
      r: 1.5 + Math.random() * 3,
      life: 1,
    });
  }

  function frame(now) {
    const time = (now - t0) / 1000;
    if (!reduce && introStart !== null) intro = clamp((now - introStart) / 1600);

    p += (target - p) * 0.085;
    if (!Number.isFinite(p)) p = target;
    const q = p;

    // bottle
    const pose = bottlePose(q);
    const enter = easeOut(intro);
    const ix = lerp(1200, 0, enter);
    bottle.setAttribute(
      "transform",
      `translate(${(pose.x + ix).toFixed(2)} ${pose.y.toFixed(2)}) rotate(${pose.r.toFixed(2)}) scale(${BOTTLE_SCALE})`
    );

    // fill level and pour intensity
    const level = easeOut(seg(q, 0.3, 0.86)) * 0.92 + 0.02;
    const pourOn = seg(q, 0.24, 0.3) * (1 - seg(q, 0.8, 0.86));
    const surf = surfacePath(level, time, pourOn);
    liquid.setAttribute("d", surf.d);

    // stream
    const m = mouthWorld(pose);
    const head = easeOut(seg(q, 0.24, 0.31)); // stream falling
    const tail = easeInOut(seg(q, 0.8, 0.88)); // stream cut
    const landX = 506 + Math.sin(time * 3) * 2;
    if (head > 0 && tail < 1 && intro >= 1) {
      const y0 = lerp(m.y, surf.y, tail);
      const y1 = lerp(m.y, surf.y, head);
      const x0 = lerp(m.x, landX, Math.pow(tail, 0.6));
      const x1 = lerp(m.x, landX, Math.pow(head, 0.6));
      const cx = lerp(x0, x1, 0.15) - 14 + Math.sin(time * 9) * 1.4;
      const cy = lerp(y0, y1, 0.35);
      const d = `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
      const wv = 7 + Math.sin(time * 14) * 0.9;
      stream.setAttribute("d", d);
      streamCore.setAttribute("d", d);
      stream.setAttribute("stroke-width", wv.toFixed(2));
      streamCore.setAttribute("stroke-width", (wv * 0.32).toFixed(2));
      stream.style.opacity = streamCore.style.opacity = 1;
      if (head >= 1 && Math.random() < 0.55 * pourOn) spawnDrop(landX, surf.y, 0.6 + pourOn * 0.6);
    } else {
      stream.style.opacity = streamCore.style.opacity = 0;
    }

    // splash droplets
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vy += 0.32;
      d.x += d.vx;
      d.y += d.vy;
      d.life -= 0.035;
      if (d.life <= 0 || d.y > surf.y + 6) {
        d.el.remove();
        drops.splice(i, 1);
        continue;
      }
      d.el.setAttribute("cx", d.x.toFixed(1));
      d.el.setAttribute("cy", d.y.toFixed(1));
      d.el.setAttribute("r", (d.r * d.life).toFixed(2));
    }

    // ice bobs on the surface once there's enough liquid
    const float = Math.max(surf.y - 46, FLOOR - 92);
    ice.setAttribute(
      "transform",
      `translate(0 ${(float - (FLOOR - 92) + Math.sin(time * 1.6) * 2.5 * (0.4 + pourOn)).toFixed(2)}) rotate(${(Math.sin(time * 1.1) * 2.2).toFixed(2)} 500 790)`
    );

    // bubbles rise inside the liquid
    for (const c of bubbles.children) {
      const span = FLOOR - surf.y;
      if (span < 20) { c.setAttribute("opacity", 0); continue; }
      const k = ((time * c._s * 0.35 + c._o) % 1);
      c.setAttribute("cx", (c._x + Math.sin(time * 2 + c._o * 9) * 3).toFixed(1));
      c.setAttribute("cy", (FLOOR - k * span).toFixed(1));
      c.setAttribute("opacity", (Math.sin(k * Math.PI) * 0.9 * clamp(level * 3)).toFixed(2));
    }

    // warm glow grows with the pour
    glow.setAttribute("opacity", (0.25 + level * 0.75).toFixed(3));

    requestAnimationFrame(frame);
  }

  if (reduce) intro = 1;
  requestAnimationFrame(frame);
})();
