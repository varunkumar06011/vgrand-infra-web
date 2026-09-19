# Virtual Tour — Elite Homes sample flat

Data-driven photo walkthrough rendered on `/projects/elite-homes` (and any
project slug that has a config). Everything visible comes from
`src/data/tours/elite-homes.ts` — copy in the repo never hard-codes facts.

## Files

| File | Purpose |
|---|---|
| `src/data/tours/types.ts` | Scene/hotspot/plan types |
| `src/data/tours/elite-homes.ts` | THE config: scenes, links, hotspots, minimap, headings, labels |
| `src/data/tours/index.ts` | Registry — map a slug to a config |
| `ProjectTour.tsx` | Server component + crawlable SEO block; renders nothing without a config |
| `TourRoot.tsx` | Client: poster card, room grid, mounts the viewer |
| `TourViewer.tsx` | Full-screen overlay: arrows, hotspots, minimap, menu, zoom, fullscreen, tilt, end card |
| `PhotoStage.tsx` | Flat-photo renderer: pan/zoom/drag/pinch, blur-fill letterboxing |
| `PanoStage.tsx` | 360° via Photo Sphere Viewer — dynamic-imported, only loaded on first pano scene |
| `FloorplanMinimap.tsx` | Custom SVG plan with dots + radar cone |
| `TourScrollWalk.tsx` | Sticky scroll-walk hero (framer-motion) |
| `scripts/optimize-tour-images.mjs` | Image pipeline (`npm run tour:images`) |

Raw photos live in `tour-source/photos/` (gitignored). Optimized WebP +
400px thumbs are emitted to `public/tour/elite-3bhk/`.

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
room, a `plan.rooms` rect. Dots, menu chips, room grid, progress and the
scroll-walk all update automatically.

## Change the WhatsApp text

`tour.whatsappMessage` in the config — `{room}` is replaced with the
current room name. The number comes from `SITE_WHATSAPP_NUMBER` in
`src/lib/site.ts`. Leads post to `/api/leads` with
`project: "Elite Homes"` and `message: "Elite Homes - Virtual Tour - {room}"`
on click only (never on scene change).

## Position hotspots (dev only)

Run `npm run dev`, open the tour, **Shift+click** anywhere on a photo —
`{ x, y }` in % is copied to the clipboard and shown as a toast.
Paste into `links`/`specHotspots`. The helper is compiled out of
production builds (`process.env.NODE_ENV === 'development'` guard).

## Re-run the image script

`npm run tour:images` (or `node scripts/optimize-tour-images.mjs <dir>`).
Outputs WebP ≤ 2048 px long side (never upscales) + 400 px thumbs into
`public/tour/<dir>/`.

## Notes

- CSP-safe: every asset is same-origin, no workers, no third-party calls.
- `data-lenis-prevent` on the overlay keeps Lenis out of drag/pinch/wheel.
- The overlay is `position:fixed` `z-1500` (navbar 1000, modals 2000);
  the real Fullscreen API is used where supported, iOS gets the overlay.
- Disabled spec hotspots stay in the config with `enabled: false` and a
  comment explaining why (kitchen platform + dado pending owner confirm).
