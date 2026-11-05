/* Hero pour: real footage that plays once by itself when the visitor arrives, then holds the full glass.
   It is never tied to scroll. Footage: Pexels video 11590175 by Paul (Pexels licence, free for
   commercial use); trimmed, sped up 1.5x and colour graded.
   The poster and data-end-poster are set by the inline script beside the <video>, at the size the browser picks. */
(function () {
  const hero = document.querySelector(".hero");
  const video = document.querySelector(".hero__film");
  if (!hero || !video) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const endPoster = () => video.getAttribute("data-end-poster");
  const markFull = () => hero.classList.add("is-full");

  // reduced motion: no playback, just the finished pour
  if (reduce) {
    video.preload = "none";
    if (video.getAttribute("poster") !== endPoster()) video.poster = endPoster();
    markFull();
    return;
  }

  // show the full glass instead of a stalled first frame (autoplay refused, e.g. low power mode)
  function showEnd() {
    video.poster = endPoster();
    markFull();
    const toEnd = () => { if (isFinite(video.duration)) video.currentTime = Math.max(0, video.duration - 0.05); };
    if (video.readyState >= 1) toEnd();
    else video.addEventListener("loadedmetadata", toEnd, { once: true });
  }

  // the last frame stays on screen (no loop)
  video.addEventListener("ended", markFull);

  let started = false;
  function play() {
    if (started) return;
    started = true;
    video.muted = true; // required for autoplay
    const attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(showEnd);
  }

  // first visits wait for the age gate so the pour starts in view; returning visitors start straight away.
  // A short beat lets the pool of light fade most of the way up before the decanter tilts.
  const BEAT = 500;
  const cue = () => setTimeout(play, BEAT);
  window.addEventListener("pour:intro", cue, { once: true });
  if (window.__usStarted) cue();
  // safety net: if main.js never ran (so nothing will signal the intro) but the visitor has already answered
  // the age check, play anyway, or show the full glass if playback is refused
  setTimeout(() => {
    if (!started && !window.__usStarted && document.documentElement.classList.contains("age-ok")) {
      video.preload = "auto";
      play();
    }
  }, 3500);
  // nothing is fetched until it is needed (preload="none" in the page). While the gate is up, the pour starts
  // buffering once the gate's own fire is playing, so the two don't compete for the connection.
  window.addEventListener("gate:ready", () => {
    if (started || video.readyState > 2) return;
    video.preload = "auto";
  }, { once: true });
})();
