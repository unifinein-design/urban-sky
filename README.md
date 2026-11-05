# Urban Sky Holdings - website v1

A static rebuild of the Urban Sky Wix site with a premium redesign. No build step, no Wix.

## Pages
- `index.html` - home, with a real whisky pour as the hero video (plays once on arrival and holds the full glass)
- `about.html` - story, vision, mission
- `brands.html` - Goalong Liquor and the bottle collection
- `contact.html` - contact details and an enquiry form (opens the visitor's email app)

## Run it locally
```bash
python3 -m http.server 4500
```
Then open http://localhost:4500

## Structure
- `assets/css/style.css` - all styling (colour tokens at the top; "Cellar Light" theme: the original dark gold palette lifted to a warm espresso, with a texture tile blended into every surface; the age gate keeps its own dark tokens)
- `assets/js/main.js` - age gate, nav, smooth scroll, the motion system (text reveals, photo wipes, parallax, page veil), gold dust and gate embers
- `assets/js/pour-video.js` - the hero pour: plays once by itself after the age gate (never tied to scroll), holds the last frame, shows the full glass for reduced motion or if autoplay is refused
- `assets/video/` - the age gate's soft firelight loops, and the hero pour at 540, 720 and 1080 px wide (3:4) with first-frame and last-frame posters (AVIF, with JPEG fallback)
- `assets/vendor/` - GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (kept local so the site runs offline)
- `assets/img/` - site images; each has an `.avif` copy that modern browsers load first, with the `.jpg`/`.png` as fallback
- `assets/img/texture.*` - the seamless surface texture (1024 px tile, generated, blended with `background-blend-mode: overlay`)
- `assets/img/pour-glow.*` - the light pool behind the hero film: the last frame's edges carried outward and blurred, so the film melts into the page

## Age gate
- Shown on every fresh visit and every refresh; skipped only when clicking between pages of the site in the same tab after answering (inline script in each page's `<head>`, answer kept in `sessionStorage`)
- `assets/img/gate-logo.avif` / `.png` - the Urban Sky crest and wordmark from the original site, upscaled 4x, centred above the question
- `assets/video/fire-soft-960.mp4` / `fire-soft-640.mp4` - real flames, blurred and dimmed into soft background firelight, a seamless loop blended with `mix-blend-mode: screen`
- The crest and fire are fetched only when the gate shows

## Image and footage credits
- Hero pour: Pexels video 11590175 by Paul, used under the Pexels licence (free for commercial use, no attribution required); cropped, sped up 1.5x and colour graded (warm sand backdrop, deeper amber whisky, departing hand cleaned from the final frame).
- Champagne photograph: from the original Urban Sky Wix site, graded brighter.
- Age gate flames: Pexels video 5659678, used under the Pexels licence (free for commercial use, no attribution required).
- Bottle and brand imagery: from the original Urban Sky Wix site.
- Goalong range lineup: from the full-size Wix original, JPEG blocking cleaned, upscaled 4x with Real-ESRGAN and blended so no label lettering is changed; served at 2000 and 1200 px.
- Home page Goalong splash photo: supplied by Urban Sky; the corner brand text was removed, the image upscaled 4x and the label lettering rebuilt from the same artwork.

## AVIF note
Encode AVIFs only at even pixel sizes: on this Mac's encoder, odd widths or heights produced files that Chrome drew as fully transparent.

## Hosting
Netlify deploys every push to `main` automatically. Any static host works; upload the folder as it is.
