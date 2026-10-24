/* Urban Sky - shared site behaviour */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const root = document.documentElement;
  if (reduce || !hasGsap) root.classList.add("no-motion");

  /* ---------- age gate ---------- */
  const gate = document.getElementById("gate");
  let verified = false;
  try { verified = localStorage.getItem("us-age-ok") === "1"; } catch (e) {}
  if (gate) {
    if (verified) gate.hidden = true;
    gate.querySelector("[data-yes]").addEventListener("click", () => {
      try { localStorage.setItem("us-age-ok", "1"); } catch (e) {}
      if (hasGsap && !reduce) {
        gsap.to(gate, { opacity: 0, duration: 0.8, ease: "power2.inOut", onComplete: () => { gate.hidden = true; start(); } });
      } else { gate.hidden = true; start(); }
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
    lenis = new Lenis({ duration: 1.25, smoothWheel: true });
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

/* gold dust drifting across the hero */
(function () {
  const c = document.querySelector(".hero__dust");
  if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = c.getContext("2d");
  let w, h, dpr;
  const motes = [];
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);
  for (let i = 0; i < 70; i++) {
    motes.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.3, s: Math.random() * 0.00025 + 0.00006, o: Math.random() * Math.PI * 2 });
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.y -= m.s * 16;
      if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      const x = (m.x + Math.sin(t / 4000 + m.o) * 0.012) * w;
      const a = 0.25 + Math.sin(t / 900 + m.o) * 0.25 + 0.25;
      ctx.beginPath();
      ctx.arc(x, m.y * h, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(233, 205, 140, ${a.toFixed(3)})`;
      ctx.shadowColor = "rgba(233, 190, 110, 0.9)";
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
