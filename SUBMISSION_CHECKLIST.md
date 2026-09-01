# Habitat Pulse — Final Submission Checklist

Use this page during the last Devpost pass. Do not submit until both URLs below open in a private/incognito window.

## Required links

- [ ] **Public live demo:** paste the final public URL into Devpost.
- [ ] **Public source repository:** upload this package to GitHub, set the repository to public, and paste its URL into Devpost.
- [ ] Confirm the demo loads without credentials or an allowlist.
- [ ] Confirm the repository includes `README.md`, `DEVPOST.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md`.

The current ChatGPT Sites preview is an owner-only review link. It is useful for QA, but it does **not** satisfy the public-demo requirement until access is changed to public.

## Ready-to-use submission copy

- **One-line pitch, inspiration, implementation, challenges, accomplishments, and next steps:** `DEVPOST.md`
- **Setup, architecture, limitations, accessibility, and demo script:** `README.md`
- **Libraries, fonts, APIs, maps, and dataset attribution:** `THIRD_PARTY_NOTICES.md`
- **Project code license:** `LICENSE`

## 90-second judging demo

1. Open on the arrival scene and state the problem: local nature data exists, but a credible next action is hard to find.
2. Scroll through the living-signal scene into the particle corridor; explain that isolated patches become useful when they connect.
3. Land on the evidence scene and point out live iNaturalist observations, current weather, the radius control, and the uncertainty note.
4. In **Build a patch**, choose a space and wildlife goal, then generate the plan.
5. Complete two actions and show Habitat Readiness and the impact scenarios respond immediately.
6. Close with the theme: one balcony, rooftop, or schoolyard can become part of a larger habitat network.

## Judging criteria map

| Criterion | What to emphasize | Evidence in the project |
| --- | --- | --- |
| Environmental Impact — 30% | Turns an overlooked urban space into specific habitat actions, not just awareness. | Explainable patch plan, planted-area scenario, rain-retention scenario, local expert reminder. |
| Use of Technology — 25% | Combines live biodiversity and weather data with spatial storytelling and a local recommendation engine. | iNaturalist, Open-Meteo, Nominatim, OpenStreetMap/Leaflet, Three.js shaders, GSAP/ScrollTrigger, transparent planner rules. |
| Execution — 15% | A finished end-to-end journey works even when a data or graphics dependency fails. | Vendored libraries, WebGL/CSS fallback, request timeouts, labeled sample mode, production build. |
| Theme Alignment — 10% | Makes “tech that protects the planet” personal and actionable. | Evidence-to-action narrative and the connected habitat-corridor metaphor. |
| Design and Usability — 20% | Cinematic polish supports a clear task instead of becoming decoration. | Editorial hierarchy, restrained 3D, keyboard controls, visible focus, reduced-motion mode, responsive document order. |

## Attribution wording

Use this short version in Devpost if space is limited:

> Biodiversity records and source photographs are provided by iNaturalist; weather data by Open-Meteo; geocoding by Nominatim; and map data/tiles by OpenStreetMap contributors. The experience uses version-pinned Lenis, GSAP/ScrollTrigger, Three.js, Leaflet, Newsreader, and Manrope. Full licenses and links are in `THIRD_PARTY_NOTICES.md`.

## Final safety checks

- [ ] Do not commit or upload `.env.local`, API keys, tokens, or credentials.
- [ ] Test the live demo once on desktop and once at a phone-sized viewport.
- [ ] Test one place search and one planner run.
- [ ] Verify focus visibility with the keyboard and confirm reduced-motion mode remains usable.
- [ ] Make sure the submitted video or live link shows the same current build as the public repository.
