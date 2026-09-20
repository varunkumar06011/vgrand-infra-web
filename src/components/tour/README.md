# Virtual Tour — Elite Homes sample flat

Data-driven photo walkthrough rendered on `/projects/elite-homes` (and any
project slug that has a config). Structure (scenes, links, hotspots, plan)
lives in `src/data/tours/elite-homes.ts`; **every** display string lives in
`src/data/tours/elite-homes.i18n*.ts` keyed by language — copy in the repo
never hard-codes facts.

## Files

| File | Purpose |
|---|---|
| `src/data/tours/types.ts` | Scene/hotspot/plan/variant/floor-view/i18n types |
| `src/data/tours/elite-homes.ts` | THE config: scenes, links, hotspots, minimap, headings, feature gates |
| `src/data/tours/elite-homes.i18n.ts` | ALL display strings, English (`eliteHomesEn`) |
| `src/data/tours/elite-homes.i18n.te.ts` | Telugu map — draft, needsNativeReview, lazy-loaded chunk |
| `src/data/tours/index.ts` | Registry — map a slug to a config |
| `ProjectTour.tsx` | Server component + crawlable SEO block; renders nothing without a config |
| `TourRoot.tsx` | Client: poster card, room grid, language state, mounts the viewer |
| `TourViewer.tsx` | Full-screen overlay: arrows, hotspots, minimap, menu, zoom, fullscreen, tilt, end card, guided engine |
| `PhotoStage.tsx` | Flat-photo renderer: pan/zoom/drag/pinch, blur-fill, variant crossfade/compare layers |
| `PanoStage.tsx` | 360° via Photo Sphere Viewer — dynamic-imported, only loaded on first pano scene |
| `FloorplanMinimap.tsx` | Custom SVG plan with dots + radar cone + floor-view direction arrow |
| `VariantBar.tsx` | Empty/Furnished · Day/Evening pills, compare button, staged badge |
| `CompareHandle.tsx` | Before/after split slider (keyboard + touch, pointer capture) |
| `FloorViewsPanel.tsx` | "View from your floor" — vertical floor slider, facing chip, capture note |
| `GuidedUI.tsx` | Mode chooser, guided control bar, caption panel, EN\|తెలుగు switch |
| `CompassNeedle.tsx` | Tiny compass rose shared by the top bar and floor panel |
| `tourText.ts` | Language resolve/persist helpers, audio URL + caption timing |
| `scripts/optimize-tour-images.mjs` | Media pipeline (`npm run tour:images`) |

Raw assets live in `tour-source/` (gitignored). Optimized files are emitted
to `public/tour/elite-3bhk/`.

## Enable the pending balcony scene

1. Drop the photo into `tour-source/photos/` as `balcony-view.<ext>`
   (use the original phone file — never upscale).
2. `npm run tour:images` — emits `balcony-view.webp` + `-thumb.webp`.
3. In `src/data/tours/elite-homes.ts`, set `enabled: true` on the
   `balcony-view` scene. Its links (from `dining` and
   `bedroom-3-balcony`) appear automatically — links only render when
   the target scene is enabled.

## Add a real 360° photo

1. Drop an equirectangular image (2:1, e.g. 4096×2048) into
   `tour-source/photos/`, run `npm run tour:images`.
2. On the scene set `kind: 'pano'` and set `heading` to the bearing the
   camera faces at image-centre (0 = north). `heading` becomes the
   viewer's initial yaw, so align it with the plan.
3. That's it — `@photo-sphere-viewer/core` + three.js load on first
   entry via dynamic import and never ship while all scenes are photos.

## Add a room / scene

Add a scene object to `scenes` in the config (`id`, `order`, `room`,
`title`, `kind`, `src`, `thumb`, `focus`, `heading`, `links`,
`specHotspots`, `minimap`, `zone`, `enabled`, `alt`) and, if it is a new
room, a `plan.rooms` rect. Dots, menu chips, room grid and progress all
update automatically.

## Entry points

- **"View Flat" poster** on the project page opens the viewer at scene 0;
  each room-grid thumb opens its own scene.
- **"View Flat" on `ProjectCard`** (home + projects pages) shows for any
  slug with a tour config and links to `/projects/<slug>?tour=open`.
  `TourRoot` reads that param once, scrolls to the block, opens the
  viewer and strips the param from the URL.
- **Tour guide**: `GUIDE_STEPS` in `TourViewer.tsx` — a 6-step overlay
  auto-shown once per session (`sessionStorage.eliteTourGuideSeen`) and
  replayable any time via the `?` toolbar button. Each step highlights
  its control (`guideHl`); interacting with the highlighted control
  advances the guide.

## Change the WhatsApp text

`i18n.<lang>.ui.whatsappMessage` — `{room}` is replaced with the current
room name and `Rooms I viewed: …` is appended automatically (in-memory
tracking only — nothing is stored or sent until the click). The number
comes from `SITE_WHATSAPP_NUMBER` in `src/lib/site.ts`. Leads post to
`/api/leads` with `project: "Elite Homes"` and
`message: "Elite Homes - Virtual Tour - {room} | Rooms viewed: …"`
on click only (never on scene change). The lead note always uses English
room names for stable CRM values.

## Scene variants — Empty/Furnished · Day/Evening (Phase 3)

1. Drop the image into `tour-source/variants/` named
   `<sceneId>.<variantId>.<ext>` — e.g. `hall.furnished.png`. Aspect ratio
   must match the base scene image within 1% or the pipeline skips it
   loudly. `npm run tour:images` emits `<sceneId>.<variantId>.webp`.
   Staged images may only add furniture, decor or lighting — never change
   walls, windows, doors, room size or the view.
2. Add to the scene in `elite-homes.ts`:
   ```ts
   variants: [
     { id: 'furnished', group: 'furnishing', label: 'Furnished',
       src: `${IMG}/hall.furnished.webp`,
       kind: 'staged', stagedReason: 'AI-staged furniture mock-up' },
   ]
   ```
   `kind: 'staged'` always renders the fixed "Virtual staging —
   illustration only" badge (it cannot be turned off); `kind: 'real'`
   needs a `caption` instead. Optional Telugu label:
   `i18n.te.scenes.<sceneId>.variants.<variantId>`.
3. The pill toggle fetches the image on hover/tap only — nothing loads at
   scene load. Compare mode (Columns2 button) is a keyboard/touch
   before/after slider.

## Floor views — "View from your floor" (Phase 3)

1. Drop real balcony photos into `tour-source/floor-views/floor-<n>.<ext>`
   (actual floor number — any count), run `npm run tour:images`.
2. In `elite-homes.ts` fill `floorViews.floors` with
   `{ floor, label, src: ${IMG}/floor-<n>.webp, alt }`, set `capturedOn:
   'YYYY-MM'` and `facing` (the bedroom-3 balcony on the bottom edge of the
   East plan faces West — confirm which balcony the photos were shot from).
3. Set `verified: true` — the card stays hidden until verified AND ≥ 2
   floors exist. It attaches to `balcony-view` when that scene is enabled,
   otherwise to `bedroom-3-balcony`. Photos must be real shots taken at
   that height — never generated or edited views.

## Guided tour + languages (Phase 3)

- The viewer opens on a chooser: "Guided tour" or "Explore yourself".
  Guided mode walks every enabled scene in order, shows the narration
  caption (aria-live), plays `audio/<lang>/<sceneId>.mp3` when the scene
  is listed in `guided.audio.<lang>`, and auto-advances when audio ends —
  or after `max(4 s, words ÷ 2.5)` when there is no audio. Any drag or
  zoom pauses; play resumes. `prefers-reduced-motion` gets plain fades.
- **Audio**: drop `tour-source/audio/<en|te>/<sceneId>.mp3` (mono,
  ~64 kbps, ≤ 300 KB — e.g. `ffmpeg -i in.mp3 -ac 1 -b:a 64k out.mp3`),
  run `npm run tour:images`, then list the scene id in
  `guided.audio.<lang>` in the config. Unlisted scenes are captions-only;
  no audio is fetched until the user picks "Guided tour".
- **Telugu**: strings live in `elite-homes.i18n.te.ts` (`needsNativeReview`
  on the map). It is **not** in `i18n` on the config — `tourText.ts`'s
  `LAZY_TEXT` registry dynamic-imports it only when the user picks
  తెలుగు, so the bytes never ship in the initial bundle. The
  `EN | తెలుగు` switch shows in dev/preview builds and in production
  only after `telugu.reviewed: true` in the config. Choice persists via
  localStorage. Telugu renders in Noto Sans Telugu (`--font-telugu`,
  `preload:false`, line-height 1.75+).
- **Adding a language**: add the code to `TourLang` in `types.ts` +
  `LANG_LABELS` in `tourText.ts`, create the translated map (copy the
  `en` map), then either inline it as `i18n.<lang>` in the config or
  register a lazy loader in `LAZY_TEXT` under the tour slug, and drop
  audio under `tour-source/audio/<lang>/`.

## Re-run the media pipeline

`npm run tour:images` (or `node scripts/optimize-tour-images.mjs <dir>`).
Photos + variants + floor-views → WebP ≤ 2048 px long side (never
upscales), ≤ 1 MB, plus 400 px thumbs for photos/floor-views. Audio is
validated (size, mono, bitrate) and copied — no ffmpeg required, but
warnings tell you when a file needs re-encoding. Missing folders are
skipped silently.

## Position hotspots (dev only)

Run `npm run dev`, open the tour, **Shift+click** anywhere on a photo —
`{ x, y }` in % is copied to the clipboard and shown as a toast.
Paste into `links`/`specHotspots`. The helper is compiled out of
production builds (`process.env.NODE_ENV === 'development'` guard).

## Notes

- CSP-safe: every asset is same-origin, no workers, no third-party calls.
- `data-lenis-prevent` on the overlay keeps Lenis out of drag/pinch/wheel.
- The overlay is `position:fixed` `z-1500` (navbar 1000, modals 2000);
  the real Fullscreen API is used where supported, iOS gets the overlay.
- Disabled spec hotspots stay in the config with `enabled: false` and a
  comment explaining why (kitchen platform + dado pending owner confirm).
