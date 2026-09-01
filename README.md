# Habitat Pulse

**A cinematic local-biodiversity observatory that turns a small urban space into a practical habitat plan.**

Habitat Pulse was created for Hack the Habitat 2026. It begins as an editorial, scroll-directed journey through the living signals hidden in a city, then settles into two useful tools: a live neighborhood field reading and an explainable micro-habitat planner.

This is intentionally not a dashboard. The experience uses depth, scale, and one signature particle transformation to show the central idea: a balcony, rooftop, schoolyard, or overlooked corner may be small alone, but many such patches can form a habitat network.

## What works

- Search for a city or use browser geolocation.
- Read recent research-grade observations from iNaturalist within a 2, 5, or 10 km radius.
- Explore observations on a Leaflet map with OpenStreetMap tiles.
- See current temperature and the day's maximum rain probability from Open-Meteo.
- View locally observed species and photographs when the source records include them.
- Describe a balcony, rooftop, schoolyard, or small community corner.
- Generate a transparent action plan for pollinators, birds, mixed wildlife, or urban cooling.
- Check actions to update the Habitat Readiness score and simple impact scenarios.
- Keep using the planner if a live data service is unavailable.

## The experience

The page moves through six scenes:

1. **Arrival** — a quiet editorial introduction to the unseen life in a city.
2. **Signal** — nearby species records surface as spatial specimens.
3. **Connection** — scattered WebGL particles form a corridor during the single pinned cinematic peak.
4. **Evidence** — the camera resolves into a usable location search, live map, and field reading.
5. **Action** — an explainable planner turns one available space into a habitat checklist.
6. **Resolution** — the corridor recedes into one quiet invitation to begin.

Newsreader carries the large editorial moments; Manrope keeps controls and evidence calm and legible. Glass is reserved for the fixed navigation and live observation plate. The functional half of the site moves from deep chlorophyll to a light lichen surface so the map and planner feel grounded rather than decorative.

## Run the demo locally

The production assets are already vendored. No build step or API key is required.

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080). Serve the directory over HTTP rather than opening `index.html` with a `file://` URL because the Three.js bundle is loaded as an ES module.

An internet connection is needed for live iNaturalist records, Open-Meteo conditions, Nominatim search, OpenStreetMap tiles, and source photographs. If the biodiversity request fails, the interface explicitly labels a small sample dataset and the planner remains usable.

For a short demo:

1. Let the default Bangkok field reading load.
2. Scroll through the particle corridor into the live map.
3. Search a place and switch the observation radius.
4. Describe a space in **Build a patch** and generate a plan.
5. Toggle recommended actions to show the score responding immediately.

`npm install` is optional and only needed if you want a local copy of the pinned source packages; the browser uses the files committed under `assets/vendor/` and `assets/fonts/`.

## Technical architecture

Habitat Pulse is authored as a static HTML/CSS/JavaScript application. Its runtime libraries and fonts are self-hosted and version-pinned. Deployment stages those exact files as public assets and uses a minimal vinext route to return the authored HTML document from the Sites runtime; the experience code itself is not rewritten as a framework UI.

| System | Exact version | Purpose |
| --- | ---: | --- |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.3.26 | Smooth scroll pacing while preserving anchors and native controls |
| [GSAP](https://gsap.com/) + ScrollTrigger | 3.15.0 | Scroll choreography, masks, spatial transforms, and the single desktop pin |
| [Three.js](https://threejs.org/) | 0.160.0 | One procedural WebGL particle field with custom vertex and fragment shaders |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | Interactive biodiversity map |
| `@fontsource-variable/manrope` | 5.2.8 | Interface and body typeface |
| `@fontsource-variable/newsreader` | 5.2.8 | Editorial display typeface |
| [vinext](https://github.com/cloudflare/vinext) | 1.0.0-beta.8 | Minimal Sites-compatible HTML route and server bundle |
| React / React DOM | 19.2.8 | Hosting-route runtime only; not used to author the experience UI |
| [Vite](https://vite.dev/) | 8.2.2 | Production bundling for the hosting route |

The WebGL layer uses one renderer, one scene, one camera, and a single point cloud: 2,200 points on desktop and 900 on mobile. Device pixel ratio is capped at 1.5 on desktop and 1 on mobile. The renderer pauses useful work while the tab is hidden and handles WebGL context loss/restoration without blocking the document.

### Live services

- [iNaturalist API](https://api.inaturalist.org/v1/docs/) — recent research-grade observations, taxa, coordinates, and source photographs.
- [Open-Meteo API](https://open-meteo.com/en/docs) — current temperature and daily precipitation probability.
- [Nominatim](https://nominatim.org/release-docs/latest/api/Search/) — text place search.
- [OpenStreetMap](https://www.openstreetmap.org/copyright) — map tiles and map data.
- Browser Geolocation API — optional current-area lookup after explicit permission.

No API credentials are stored in the project.

## Accessibility, resilience, and performance

- Semantic sections, headings, labels, fieldsets, status regions, and a keyboard skip link keep the document navigable without the cinematic layer.
- Visible focus treatments are provided for links and controls.
- `prefers-reduced-motion` disables smooth scrolling, pinning, pointer response, and continuous WebGL rendering; one static particle frame preserves the visual context.
- Mobile removes the pinned sequence and depth tilt while preserving the complete narrative and tools in document order.
- If WebGL is unavailable, the fixed CSS field remains as the visual background.
- If Lenis or GSAP is unavailable, native scrolling and the semantic page remain readable.
- Live requests use timeouts. A failed biodiversity request activates a clearly labeled sample; unavailable weather values display as unknown rather than invented data.

## Method and limitations

Observation totals reflect both wildlife and observer activity. Habitat Pulse therefore calls the result a **field reading**, not a census, and does not infer local abundance from the number of records.

Habitat Readiness is an explainable planning score based on the user's surface, light, goal, and completed actions. It is not a scientific biodiversity index. Planted-area and rain-retention figures are rough, visibly labeled scenarios. Users should confirm native plant choices and site safety with a qualified local expert.

## Project layout

```text
index.html               Semantic experience and tools
styles.css               Editorial layout, responsive states, and fallbacks
app.js                   APIs, map, planner, WebGL, and motion choreography
assets/vendor/           Version-pinned runtime libraries
assets/fonts/            Self-hosted variable fonts
design/                  Art direction, motion storyboard, and technical contract
DEVPOST.md               Submission-ready project copy
THIRD_PARTY_NOTICES.md   Library and typeface notices
```

## Design references

The visual system was informed by the supplied [Awesome DESIGN.md collection](https://github.com/VoltAgent/awesome-design-md), [Cinematic Scroll Skill](https://github.com/MustBeSimo/cinematic-scroll-skill), [Auteur](https://github.com/agiwhitelist/auteur), [Immersive Garden design guide](https://github.com/Shuvam-Banerji-Seal/modern-design.md/blob/main/websites/immersive-g/design.md), and [Premium Web Design Skill](https://github.com/Lucxar/premium-web-design-skill). Their principles were synthesized into the project-specific documents in `design/`; no template or source implementation was copied.

The location-aware biodiversity-discovery concept was inspired by [Nature Walk App](https://github.com/mimi030/nature-walk-app) by `@mimi030` (MIT). Habitat Pulse is a new implementation that replaces credential-dependent services with a key-free static architecture; no source files were copied.

Third-party software and fonts retain their own licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Pitch

> Nature data is abundant, but action still feels abstract. Habitat Pulse reads the living signal around you and turns one overlooked space into a useful habitat—one balcony, rooftop, and schoolyard at a time.

## License

Project-authored code and documentation are MIT licensed; see [LICENSE](LICENSE). Third-party components remain subject to the licenses listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
