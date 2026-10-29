# Urban Sky Holdings - website v1

A static rebuild of the Urban Sky Wix site with a premium redesign. No build step, no Wix.

## Pages
- `index.html` - home, with the pour film that plays by itself on arrival
- `about.html` - story, vision, mission
- `brands.html` - Goalong Liquor and the bottle collection
- `contact.html` - contact details and an enquiry form (opens the visitor's email app)

## Run it locally
```bash
python3 -m http.server 4500
```
Then open http://localhost:4500

## Structure
- `assets/css/style.css` - all styling (colour tokens at the top)
- `assets/js/main.js` - age gate, nav, smooth scroll, reveals, parallax, gold dust and gate embers
- `assets/js/pour-video.js` - starts the hero pour once the visitor is in (after the age gate on a first visit)
- `assets/video/` - the pour, colour-graded: `pour-720.mp4` (desktop), `pour-540.mp4` (phones), plus start/end stills
- `assets/vendor/` - GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (kept local so the site runs offline)
- `assets/img/` - site images; each has an `.avif` copy that modern browsers load first, with the `.jpg`/`.png` as fallback

## Age gate
- `assets/img/gate-bottle.avif` / `.png` - the Goalong Special bottle from the original site, upscaled 4x and relit for firelight (warm grade, rim light, clean base)
- `assets/video/fire-720.mp4` / `fire-480.mp4` - real flames, a seamless 10.5s loop (last second cross-dissolved into the first), blended with `mix-blend-mode: screen`
- Only first-time visitors download these; returning visitors skip the gate entirely

## Image and footage credits
- Hero pour: Pexels video 7255224, used under the Pexels licence (free for commercial use, no attribution required).
- Age gate flames: Pexels video 5659678, same licence.
- Bottle and brand imagery: from the original Urban Sky Wix site.

## AVIF note
Encode AVIFs only at even pixel sizes: on this Mac's encoder, odd widths or heights produced files that Chrome drew as fully transparent.
- To swap in your own pour footage, export a portrait clip as H.264 MP4 at 720x1280 and 540x960, replace the files in `assets/video/` with the same names, and update the start/end stills.

## Hosting
Netlify deploys every push to `main` automatically. Any static host works; upload the folder as it is.
