/* Urban Sky - shared site behaviour */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const root = document.documentElement;
  if (reduce || !hasGsap) root.classList.add("no-motion");
  else root.classList.add("motion");

  /* ---------- section tones: the atmosphere takes the colour of the section in the middle of the screen ---------- */
  const toned = [...document.querySelectorAll("[data-tone]")];
  if (toned.length) {
    let toneTick = false;
    const setTone = () => {
      toneTick = false;
      const mid = window.innerHeight * 0.5;
      let tone = toned[0].dataset.tone;
      // document order, so a group inside a section (Finnland inside Brands) wins while it is in view
      for (const el of toned) if (el.getBoundingClientRect().top <= mid) tone = el.dataset.tone;
      if (root.dataset.tone !== tone) root.dataset.tone = tone;
    };
    window.addEventListener("scroll", () => { if (!toneTick) { toneTick = true; requestAnimationFrame(setTone); } }, { passive: true });
    window.addEventListener("resize", setTone);
    setTone();
  }

  /* ---------- reading line + page veil ---------- */
  if (!reduce) {
    const bar = document.createElement("div");
    bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    let progTick = false;
    const prog = () => {
      progTick = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    window.addEventListener("scroll", () => { if (!progTick) { progTick = true; requestAnimationFrame(prog); } }, { passive: true });
    window.addEventListener("resize", prog);
    prog();

    // moving to another page: the page fades into the night first
    const veil = document.createElement("div");
    veil.className = "veil"; veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.getAttribute("href"), window.location.href);
      if (url.origin !== window.location.origin || url.protocol.indexOf("http") !== 0) return;
      if (url.pathname === window.location.pathname) return; // same-page anchors and the skip link
      e.preventDefault();
      root.classList.add("is-leaving");
      setTimeout(() => { window.location.href = url.href; }, 380);
    });
    window.addEventListener("pageshow", () => root.classList.remove("is-leaving"));
  }

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

  /* ---------- bottle cards: spotlight follows the pointer and the card leans toward it ---------- */
  const tilt = !reduce && window.matchMedia("(hover: hover)").matches;
  document.querySelectorAll(".bottle").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", px * 100 + "%");
      el.style.setProperty("--my", py * 100 + "%");
      if (tilt) {
        el.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - py) * 8).toFixed(2) + "deg");
      }
    });
    if (tilt) el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
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

  // headings rise word by word: each word sits in a clipping span; gold words carry the gold themselves
  function splitWords(el) {
    const words = [];
    const walk = (node, gold) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"), wi = document.createElement("span");
            w.className = "w"; wi.className = gold ? "wi gold-text" : "wi"; wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w); words.push(wi);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          const g = gold || n.classList.contains("gold-text");
          n.classList.remove("gold-text");
          walk(n, g);
        }
      });
    };
    const gold = el.classList.contains("gold-text");
    el.classList.remove("gold-text");
    walk(el, gold);
    return words;
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

    // eyebrows that arrive with the page draw their gold line straight away
    document.querySelectorAll(".eyebrow[data-intro]").forEach((el) => el.classList.add("is-in"));

    // headings rise word by word from behind a mask
    gsap.utils.toArray(".h-serif.reveal, .cta h2.reveal, .band__quote.reveal, .story__copy h3.reveal").forEach((el) => {
      const words = splitWords(el);
      el.classList.remove("reveal");
      gsap.from(words, {
        yPercent: 118, rotate: 3, duration: 1.4, stagger: 0.07, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // story photos open from a narrow window, the picture settles, then the gold frame steps out behind it
    gsap.utils.toArray(".story__fig").forEach((fig) => {
      const media = fig.querySelector(".story__media"), img = media.querySelector("img"), frame = fig.querySelector(".story__frame");
      media.classList.remove("reveal");
      const t = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 82%" } });
      t.fromTo(media, { clipPath: "inset(16% 12% 16% 12%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.out",
        onComplete: () => gsap.set(media, { clearProps: "clipPath" }), // the amber glow can show once it is open
      });
      if (img) t.from(img, { scale: 1.22, duration: 2.2, ease: "expo.out" }, 0);
      if (frame) t.from(frame, { opacity: 0, x: -22, y: -22, duration: 1.4, ease: "expo.out" }, 0.35);
    });

    // wide pictures (the whisky banner, the Goalong range) open the same way
    gsap.utils.toArray(".whisky.reveal, .brands__range.reveal").forEach((el) => {
      el.classList.remove("reveal");
      gsap.fromTo(el, { clipPath: "inset(12% 8% 12% 8%)", opacity: 0.3 }, {
        clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.7, ease: "expo.out", clearProps: "clipPath",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    // the gold line beside each eyebrow draws in as it arrives
    gsap.utils.toArray(".eyebrow.reveal").forEach((el) => ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true, onEnter: () => el.classList.add("is-in"),
    }));

    // everything else marked to reveal rises into place
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.4, ease: "expo.out",
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
    // staggered groups (bottle cards tip up from below); transforms are handed back to CSS afterwards for the tilt
    gsap.utils.toArray("[data-stagger]").forEach((group) => {
      const cards = group.classList.contains("bottles");
      gsap.fromTo(group.children,
        { y: cards ? 90 : 60, rotateX: cards ? 14 : 0, transformPerspective: 900, opacity: 0 },
        {
          y: 0, rotateX: 0, opacity: 1, duration: 1.3, ease: "expo.out", clearProps: "transform,opacity",
          stagger: { each: 0.09, onComplete() { this.targets()[0].classList.add("is-in"); } },
          scrollTrigger: { trigger: group, start: "top 84%" },
        });
    });

    // the brand banner runs faster while the page is moving, then eases back
    const track = document.querySelector(".marquee__track");
    if (track) {
      track.style.animation = "none";
      const loop = gsap.to(track, { xPercent: -50, duration: 34, ease: "none", repeat: -1 });
      let boost = 0;
      ScrollTrigger.create({ onUpdate: (self) => { boost = Math.min(Math.abs(self.getVelocity()) / 400, 4); } });
      gsap.ticker.add(() => {
        boost *= 0.94;
        const ts = loop.timeScale();
        loop.timeScale(ts + (1 + boost - ts) * 0.08);
      });
    }

    // buttons lean toward the pointer
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll(".btn").forEach((b) => {
        const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "expo.out" });
        const yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "expo.out" });
        b.addEventListener("pointermove", (e) => {
          const r = b.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.16);
          yTo((e.clientY - r.top - r.height / 2) * 0.3);
        });
        b.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
      });
    }

    // leaving the first screen: the words drift up and fade while the picture settles back
    const hero = document.querySelector(".hero");
    if (hero) {
      const out = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero__copy", { yPercent: -16, opacity: 0.1, ease: "none", scrollTrigger: out });
      gsap.to(".hero__scene", { scale: 1.06, ease: "none", scrollTrigger: { ...out } });
    }
    gsap.utils.toArray(".phero").forEach((ph) => {
      const w = ph.querySelector(".wrap");
      if (w) gsap.to(w, { yPercent: -24, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ph, start: "top top", end: "bottom top", scrub: true } });
    });
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

  // embers: a slow, subtle burn. Each one glows up, drifts gently upward for most of a minute,
  // breathes slowly and fades out; no per-frame flicker.
  const gate = document.getElementById("gate");
  const ember = sprite("rgba(255,236,190,1)", "rgba(255,120,30,0.75)");
  const emberSoft = sprite("rgba(255,170,90,0.9)", "rgba(220,70,20,0.35)");
  const embers = field(document.querySelector(".gate__embers"), {
    count: small ? 40 : 80, glow: ember, glowBig: emberSoft,
    alive: () => gate && !gate.hidden && getComputedStyle(gate).display !== "none",
    spawn(p, first) {
      p.big = Math.random() < 0.14;               // a few large, out-of-focus embers for depth
      p.x = Math.random() * 1.1 - 0.05;
      p.y = first ? Math.random() * 1.1 : 0.2 + Math.random() * 0.9;
      p.r = p.big ? 16 + Math.random() * 26 : 4 + Math.random() * 8;
      p.vy = (p.big ? 0.00035 : 0.0005) + Math.random() * 0.0006;   // 15-40 s to cross the screen
      p.vx = (Math.random() - 0.4) * 0.00018;                         // the faintest drift, like warm air
      p.o = Math.random() * 6.28;
      p.span = 2700 + Math.random() * 900;        // lifetime in frames (about 45-60 s)
      p.age = first ? Math.random() * p.span : 0;
      p.dead = false; p.a = 0;
      return p;
    },
    step(p, dt, t) {
      p.age += dt;
      p.y -= p.vy * dt;
      p.x += (p.vx + Math.sin(t / 5200 + p.o) * 0.00016) * dt;
      const k = p.age / p.span;
      const envelope = Math.min(1, k / 0.12) * Math.min(1, (1 - k) / 0.25);  // slow glow-up and fade-out
      const breath = 0.72 + Math.sin(t / 1400 + p.o) * 0.28;                // one slow swell every ~9 s
      p.a = Math.max(0, envelope) * breath * (p.big ? 0.4 : 0.9);
      if (k >= 1 || p.y < -0.05) p.dead = true;
    },
  });
  window.__embers = embers;
})();
