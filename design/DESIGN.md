# Habitat Pulse — Cinematic Design Contract

## Art direction

Habitat Pulse is a living biodiversity observatory, not a dashboard. The browser is a camera moving from fragmented signals toward a connected habitat. The visual world feels biological, precise, and quietly hopeful.

### Commitments

- Primary hue: deep chlorophyll green, used as a real surface rather than a token accent.
- Type system: Newsreader Variable for editorial display; Manrope Variable for interface and body copy.
- Signature moment: scattered observation particles form a continuous habitat corridor as the camera moves through them.
- Deliberate grid break: the live map plane crosses the narrative column and appears to rotate from the WebGL depth field into the usable interface.
- Motion families: camera dolly / particle morph; mask-and-line typography; restrained pointer tilt.
- Glass: permitted only on the fixed navigation and the floating live observation readout, where content genuinely moves underneath.

## Anti-references

- Generic sage-and-beige eco landing pages
- SaaS dashboards with stat rows and repeated cards
- Purple/blue aurora gradients
- Centered hero copy over an arbitrary orb
- Decorative 3D that does not explain habitat connection
- Heavy borders, shadows, pills, and icon grids

## Color tokens

| Role | Value |
| --- | --- |
| Forest field | `oklch(29% 0.065 164)` |
| Deep field | `oklch(21% 0.045 166)` |
| Lichen surface | `oklch(94% 0.018 150)` |
| Living signal | `oklch(80% 0.14 132)` |
| Warm observation | `oklch(78% 0.10 76)` |
| Text on dark | `oklch(96% 0.012 145)` |
| Text on light | `oklch(23% 0.035 164)` |

## Composition

- Full viewport width with a 12-column editorial grid and `clamp(18px, 2.1vw, 36px)` gutters.
- One idea per scene. No centered max-width SaaS shell.
- Type and media overlap only where the Z-axis relationship stays legible.
- Use generous empty frames before and after the signature moment.
- Interactive controls become calmer and flatter than the cinematic narrative surrounding them.

## Motion contract

- Lenis is the only scroll smoothing layer. Native wheel, keyboard, touch, and anchor behavior remain available.
- GSAP ScrollTrigger owns choreography. No raw scroll listeners.
- DOM hot paths animate only `transform` and `opacity`.
- Scroll scrub range: `0.45–0.75`.
- Only one pinned peak scene; supporting scenes use normal flow or sticky composition.
- Reduced motion disables Lenis, pinning, camera travel, pointer response, and continuous rendering while preserving the complete page.

## Accessibility and performance

- WCAG AA contrast for all body and control text.
- Visible focus states, semantic landmarks, real labels, and 44px minimum touch targets.
- One WebGL renderer, DPR capped at 1.5 desktop / 1 mobile.
- CSS visual fallback remains behind the canvas.
- Content is readable if animation libraries or WebGL fail.
- Mobile removes pins and 3D tilt, keeps the narrative order, and renders at most one static particle frame.
