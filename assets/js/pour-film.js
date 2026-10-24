/* Hero pour film: real footage scrubbed frame by frame with scroll.
   Footage: Pexels video 7255224 (Pexels licence, free for commercial use). */
(function () {
  const hero = document.querySelector(".hero");
  const stage = document.querySelector(".hero__stage");
  const canvas = document.querySelector(".hero__film");
  const crest = document.querySelector(".hero__crest");
  if (!hero || !stage || !canvas) return;

  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.matchMedia("(max-width: 860px)").matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  // phones and data-saver get the lighter sequence
  const SEQ = small || saveData ? { dir: "assets/pour/m/", count: 75 } : { dir: "assets/pour/", count: 150 };
  const INTRO_END = Math.round(SEQ.count * 0.1); // decanter glides in on load, then scroll takes over
  const BG = "#0a0806";
  const GRADE = "contrast(1.12) saturate(1.18) sepia(0.12) brightness(1.03)";

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const pad = (n) => String(n).padStart(3, "0");

  /* ---------- progressive frame loading ---------- */
  const frames = new Array(SEQ.count);
  const load = (i) => new Promise((res) => {
    if (frames[i]) return res(frames[i]);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { frames[i] = img; res(img); };
    img.onerror = () => res(null);
    img.src = SEQ.dir + pad(i) + ".jpg";
  });
  // first frame, the intro end and the final frame first; then the rest in order, a few at a time
  const priority = [0, INTRO_END, SEQ.count - 1];
  const queue = [];
  for (let i = 0; i < SEQ.count; i++) if (!priority.includes(i)) queue.push(i);
  Promise.all(priority.map(load)).then(() => {
    draw(true);
    let active = 0;
    const next = () => {
      while (active < 6 && queue.length) {
        active++;
        load(queue.shift()).then(() => { active--; draw(); next(); });
      }
    };
    next();
  });

  function nearestLoaded(i) {
    for (let d = 0; d < SEQ.count; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  /* ---------- sizing ---------- */
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    lastDrawn = -1;
    draw(true);
  }

  // where the 9:16 film sits: right half on desktop, bottom of the screen on phones
  function placement(img) {
    const ar = img.width / img.height;
    if (W / H < 0.9) {
      const w = W * 1.15, h = w / ar;
      return { x: (W - w) / 2, y: H - h + h * 0.04, w, h };
    }
    // the glass sits low in the footage, so lift the film to keep its base clear of the fold
    const h = H * 1.04, w = h * ar;
    const cx = W * 0.7;
    return { x: cx - w / 2, y: (H - h) / 2 - H * 0.1, w, h };
  }

  /* ---------- drawing ---------- */
  let lastDrawn = -1;
  let current = 0;
  function draw(force) {
    const i = Math.round(current);
    if (!force && i === lastDrawn) return;
    const img = frames[i] || nearestLoaded(i);
    if (!img || !W) return;
    lastDrawn = frames[i] ? i : -1;
    const p = placement(img);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.filter = GRADE;
    ctx.drawImage(img, p.x, p.y, p.w, p.h);
    ctx.filter = "none";
    // melt the film's edges into the page
    const fade = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, BG);
      g.addColorStop(1, "rgba(10,8,6,0)");
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    };
    const e = Math.min(p.w, p.h) * 0.22;
    fade(p.x, 0, p.x + e, 0, p.x - 1, 0, e + 1, H);
    fade(p.x + p.w, 0, p.x + p.w - e, 0, p.x + p.w - e, 0, e + 1, H);
    fade(0, p.y, 0, p.y + e, 0, p.y - 1, W, e + 1);
    fade(0, p.y + p.h, 0, p.y + p.h - e, 0, p.y + p.h - e, W, e + 1);
  }

  /* ---------- scroll + intro ---------- */
  let target = reduce ? SEQ.count - 1 : 0;
  let introStart = null;
  const beginIntro = () => { if (introStart === null) introStart = performance.now() + (document.querySelector(".loader") ? 1300 : 150); };
  window.addEventListener("pour:intro", beginIntro);
  if (window.__usStarted) beginIntro();

  function scrollProgress() {
    const r = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: "120px" }).observe(stage);

  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible) return;
    if (!reduce) {
      const intro = introStart === null ? 0 : clamp((now - introStart) / 1600);
      const easedIntro = 1 - Math.pow(1 - intro, 3);
      const q = scrollProgress();
      // hold briefly at both ends, scrub the pour in between
      const s = clamp((q - 0.04) / 0.86);
      target = intro < 1 ? easedIntro * INTRO_END : INTRO_END + s * (SEQ.count - 1 - INTRO_END);
    }
    current += (target - current) * 0.18;
    if (Math.abs(target - current) < 0.01) current = target;
    if (crest) crest.style.opacity = clamp((current / (SEQ.count - 1) - 0.82) / 0.12).toFixed(3);
    draw();
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(tick);
})();
