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
- `assets/video/` - the pour, colour-graded, 1.5x speed with a fuller glass: `pour-720.mp4` (desktop), `pour-540.mp4` (phones), plus start/end stills
- `assets/vendor/` - GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (kept local so the site runs offline)
- `assets/img/` - site images; each has an `.avif` copy that modern browsers load first, with the `.jpg`/`.png` as fallback

## Age gate
- Shown on every fresh visit and every refresh; skipped only when clicking between pages of the site in the same tab after answering (inline script in each page's `<head>`, answer kept in `sessionStorage`)
- `assets/img/gate-logo.avif` / `.png` - the Urban Sky crest and wordmark from the original site, upscaled 4x, centred above the question
- `assets/video/fire-soft-960.mp4` / `fire-soft-640.mp4` - real flames, blurred and dimmed into soft background firelight, a seamless loop blended with `mix-blend-mode: screen`
- The crest and fire are fetched only when the gate shows; the home pour buffers while the gate is open

## Image and footage credits
- Hero pour: Pexels video 7255224, used under the Pexels licence (free for commercial use, no attribution required).
- Age gate flames: Pexels video 5659678, same licence.
- Bottle and brand imagery: from the original Urban Sky Wix site.
- Home page Goalong splash photo: supplied by Urban Sky; the corner brand text was removed, the image upscaled 4x and the label lettering rebuilt from the same artwork.

## AVIF note
Encode AVIFs only at even pixel sizes: on this Mac's encoder, odd widths or heights produced files that Chrome drew as fully transparent.
- To swap in your own pour footage, export a portrait clip as H.264 MP4 at 720x1280 and 540x960, replace the files in `assets/video/` with the same names, and update the start/end stills.

## Hosting
Netlify deploys every push to `main` automatically. Any static host works; upload the folder as it is.
