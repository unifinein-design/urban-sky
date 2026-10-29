/* Urban Sky - shared site behaviour */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const root = document.documentElement;
  if (reduce || !hasGsap) root.classList.add("no-motion");

  /* ---------- age gate ---------- */
  const gate = document.getElementById("gate");
  // the inline head script decides whether the check is skipped (only between pages of this site, same tab)
  const verified = root.classList.contains("age-ok");
  try { localStorage.removeItem("us-age-ok"); } catch (e) {} // older builds remembered the answer forever
  // live flames behind the bottle: only fetched and played while the gate is on screen
  const fire = gate && gate.querySelector(".gate__fire");
  function startFire() {
    if (!fire || reduce) return;
    fire.addEventListener("playing", () => {
      gate.classList.add("fire-on");
      window.dispatchEvent(new Event("gate:ready"));
    }, { once: true });
    fire.preload = "auto";
    const p = fire.play();
    if (p && p.catch) p.catch(() => {}); // autoplay refused: the glow and embers still carry the scene
  }
  function stopFire() {
    if (!fire) return;
    fire.pause();
    fire.querySelectorAll("source").forEach((s) => s.remove());
    fire.removeAttribute("src");
    fire.load(); // releases the decoder and the buffered video
  }
  const closeGate = () => { gate.hidden = true; stopFire(); start(); };

  if (gate) {
    if (verified) { gate.hidden = true; stopFire(); }
    else startFire();
    gate.querySelector("[data-yes]").addEventListener("click", () => {
      try { sessionStorage.setItem("us-age-ok", "1"); } catch (e) {}
      if (hasGsap && !reduce) {
        gsap.to(gate, { opacity: 0, duration: 0.8, ease: "power2.inOut", onComplete: closeGate });
      } else closeGate();
    });
    gate.querySelector("[data-no]").addEventListener("click", () => {
      gate.querySelector(".note").textContent = "Sorry, you must be of legal drinking age to enter.";
    });
  }

  /* ---------- nav ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const toggle = document.querySelector(".nav__toggle");
  if (toggle) toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });

  /* ---------- smooth scroll ---------- */
  let lenis;
  if (!reduce && window.Lenis) {
    // lerp-based easing tracks the wheel more closely than a long fixed duration, so it feels smooth without lag
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------- back to top ---------- */
  document.querySelectorAll("[data-top]").forEach((b) => b.addEventListener("click", () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }));

  /* ---------- cursor glow ---------- */
  const cursor = document.querySelector(".cursor");
  if (cursor && hasGsap && !reduce) {
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.8, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.8, ease: "power3" });
    window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); });
  }

  /* ---------- bottle card spotlight ---------- */
  document.querySelectorAll(".bottle").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ---------- contact form -> email ---------- */
  const form = document.querySelector("[data-enquiry]");
  if (form) {
    const messages = { name: "Please enter your name.", message: "Please tell us how we can help." };
    // validate on blur, not on every keystroke; error text sits under the field
    const check = (input) => {
      const field = input.closest(".field");
      const err = field && field.querySelector(".field__error");
      const bad = input.required && !input.value.trim();
      if (field) field.classList.toggle("is-invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      if (err) err.textContent = bad ? messages[input.name] || "This field is required." : "";
      return !bad;
    };
    form.querySelectorAll("[required]").forEach((input) => {
      input.addEventListener("blur", () => check(input));
      input.addEventListener("input", () => { if (input.closest(".field").classList.contains("is-invalid")) check(input); });
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalid = [...form.querySelectorAll("[required]")].filter((input) => !check(input));
      const status = form.querySelector(".form__status");
      if (invalid.length) {
        invalid[0].focus();
        if (status) status.textContent = "";
        return;
      }
      const f = new FormData(form);
      const body = `Name: ${f.get("name")}\nCompany: ${f.get("company") || "-"}\nPhone: ${f.get("phone") || "-"}\n\n${f.get("message")}`;
      if (status) status.textContent = "Opening your email app with your enquiry. Press send there to reach us.";
      window.location.href = `mailto:urbanskylk@gmail.com?subject=${encodeURIComponent("Website enquiry - " + f.get("name"))}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ---------- page intro + scroll animations ---------- */
  function splitChars(el) {
    const text = el.textContent;
    // transformed children drop out of a parent's background-clip:text, so each char carries the gold itself
    const gold = el.classList.contains("gold-text");
    el.classList.remove("gold-text");
    el.textContent = "";
    el.setAttribute("aria-label", text);
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = gold ? "char gold-text" : "char";
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
    }
    return el.querySelectorAll(".char");
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    window.__usStarted = true;
    window.dispatchEvent(new Event("pour:intro"));
    if (!hasGsap || reduce) return;
    gsap.registerPlugin(ScrollTrigger);

    const loader = document.querySelector(".loader");
    const tl = gsap.timeline();
    if (loader) {
      tl.to(".loader__crest", { opacity: 1, duration: 0.6, ease: "power2.out" })
        .to(".loader__bar i", { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, "<")
        .to(loader, { yPercent: -100, duration: 1, ease: "expo.inOut" }, "+=0.1")
        .set(loader, { display: "none" });
    }

    const title = document.querySelector("[data-split]");
    if (title) {
      const chars = splitChars(title);
      tl.from(chars, { yPercent: 110, opacity: 0, rotateX: -80, stagger: 0.045, duration: 1.1, ease: "expo.out" }, loader ? "-=0.45" : 0);
    }
    tl.from("[data-intro]", { y: 30, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out" }, "-=0.8");

    // reveals
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });
    // parallax images
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    // staggered groups
    gsap.utils.toArray("[data-stagger]").forEach((group) => {
      gsap.from(group.children, {
        y: 60, opacity: 0, duration: 1.1, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: group, start: "top 82%" },
      });
    });
    // hero copy drifts and fades as the pour finishes
    if (document.querySelector(".hero__copy")) {
      gsap.to(".hero__scroll", { opacity: 0, scrollTrigger: { trigger: ".hero", start: "top top", end: "8% top", scrub: true } });
    }
    // floating range shot
    if (document.querySelector(".brands__range img")) {
      gsap.to(".brands__range img", { y: -14, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
  }

  if (!gate || gate.hidden) start();
})();

/* glowing particles: gold dust over the hero, fire embers over the age gate.
   Each glow is drawn once to a small sprite and stamped, instead of a per-particle shadowBlur,
   and a field only animates while it is on screen. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const small = window.matchMedia("(max-width: 860px)").matches;

  function sprite(inner, outer) {
    const s = document.createElement("canvas");
    s.width = s.height = 64;
    const g = s.getContext("2d");
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, inner);
    r.addColorStop(0.22, outer);
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return s;
  }

  function field(canvas, opts) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const parts = [];
    let w = 0, h = 0, raf = 0, last = 0, onScreen = true;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    for (let i = 0; i < opts.count; i++) parts.push(opts.spawn({}, true));
    function frame(t) {
      raf = 0;
      if (!onScreen || (opts.alive && !opts.alive())) return;
      const dt = Math.min(48, t - (last || t)) / 16.67;
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        opts.step(p, dt, t);
        if (p.dead) opts.spawn(p, false);
        ctx.globalAlpha = p.a;
        const d = p.r * 2;
        ctx.drawImage(p.big ? opts.glowBig : opts.glow, p.x * w - d / 2, p.y * h - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    const run = () => { if (!raf && onScreen) { last = 0; raf = requestAnimationFrame(frame); } };
    new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; run(); }).observe(canvas);
    window.addEventListener("resize", size);
    size();
    run();
    return { run };
  }

  // gold dust: slow, soft, drifting upward through the hero
  const gold = sprite("rgba(255,240,200,1)", "rgba(233,190,110,0.55)");
  field(document.querySelector(".hero__dust"), {
    count: small ? 34 : 60, glow: gold, glowBig: gold,
    spawn(p, first) {
      p.x = Math.random(); p.y = first ? Math.random() : 1.03;
      p.r = 3 + Math.random() * 5; p.s = 0.00025 + Math.random() * 0.0006;
      p.o = Math.random() * 6.28; p.dead = false; p.a = 0;
      return p;
    },
    step(p, dt, t) {
      p.y -= p.s * dt;
      p.x += Math.sin(t / 3800 + p.o) * 0.00012 * dt;
      p.a = 0.18 + (Math.sin(t / 900 + p.o) + 1) * 0.2;
      if (p.y < -0.03) p.dead = true;
    },
  });

  // embers: hot sparks rising from the bottom, swaying and flickering out
  const gate = document.getElementById("gate");
  const ember = sprite("rgba(255,236,190,1)", "rgba(255,120,30,0.75)");
  const emberSoft = sprite("rgba(255,170,90,0.9)", "rgba(220,70,20,0.35)");
  const embers = field(document.querySelector(".gate__embers"), {
    count: small ? 60 : 120, glow: ember, glowBig: emberSoft,
    alive: () => gate && !gate.hidden && getComputedStyle(gate).display !== "none",
    spawn(p, first) {
      p.big = Math.random() < 0.14;               // a few large, out-of-focus embers for depth
      p.x = Math.random() * 1.1 - 0.05;
      p.y = first ? Math.random() * 1.1 : 1.05 + Math.random() * 0.1;
      p.r = p.big ? 16 + Math.random() * 26 : 4 + Math.random() * 8;
      p.vy = (p.big ? 0.0012 : 0.0022) + Math.random() * 0.0035;
      p.vx = (Math.random() - 0.35) * 0.0009;      // slight drift to the right, like heat on air
      p.o = Math.random() * 6.28; p.life = 0.55 + Math.random() * 0.45; p.dead = false; p.a = 0;
      return p;
    },
    step(p, dt, t) {
      p.y -= p.vy * dt;
      p.x += (p.vx + Math.sin(t / 700 + p.o) * 0.0007) * dt;
      p.life -= 0.0016 * dt;
      const flicker = 0.65 + Math.sin(t / 90 + p.o * 7) * 0.2 + Math.random() * 0.15;
      p.a = Math.max(0, Math.min(1, p.life * 1.6)) * flicker * (p.big ? 0.45 : 1);
      if (p.life <= 0 || p.y < -0.05) p.dead = true;
    },
  });
  window.__embers = embers;
})();
