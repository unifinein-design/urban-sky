/* Hero pour: a short clip that plays once by itself when the visitor arrives.
   Footage: AI pour (Wan 2.2) made from the Wix hero photo, blended back into that photo. */
(function () {
  const hero = document.querySelector(".hero");
  const video = document.querySelector(".hero__film");
  if (!hero || !video) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const markFull = () => hero.classList.add("is-full");

  // browsers without container units show the still photo only (see the @supports rule), so never fetch the clip
  if (!(window.CSS && CSS.supports && CSS.supports("width", "1cqw"))) { markFull(); return; }

  // reduced motion: no playback, just the finished pour
  if (reduce) {
    video.poster = video.dataset.endPoster; // preload stays "none", so the clip itself is never downloaded
    markFull();
    return;
  }

  // the crest fades in as the glass fills; the last frame stays on screen
  video.addEventListener("timeupdate", () => {
    if (video.duration && video.currentTime / video.duration > 0.86) markFull();
  });
  video.addEventListener("ended", markFull);

  let started = false;
  function play() {
    if (started) return;
    started = true;
    video.muted = true; // required for autoplay
    const attempt = video.play();
    // if the browser still refuses (e.g. low power mode), show the full glass instead of a stalled first frame
    if (attempt && attempt.catch) attempt.catch(() => { video.poster = video.dataset.endPoster; markFull(); });
  }

  // first visits wait for the age gate so the pour starts in view; returning visitors start straight away
  window.addEventListener("pour:intro", play);
  if (window.__usStarted) play();
  // while the gate is up, buffer the pour once the gate's own fire is playing, so the two don't compete
  window.addEventListener("gate:ready", () => {
    if (started || video.readyState > 2) return;
    video.preload = "auto";
    video.load();
  }, { once: true });
})();
