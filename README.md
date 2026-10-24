# Urban Sky Holdings - website v1

A static rebuild of the Urban Sky Wix site with a premium redesign. No build step, no Wix.

## Pages
- `index.html` - home, with the scroll-driven bottle pour hero
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
- `assets/js/main.js` - age gate, nav, smooth scroll, reveals, parallax, gold dust
- `assets/js/pour-film.js` - the hero pour: real footage drawn frame by frame as you scroll
- `assets/pour/` - 150 desktop frames (720x1280); `assets/pour/m/` - 75 lighter frames for phones
- `assets/vendor/` - GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (kept local so the site runs offline)
- `assets/img/` - images taken from the Wix site

## Footage credit
The hero pour is Pexels video 7255224, used under the Pexels licence (free for commercial use, no attribution required).
To swap in your own shoot, export a portrait clip as numbered JPGs (`000.jpg`, `001.jpg`, ...) into `assets/pour/` and `assets/pour/m/`, then update the frame counts at the top of `pour-film.js`.

## Hosting
Any static host works (GitHub Pages, Netlify, Cloudflare Pages, Vercel). Upload the folder as it is.
