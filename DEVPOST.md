# Habitat Pulse — Devpost Submission Copy

## One-line pitch

Habitat Pulse turns live local biodiversity and weather data into an explainable plan for converting a balcony, rooftop, schoolyard, or overlooked urban corner into a micro-habitat.

## Inspiration

Nature data is abundant, but action still feels abstract. People can care deeply about habitat loss and still have no idea what one small space can realistically contribute. We wanted to close the gap between noticing nearby life and taking one specific, achievable action.

We also wanted the interface itself to carry the idea. Instead of presenting another eco dashboard, Habitat Pulse begins as a cinematic journey: isolated observations float in a deep chlorophyll field, then assemble into a corridor. The camera finally settles onto a live map and a calm planning tool. The form follows the ecological argument—small patches become meaningful through connection.

## What it does

Users can search a place or grant geolocation access, choose a 2, 5, or 10 km radius, and explore recent research-grade iNaturalist observations on an interactive map. Habitat Pulse pairs that biodiversity signal with Open-Meteo temperature and rain-probability data and surfaces species photographs where they are available.

The user then describes one space—its type, size, sunlight, existing surface, and intended wildlife goal. A transparent rule system creates a short habitat plan for pollinators, birds, mixed wildlife, or urban cooling. Each completed action updates the Habitat Readiness score, potential planted area, supported wildlife groups, and a rough rain-retention scenario.

## How we built it

Habitat Pulse is authored as a static HTML, CSS, and JavaScript application with no API keys. Deployment stages those exact assets behind a minimal vinext route required by the hosting runtime; the experience itself remains framework-free.

- **Lenis 1.3.26** controls the smooth-scroll pacing.
- **GSAP 3.15.0 and ScrollTrigger 3.15.0** choreograph masked typography, spatial transitions, and one pinned desktop sequence.
- **Three.js 0.160.0** renders one procedural 3D point field with custom GLSL shaders. The points morph from scattered observations into a habitat corridor while the camera moves through the field.
- **Leaflet 1.9.4 and OpenStreetMap** provide the live observation map.
- **Newsreader Variable 5.2.8 and Manrope Variable 5.2.8** create the editorial/display and interface type system.
- **iNaturalist** supplies research-grade citizen-science records and photographs.
- **Open-Meteo** supplies current temperature and the daily maximum precipitation probability.
- **Nominatim** resolves place searches.

All browser libraries and fonts are vendored and version-pinned. The recommendation engine is local and explainable: its output responds to the available area, sunlight, current surface, target wildlife, and the broad wildlife groups found in the current field reading.

For deployment, vinext 1.0.0-beta.8 and Vite 8.2.2 bundle a minimal route that returns the authored HTML document. React 19.2.8 is present only as that hosting runtime's peer dependency; the visible experience remains the same static HTML/CSS/JavaScript implementation.

## Challenges we ran into

### Making uncertainty visible

Citizen-science density is not the same as biodiversity. A quiet map may mean fewer observers, not fewer species. We call the result a **field reading, not a census**, explain its limits beside the evidence, and never present record density as a complete ecological assessment.

### Making 3D serve the story

It was easy to add more effects; it was harder to make one effect meaningful. We limited the experience to a single WebGL environment and one signature transformation. The scattered-to-connected particle corridor expresses the core habitat idea, while the rest of the motion supports hierarchy and pacing.

### Keeping the experience resilient

Live data, WebGL, and scroll animation can all fail independently. Habitat Pulse keeps a CSS background behind the canvas, preserves readable semantic content if motion libraries are unavailable, and shows a clearly labeled sample when the biodiversity request fails. The planner continues to work independently of the live services.

## Accomplishments we are proud of

- A complete narrative arc from local evidence to a personal next action.
- A high-end, spatial interface without falling back to a card grid or generic dashboard.
- Real environmental data with no API-key setup.
- One custom-shader WebGL field that is both expressive and performance-conscious.
- An explainable recommendation system instead of a black-box score.
- Explicit uncertainty, honest impact labels, and graceful live-data failure states.
- Responsive and reduced-motion cuts that preserve the same content and task flow.

## Accessibility and performance

The document uses semantic landmarks, headings, labels, fieldsets, live status regions, keyboard-operable native controls, a skip link, and visible focus states. With `prefers-reduced-motion`, Habitat Pulse disables Lenis, desktop pinning, pointer tilt, and continuous rendering while retaining one static frame and the complete page.

The visual layer uses one Three.js renderer, one scene, one camera, and one particle system. It renders 2,200 points on desktop and 900 on mobile, caps device pixel ratio at 1.5/1 respectively, and pauses rendering work while the tab is hidden. Unsupported WebGL falls back to the CSS environment.

## What we learned

Environmental technology becomes more useful when it moves beyond awareness and gives people a credible next action. We also learned that responsible data design means communicating what a dataset cannot prove, not only displaying what it contains. Finally, restraint made the cinematic work stronger: one intentional 3D metaphor did more than a page full of unrelated effects.

## What is next

The next version would add expert-reviewed native plant catalogs by region, allow schools or neighborhoods to combine many small patches into a shared corridor view, and validate improvements through repeat observations over time.

## How to run the demo

From the project directory:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. No build step or API key is required. Internet access enables live APIs, map tiles, and observation photographs; a clearly labeled sample keeps the core flow demonstrable if iNaturalist is temporarily unavailable.

## Built with

HTML · CSS · JavaScript · Lenis 1.3.26 · GSAP/ScrollTrigger 3.15.0 · Three.js 0.160.0 · Leaflet 1.9.4 · Newsreader Variable 5.2.8 · Manrope Variable 5.2.8 · OpenStreetMap · iNaturalist API · Open-Meteo API · Nominatim

## Attribution

The location-aware biodiversity-discovery concept was inspired by [Nature Walk App](https://github.com/mimi030/nature-walk-app) by `@mimi030` (MIT). Habitat Pulse is a new implementation; no source files were copied.

The art direction synthesized principles from the supplied [Awesome DESIGN.md collection](https://github.com/VoltAgent/awesome-design-md), [Cinematic Scroll Skill](https://github.com/MustBeSimo/cinematic-scroll-skill), [Auteur](https://github.com/agiwhitelist/auteur), [Immersive Garden design guide](https://github.com/Shuvam-Banerji-Seal/modern-design.md/blob/main/websites/immersive-g/design.md), and [Premium Web Design Skill](https://github.com/Lucxar/premium-web-design-skill).

Map data © OpenStreetMap contributors. Biodiversity records and photographs are supplied by iNaturalist and retain their source licenses. Weather data is provided by Open-Meteo. Third-party runtime and typeface licenses are documented in `THIRD_PARTY_NOTICES.md`.
