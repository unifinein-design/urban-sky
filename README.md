# Urban Sky Holdings - website v1

A static rebuild of the Urban Sky Wix site with a premium redesign. No build step, no Wix.

## Pages
- `index.html` - home, with the whisky pour that plays by itself on arrival
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
- `assets/img/wix-scene-*` - the hero photo: the Wix site's own whisky glass scene, full width behind the title (1600 and 2880 px)
- `assets/video/pour-wix-*` - the pour that plays over the right-hand part of that photo: `pour-wix-1260.mp4` (screens at 1.2x density or more, or 1400 px and wider), `pour-wix-840.mp4` (everything else), `pour-wix-mask.png` (feathered edge so only the pour area replaces the photo) and `pour-wix-end.jpg` (the finished pour, used for reduced motion)
- `assets/vendor/` - GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (kept local so the site runs offline)
- `assets/img/` - site images; each has an `.avif` copy that modern browsers load first, with the `.jpg`/`.png` as fallback

## Age gate
- Shown on every fresh visit and every refresh; skipped only when clicking between pages of the site in the same tab after answering (inline script in each page's `<head>`, answer kept in `sessionStorage`)
- `assets/img/gate-logo.avif` / `.png` - the Urban Sky crest and wordmark from the original site, upscaled 4x, centred above the question
- `assets/video/fire-soft-960.mp4` / `fire-soft-640.mp4` - real flames, blurred and dimmed into soft background firelight, a seamless loop blended with `mix-blend-mode: screen`
- The crest and fire are fetched only when the gate shows; the home pour buffers while the gate is open

## Image and footage credits
- Hero photo: the whisky glass scene from the original Urban Sky Wix site.
- Hero pour: AI video made from that same photo with the open Wan 2.2 image-to-video model (Apache 2.0), then blended back into the full-resolution photo so everything outside the pour stays the original.
- Age gate flames: Pexels video 5659678, used under the Pexels licence (free for commercial use, no attribution required).
- Bottle and brand imagery: from the original Urban Sky Wix site.
- Goalong range lineup: from the full-size Wix original, JPEG blocking cleaned, upscaled 4x with Real-ESRGAN and blended so no label lettering is changed; served at 2000 and 1200 px.
- Goalong splash photo (kept in `assets/img/goalong-splash.*`, not shown on the site since the Our Story photo changed): supplied by Urban Sky; the corner brand text was removed, the image upscaled 4x and the label lettering rebuilt from the same artwork.
- Our Story photo (`story-range`), the Finnland arrack range photo (`finnland-range`), the Finnland Distilleries logo and the single-bottle photos: supplied by Urban Sky. The bottles (`bottle-finsbury`, `bottle-don-rocket`, `bottle-cagura`, `bottle-soora-750`, `bottle-soora-180`, `bottle-special-arrack`, `bottle-green-apple`, `bottle-best-value`, and `bottle-arjuna-kencana`, three bottles lifted separately and lined up on one base) were cut out of their photos with macOS subject lifting (Vision), the logo lifted off its navy background, all served at even pixel sizes with AVIF copies.

## AVIF note
Encode AVIFs only at even pixel sizes: on this Mac's encoder, odd widths or heights produced files that Chrome drew as fully transparent.

## Hosting
Netlify deploys every push to `main` automatically. Any static host works; upload the folder as it is.
