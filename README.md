# Bhavna J- My Portfolio

Next.js (App Router) · React 19 · TypeScript · Three.js / React Three Fiber / Drei · Motion for React · react-pageflip · Lucide.

The hanging ID badge is built entirely in code — an extruded acrylic shell with a real slot cut through it, a printed insert (front and back inside the same body), a metal clip and a ribbon lanyard that twists when the badge turns. No Spline, no paid 3D services, no HDR downloads.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
```

Node 18.18+ (Node 20 or 22 recommended).

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com → **Add New… → Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected). No environment variables are needed.
4. **Deploy.**

Or from the terminal: `npm i -g vercel && vercel` (then `vercel --prod`).

The page is statically generated, so after changing any file in `public/` (e.g. adding your resume) just push / redeploy.

## Where to edit things

All personal content lives in `src/data/` — you shouldn't need to touch components.

| What | Where |
|---|---|
| Badge front text, back text, portrait path & crop | `src/data/portfolio.ts` → `badge` |
| Floating hero labels (DESIGNER, DEVELOPER, …) | `src/data/portfolio.ts` → `heroRoles` |
| About text, Skills, Hobbies, Resume, Contact, nav | `src/data/portfolio.ts` |
| Projects (8 entries) + case studies | `src/data/projects.ts` |
| Achievements flipbook pages | `src/data/achievements.ts` |

### Replace the portrait
Overwrite `public/images/portrait.jpg` (used on the badge and in About). If the face sits differently in a new photo, tweak `badge.portraitFocus` (`x`, `y` are 0–1 fractions of the image; `zoom` > 1 crops tighter).

### Project images
Put screenshots in `public/projects/` and set `thumbnail: "/projects/name.jpg"` on the project (16:10, ~1600×1000). Until then each project shows a generated typographic cover. Add `role`, `stack`, `demoUrl`, `repoUrl` and `caseStudy` fields as you write them — empty fields are hidden. Set `externalUrl` to make a card open a site instead of the case-study view.

### Achievements flipbook
Export your Canva pages as PNGs and overwrite the placeholders in `public/achievements/` (`cover.png`, `page-01.png` … `page-04.png`, `back-cover.png`). All pages should share one aspect ratio — set it in `pageAspect` (width ÷ height). Set `turnDirection` to `"right-to-left"` (the default) or `"left-to-right"` to match the booklet. Add or remove pages in the `pages` list; an even total gives clean spreads. For a downloadable version set `pdf: "/achievements/achievements.pdf"` and add that file.

### Resume
Add `public/resume.pdf` and redeploy. The View / Download buttons and the Contact link are switched off (shown as "coming soon") until the file exists — this is checked at build time.

### LinkedIn
Set `contact.linkedin` in `src/data/portfolio.ts` to your profile URL. While empty it shows "Profile link coming soon" and isn't clickable.

### Hobbies
The three hobby entries are marked placeholders. Replace their `title` / `description`, optionally add `image`, and remove `placeholder: true`.

## How the hero works

- `src/components/hero/IDCard3D.tsx` — badge geometry (shell, slot, perimeter line, inserts, clip).
- `src/components/hero/Lanyard3D.tsx` — the ribbon: a Bézier strip that follows the swing and twists with the badge.
- `src/components/hero/timeline.ts` — the deterministic timeline: drop with overshoot (0–1.5 s), front pause, auto-flip at 3 s, back pause, return, settle. Runs once.
- `src/components/hero/badgeTextures.ts` — the front/back artwork, drawn to canvas from your config.
- `src/components/hero/BadgeScene.tsx` — canvas, lighting, the animation loop, hover tilt, click/keyboard flips, scroll lift.
- `src/components/HeroSection.tsx` — layout, scroll choreography (Motion), the accessible flip button, WebGL fallback.

After the intro the badge flips on click / tap / Enter / Space; a click during the drop is queued until it lands. Rendering pauses when the hero is off-screen. With "reduce motion" on, the badge appears at rest, the intro is skipped and transitions are simplified. Without WebGL an HTML badge is shown instead.
