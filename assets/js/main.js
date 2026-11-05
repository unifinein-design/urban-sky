/* Urban Sky - shared site behaviour ("Ivory Gallery" motion system)
   Motion vocabulary, used everywhere so the site moves as one piece:
   - words rise out of masks, line by line (expo.out, 1.25 s, 0.1 s between lines)
   - photographs open with a clip-path wipe while the picture settles from a slight scale (power4.inOut 1.5 s / expo.out 2.2 s)
   - supporting text and groups fade up 28 px (power3.out 1.1 s, 0.08-0.1 s stagger)
   - scroll-linked depth: gentle parallax, the photograph bands opening to full bleed, a velocity-aware marquee
   Nothing here runs with prefers-reduced-motion, and without GSAP the page is simply static and complete. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const root = document.documentElement;
  const motion = !reduce && hasGsap && typeof window.ScrollTrigger !== "undefined";
  const small = window.matchMedia("(max-width: 860px)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (motion) window.__usMotion = true;
  else { root.classList.add("no-motion"); root.classList.remove("motion"); }

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
  const hero = document.querySelector(".hero");
  const onScroll = () => {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 40);
    if (hero) hero.classList.toggle("is-past", window.scrollY > 60);
  };
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
    // lerp-based easing tracks the wheel closely, so it feels smooth without lag
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    if (motion) {
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

  /* ---------- warm light that follows the pointer, only over photographs ---------- */
  const cursor = document.querySelector(".cursor");
  if (cursor && motion && fine) {
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.9, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.9, ease: "power3" });
    window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.querySelectorAll("[data-glow]").forEach((el) => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-on"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    });
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

  /* ---------- text splitting (motion only; the words themselves never change) ---------- */
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
      s.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(s);
    }
    return el.querySelectorAll(".char");
  }
  // every word goes into its own mask; inline markup (em, strong, gold spans) is kept around the words
  function maskWords(el) {
    if (el.__words) return el.__words;
    if (el.classList.contains("eyebrow")) {           // the eyebrow is a flex row: keep its words in one item
      const t = document.createElement("span");
      while (el.firstChild) t.appendChild(el.firstChild);
      el.appendChild(t);
    }
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const texts = [];
    let n;
    while ((n = walker.nextNode())) texts.push(n);
    texts.forEach((node) => {
      if (!node.nodeValue.trim()) return;
      const gold = node.parentElement && node.parentElement.closest(".gold-text");
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
        const m = document.createElement("span");
        m.className = "wm";
        const i = document.createElement("span");
        i.className = gold ? "wi gold-text" : "wi";
        i.textContent = part;
        m.appendChild(i);
        frag.appendChild(m);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.querySelectorAll(".gold-text:not(.wi)").forEach((g) => g.classList.remove("gold-text"));
    // group words into their rendered lines, so a heading rises line by line
    const words = [...el.querySelectorAll(".wi")];
    let lastTop = null, line = -1;
    words.forEach((w) => {
      const t = w.parentNode.getBoundingClientRect().top;
      if (lastTop === null || Math.abs(t - lastTop) > 6) { line++; lastTop = t; }
      w.__line = line;
    });
    el.__words = words;
    return words;
  }
  // a timeline that lifts the words of one element out of their masks, line after line
  function riseWords(el, opts) {
    const o = Object.assign({ dur: 1.25, gap: 0.1, ease: "expo.out", tilt: 3 }, opts || {});
    const words = maskWords(el);
    gsap.set(el, { opacity: 1 });
    const tl = gsap.timeline();
    words.forEach((w) => {
      tl.fromTo(w, { yPercent: 118, rotate: o.tilt, transformOrigin: "0% 100%" },
        { yPercent: 0, rotate: 0, duration: o.dur, ease: o.ease }, w.__line * o.gap);
    });
    if (el.classList.contains("eyebrow")) tl.fromTo(el, { "--rule": 0 }, { "--rule": 1, duration: 1.1, ease: "power3.inOut" }, 0);
    return tl;
  }
  const fadeUp = (el, extra) => gsap.fromTo(el, { opacity: 0, y: 28 }, Object.assign({ opacity: 1, y: 0, duration: 1.1, ease: "power3.out" }, extra || {}));
  // a photograph opening: the frame wipes up while the picture inside settles from a slight scale
  function openPhoto(box, pic, extra) {
    const o = Object.assign({ from: "inset(100% 0% 0% 0%)", dur: 1.5, scale: 1.2 }, extra || {});
    const tl = gsap.timeline();
    tl.fromTo(box, { clipPath: o.from }, { clipPath: "inset(0% 0% 0% 0%)", duration: o.dur, ease: "power4.inOut" }, 0);
    // pictures with no other transform hand back to CSS afterwards, so their hover zoom works
    if (pic) tl.fromTo(pic, { scale: o.scale }, Object.assign({ scale: 1, duration: o.dur + 0.8, ease: "expo.out" }, o.keepScale ? {} : { clearProps: "transform" }), 0);
    return tl;
  }
  const onEnter = (trigger, tl, start) => ScrollTrigger.create({ trigger, start: start || "top 88%", once: true, onEnter: () => tl.play() });

  let started = false;
  function start() {
    if (started) return;
    started = true;
    window.__usStarted = true;
    window.dispatchEvent(new Event("pour:intro"));
    if (!motion) return;
    gsap.registerPlugin(ScrollTrigger);
    const handled = new Set();

    /* ===== intro: home ===== */
    if (hero) {
      const media = hero.querySelector(".hero__media");
      const frame = hero.querySelector(".hero__frame");
      const copy = hero.querySelector(".hero__copy");
      const title = hero.querySelector("[data-split]");
      const tl = gsap.timeline({ delay: 0.05 });
      // the photograph is first hung as a framed print on the ivory wall, then opens to full bleed
      tl.fromTo(media, { clipPath: small ? "inset(6% 5% 6% 5%)" : "inset(9% 7% 9% 7%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.9, ease: "power4.inOut" }, 0);
      // slow cinematic push-in towards the glass, over half a minute
      gsap.fromTo(frame, { scale: 1.0 }, { scale: 1.1, duration: 30, ease: "sine.out" });
      if (title) {
        const chars = splitChars(title);
        title.classList.add("is-split");
        tl.set(title, { opacity: 1 }, 0.75)
          .fromTo(chars, { yPercent: 112 }, { yPercent: 0, duration: 1.4, stagger: 0.055, ease: "expo.out" }, 0.75);
      }
      hero.querySelectorAll("[data-intro]").forEach((el) => {
        const at = { hero__welcome: 0.6, hero__sub: 1.15, hero__rule: 1.3, hero__tag: 1.35, hero__cta: 1.65 }[el.classList[0]] || 1.2;
        if (el.classList.contains("hero__rule")) tl.fromTo(el, { opacity: 1, scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: "power3.inOut" }, at);
        else if (el.querySelector(".btn")) tl.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, at);
        else tl.add(riseWords(el, { gap: 0.09 }), at);
      });
      const scrollCue = hero.querySelector(".hero__scroll");
      if (scrollCue) tl.fromTo(scrollCue, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out", clearProps: "opacity" }, 2.0);
      if (nav) tl.fromTo(nav, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", clearProps: "transform,opacity" }, 1.0);

      // a band of light crosses the tumbler, then again every few seconds while the hero is on screen
      const sheen = hero.querySelector(".hero__sheen i");
      if (sheen) {
        const sweep = gsap.timeline({ repeat: -1, repeatDelay: 6.5, delay: 2.1 })
          .fromTo(sheen, { xPercent: -130 }, { xPercent: 330, duration: 2.4, ease: "power2.inOut" });
        ScrollTrigger.create({ trigger: hero, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? sweep.resume() : sweep.pause()) });
      }
      // scroll-linked depth: the photograph sinks slower than the page, the words lift away
      gsap.to(frame, { y: () => media.offsetHeight * 0.26, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
      if (!small) gsap.to(copy, { y: () => -hero.offsetHeight * 0.12, opacity: 0.15, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
    }

    /* ===== intro: inner pages ===== */
    const phero = document.querySelector(".phero");
    if (phero) {
      const tl = gsap.timeline({ delay: 0.05 });
      phero.querySelectorAll("[data-intro]").forEach((el, i) => tl.add(riseWords(el, { dur: 1.35, gap: 0.12 }), 0.1 + i * 0.18));
      tl.add(openPhoto(phero.querySelector(".phero__media"), phero.querySelector(".phero__img"), { dur: 1.7, scale: 1.24, keepScale: true }), 0.35);
    }

    /* ===== section entrances ===== */
    // headings, eyebrows and quotes: masked words, line by line
    gsap.utils.toArray("main .reveal").forEach((el) => {
      if (handled.has(el)) return;
      if (el.matches(".eyebrow, h2, h3, .band__quote")) {
        handled.add(el);
        const tl = riseWords(el).pause();
        onEnter(el, tl);
      }
    });
    // the Goalong splash print: rises with its mat and is never cropped (no clip, no zoom on the photograph)
    document.querySelectorAll(".story__media--still").forEach((el) => {
      handled.add(el);
      const tl = gsap.timeline({ paused: true })
        .fromTo(el, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.6, ease: "expo.out" }, 0)
        .fromTo(el.querySelector(".story__clip"), { scale: 0.94 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0)
        .fromTo(el.querySelector(".story__frame"), { clipPath: "inset(0% 100% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power3.inOut" }, 0.5);
      onEnter(el, tl, "top 85%");
    });
    // other story photographs: clip-path wipe with the picture settling
    document.querySelectorAll(".story__media:not(.story__media--still)").forEach((el) => {
      handled.add(el);
      gsap.set(el, { opacity: 1 });
      const tl = gsap.timeline({ paused: true })
        .add(openPhoto(el.querySelector(".story__clip"), el.querySelector(".story__clip img"), { keepScale: true }), 0)
        .fromTo(el.querySelector(".story__frame"), { clipPath: "inset(0% 100% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power3.inOut" }, 0.6);
      onEnter(el, tl, "top 85%");
    });
    // the Goalong range: rises onto its floor, then floats gently (only while on screen)
    document.querySelectorAll(".brands__range").forEach((el) => {
      handled.add(el);
      const img = el.querySelector("img");
      const tl = gsap.timeline({ paused: true })
        .fromTo(el, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1.6, ease: "expo.out" }, 0)
        .fromTo(img, { scale: 0.95 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0)
        .fromTo(el.querySelector(".brands__floor"), { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: "power3.inOut" }, 0.3);
      onEnter(el, tl);
      const float = gsap.to(img, { y: -12, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true });
      ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? float.play() : float.pause()) });
    });
    // the Royal Carlston banner: the frame rises, the photograph wipes across
    document.querySelectorAll(".whisky").forEach((el) => {
      handled.add(el);
      const tl = gsap.timeline({ paused: true })
        .fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, 0)
        .add(openPhoto(el.querySelector(".whisky__img"), el.querySelector(".whisky__img img"), { from: "inset(0% 100% 0% 0%)", dur: 1.6, scale: 1.15 }), 0.15);
      onEnter(el, tl);
    });
    // crests and logos
    gsap.utils.toArray("main img.reveal").forEach((el) => {
      handled.add(el);
      onEnter(el, gsap.fromTo(el, { opacity: 0, y: 26, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: "expo.out", paused: true }));
    });
    // everything else marked to reveal: a quiet fade up
    gsap.utils.toArray("main .reveal").forEach((el) => {
      if (handled.has(el)) return;
      onEnter(el, fadeUp(el, { paused: true }));
    });

    // vision and mission prints: photograph opens, then the caption follows
    document.querySelectorAll(".vm__card").forEach((card, i) => {
      const tl = gsap.timeline({ paused: true, delay: small ? 0 : i * 0.14 })
        .add(openPhoto(card.querySelector(".vm__media"), card.querySelector(".vm__media img")), 0)
        .fromTo(card.querySelector(".vm__num"), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.1, ease: "back.out(1.6)" }, 0.7)
        .add(riseWords(card.querySelector("h3")), 0.75)
        .add(fadeUp(card.querySelector("p")), 0.95);
      onEnter(card, tl, "top 86%");
    });
    // the three story notes, the bottles and the contact lines: staggered entrances
    document.querySelectorAll(".story__stats").forEach((g) => {
      const items = g.children;
      const tl = gsap.timeline({ paused: true })
        .fromTo(items, { "--rule": 0 }, { "--rule": 1, duration: 1.2, stagger: 0.12, ease: "power3.inOut" }, 0)
        .fromTo(items, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: "power3.out" }, 0.15);
      onEnter(g, tl);
    });
    document.querySelectorAll(".bottles").forEach((g) => {
      const cards = g.querySelectorAll(".bottle");
      const tl = gsap.timeline({ paused: true })
        .fromTo(cards, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.09, ease: "expo.out" }, 0)
        .fromTo(g.querySelectorAll(".bottle img"), { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, stagger: 0.09, ease: "expo.out" }, 0.2);
      onEnter(g, tl);
    });
    document.querySelectorAll(".contact__lines").forEach((g) => {
      onEnter(g, gsap.fromTo(g.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", paused: true }));
    });

    // call to action photograph opens beside the words
    document.querySelectorAll(".contact__media").forEach((el) => {
      onEnter(el, openPhoto(el, el.querySelector(".contact__bg"), { dur: 1.7, keepScale: true }).pause(), "top 80%");
    });

    /* ===== scroll-linked depth ===== */
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const amt = (parseFloat(el.dataset.parallax) || 12) * (small ? 0.6 : 1);
      const box = el.closest(".phero__media, .contact__media, .story__clip") || el.parentElement;
      gsap.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    // photograph bands hang inset like prints, then open to full bleed as they rise (desktop)
    document.querySelectorAll(".band").forEach((band) => {
      const inner = band.querySelector(".band__inner");
      if (!small) {
        gsap.fromTo(band, { clipPath: "inset(9% 7% 9% 7%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none",
          scrollTrigger: { trigger: band, start: "top bottom", end: "top 10%", scrub: 0.6 } });
        gsap.fromTo(inner, { y: 60 }, { y: -60, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
      }
    });
    // the story print drifts a little against its text (desktop)
    if (!small) document.querySelectorAll(".story__media").forEach((el) => {
      gsap.fromTo(el.querySelector(".story__clip"), { y: 36 }, { y: -36, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
    // marquee: runs with the reader, speeding up with the scroll and turning when they scroll back
    const track = document.querySelector(".marquee__track");
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
      loop.totalTime(38 * 50);                     // far from zero, so it can also run backwards
      let dir = 1;
      ScrollTrigger.create({
        trigger: ".marquee", start: "top bottom", end: "bottom top",
        onToggle: (s) => (s.isActive ? loop.resume() : loop.pause()),
        onUpdate: (s) => {
          dir = s.direction;
          const boost = Math.min(Math.abs(s.getVelocity()) / 320, 5);
          gsap.to(loop, { timeScale: dir * (1 + boost), duration: 0.3, overwrite: true,
            onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.4, ease: "power2.out", overwrite: true }) });
        },
      });
    }
    // reading progress: a gold hairline along the bottom of the bar
    if (nav) {
      const bar = document.createElement("span");
      bar.className = "nav__progress";
      bar.setAttribute("aria-hidden", "true");
      nav.appendChild(bar);
      const setP = gsap.quickSetter(bar, "scaleX");
      ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => setP(s.progress) });
    }

    /* ===== pointer details (mouse and trackpad only) ===== */
    if (fine) {
      // magnetic buttons: they lean towards the pointer and settle back when it leaves
      document.querySelectorAll("main .btn, .nav .btn, .footer .to-top").forEach((b) => {
        const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
        b.addEventListener("pointermove", (e) => {
          const r = b.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
        });
        b.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
      });
      // bottle cards tilt a few degrees under the pointer; the bottle lifts
      document.querySelectorAll(".bottle").forEach((card) => {
        const img = card.querySelector("img");
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.8, ease: "power3" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.8, ease: "power3" });
        const lift = gsap.quickTo(img, "y", { duration: 0.8, ease: "power3" });
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          ry(px * 7); rx(-py * 6); lift(-10);
        });
        card.addEventListener("pointerleave", () => { rx(0); ry(0); lift(0); });
      });
    }

    /* ===== page change: an ivory veil draws up before the next page ===== */
    const veil = document.createElement("div");
    veil.className = "veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      if (nav) nav.classList.remove("is-open");
      gsap.fromTo(veil, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.inOut", onComplete: () => { window.location.href = url.href; } });
    });
    window.addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(veil, { clipPath: "inset(100% 0% 0% 0%)" }); });

    // pictures that arrive late change the page height; keep every trigger honest
    window.addEventListener("load", () => ScrollTrigger.refresh());
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

  // gold dust: slow, soft, drifting upward through the hero photograph
  const gold = sprite("rgba(255,242,206,1)", "rgba(236,196,118,0.55)");
  field(document.querySelector(".hero__dust"), {
    count: small ? 22 : 46, glow: gold, glowBig: gold,
    spawn(p, first) {
      p.x = Math.random(); p.y = first ? Math.random() : 1.03;
      p.r = 2.5 + Math.random() * 4.5; p.s = 0.00022 + Math.random() * 0.0005;
      p.o = Math.random() * 6.28; p.dead = false; p.a = 0;
      return p;
    },
    step(p, dt, t) {
      p.y -= p.s * dt;
      p.x += Math.sin(t / 3800 + p.o) * 0.00012 * dt;
      p.a = 0.16 + (Math.sin(t / 900 + p.o) + 1) * 0.18;
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
