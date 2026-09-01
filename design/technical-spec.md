# Technical Specification

## Stack

| System | Version | Role |
| --- | --- | --- |
| Lenis | `1.3.26` | Native-preserving smooth scroll |
| GSAP | `3.15.0` | Motion timelines |
| ScrollTrigger | `3.15.0` | Scroll state and single pinned peak |
| Three.js | `0.160.0` | One procedural WebGL particle environment |
| Leaflet | `1.9.4` | Live biodiversity map |

Dependencies are vendored into the static build and version-pinned.

## Scroll configuration

- Lenis `lerp: 0.075`, `smoothWheel: true`, `syncTouch: false`, `anchors: true`.
- Lenis forwards every frame to `ScrollTrigger.update()` through GSAP ticker.
- ScrollTrigger scrub values remain between `0.45` and `0.75`.
- The connection scene is the only pinned scene on desktop (`end: +=220%`).
- `ScrollTrigger.matchMedia()` removes pinning and counter-parallax below 768px and for reduced motion.

## WebGL tier

Tier C: procedural particles and custom GLSL. Narrative justification: the core idea is many isolated observations becoming one habitat network, so the visual itself is a computed field rather than a modeled object.

## Renderer budget

- One renderer / one scene / one perspective camera.
- 2,200 points desktop; 900 mobile.
- DPR cap: 1.5 desktop, 1 mobile.
- No shadows, postprocessing, bloom, textures, or models.
- Custom shader uses `uTime`, `uMorph`, `uScroll`, `uMouse`, and `uTint`.
- Pause animation when the page is hidden. Reduced motion renders one frame.

## Failure and fallback

- Feature-detect WebGL before initialization.
- A CSS radial-field composition remains visible behind the canvas.
- Prevent default on `webglcontextlost`; rebuild on restore.
- If Lenis/GSAP fails, native scroll and the semantic document remain usable.
- If live APIs fail, display clearly labeled sample observations and keep the planner operational.
