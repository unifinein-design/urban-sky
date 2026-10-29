/* Hero pour: real footage that plays once by itself when the visitor arrives.
   Footage: Pexels video 7255224 (Pexels licence, free for commercial use). */
(function () {
  const hero = document.querySelector(".hero");
  const video = document.querySelector(".hero__film");
  if (!hero || !video) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const markFull = () => hero.classList.add("is-full");

  // reduced motion: no playback, just the finished pour
  if (reduce) {
    video.removeAttribute("preload");
    video.poster = video.dataset.endPoster;
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
})();
