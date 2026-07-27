# CodeScape — Landing Hero: Design Spec & Build Prompt

This file is written to be handed directly to Claude Code as the implementation brief for the landing page hero section. It describes the reference design (attached screenshots: day mode + night mode) and the interaction that needs to be built on top of it.

Scope note: this hero is the **marketing/landing page**, a stylized pixel-art teaser. It is a separate concern from the actual data-driven 3D city (Three.js/R3F, built per `plan.md` Phases 1-4) that renders a real parsed repo. Do not conflate the two — the hero can be built with lighter-weight 2D/CSS techniques even though the product itself uses Three.js.

---

## 1. Visual identity

- **Style:** flat pixel-art / 8-bit aesthetic. Thick (2-3px) black pixel-style outlines on every UI element and building. No gradients except the sky background and the glow behind the sun/moon.
- **Font:** a pixel/bitmap font throughout (e.g. "Press Start 2P" or "Silkscreen") for all text — headline, nav, buttons, labels. No standard sans-serif anywhere in the hero.
- **Buttons/panels:** solid fills, hard black borders, slight drop shadow offset (pixel-style, not blurred) — e.g. a 3-4px solid black shadow offset down-right, not a soft box-shadow.
- **Color palette:**
  - **Day mode:** sky `#7EC8E8`-ish blue, ground `#8FD17A`-ish green, road dark charcoal `#22252B`, road dashes yellow `#F5C842`, sun solid yellow `#F5C842` with soft glow, primary accent yellow `#F5C842`, panel background off-white `#F2EEE3`, text/borders black.
  - **Night mode:** sky deep navy `#0B0E23` with scattered white star dots, ground dark green/black, road same charcoal, road dashes same yellow, moon pale yellow `#F5EDB8` with soft glow, panels darken to navy `#12142B`, buildings shift from bright saturated fills (day) to muted/desaturated fills with warm lit-window squares (night) — night buildings should read as "lit windows in the dark" rather than fully-colored blocks.
  - Building color set (day, saturated): purple, mustard/gold, cyan, magenta/pink, green, red, blue — reused across both modes, just desaturated + windows relit at night.
- **Toggle:** day/night is a manual pill toggle top-right (sun/moon icon + label "DAY"/"NIGHT"), switches the whole theme instantly (no scroll-linked day/night — that's a separate, orthogonal control from the scroll camera).

## 2. Layout — static elements (from reference screenshots)

**Top nav bar** (fixed, transparent over the sky):
- Left: logo — small red rounded-square icon + "CODESCAPE" in pixel font, black text, white pill background with black border
- Right: day/night toggle pill (icon + label, white/dark pill with black border) + "SIGN IN" button (solid yellow, black border, black text)

**Hero content block** (centered, over the sky, above the skyline):
- Small pill badge, centered: "◆ PIXEL EDITION v1.0"
- Headline, two lines, large pixel font, white fill with black outline: "YOUR CODE / IS A CITY." — a small decorative sun/glow motif and a tiny pixel cloud/building silhouette sit to the right of the headline
- Subheadline, one/two lines, smaller pixel font, dark gray: "Paste any GitHub repo. Walk through its architecture as a pixel-art city where every file is a building."
- CTA card: white/cream panel, thick black border, containing:
  - "⌥ CONTINUE WITH GITHUB" — full-width black button, white text
  - "OR" divider with horizontal rules on either side
  - Input field (placeholder `github.com/user/repo`) + yellow "BUILD →" button, side by side
- Scroll hint below the card: "↓ scroll to walk through the city ↓", small, centered, subtle

**Skyline** (bottom half of viewport, below the horizon line where sky meets ground):
- A road running down the center in one-point perspective — two converging edges meeting at a vanishing point at the horizon, dashed yellow centerline
- Buildings cluster on both sides of the road, arranged in a fan/perspective pattern radiating from the vanishing point — buildings nearest the bottom corners are largest/closest, buildings nearest the horizon are smallest/furthest, mimicking a wide-angle street view
- Buildings are simple pixel-art rectangles with a grid of "window" squares (lit/colored differently per building), varying heights, varying colors from the palette above, slightly overlapping/staggered for depth
- A small floating toolbar (a few icon buttons) sits bottom-center, decorative/utility, low emphasis

## 3. The core ask: scroll-driven camera through the city

This is the actual engineering problem — everything in Section 2 is static reference, this section is the behavior spec.

**Effect:** as the user scrolls down past the hero, it should feel like a virtual camera is flying forward down the road, deeper into the city. The hero pins/sticks in place for a scroll distance, and scroll position drives a "camera depth" value rather than normal page scroll — during this pinned segment, page content doesn't move, the *city* moves.

**Required behavior:**
1. **Pin the hero.** For a defined scroll distance (e.g. an outer wrapper `300vh`–`500vh` tall containing a `position: sticky; top: 0; height: 100vh` inner hero), the hero content stays fixed in the viewport while scroll progress (0→1 across that distance) drives the animation below, instead of the page visibly scrolling.
2. **Buildings move toward the viewer as scroll progresses.** Each building has a "depth" (z) value. As scroll progress increases, every building's effective depth decreases (it gets closer): it should scale up and translate outward/downward from the vanishing point toward its final on-screen position at the edge of the road — replicating a forward-flight parallax, not a simple fade or slide.
3. **Continuous spawning at the horizon.** As buildings pass a "close" threshold and scale/move out of frame, they are recycled: reset back to the horizon (small, near vanishing point, randomized lane position) and reassigned a fresh depth so the stream of buildings never runs out, however far the user keeps scrolling. Use a modulo/wrap-around depth calculation per building rather than literally destroying/creating DOM or scene nodes on every frame.
4. **Parallax by depth.** Buildings further from the camera move slower per unit of scroll; buildings closer move faster and grow larger — this differential speed is what sells the "flying forward" sensation, a uniform speed for all buildings will look flat and wrong.
5. **The road, dashed centerline, and vanishing point stay fixed** — only the buildings (and optionally subtle star/cloud parallax in the sky) move. The road's converging perspective lines should visually match where buildings enter/exit.
6. **Works identically in day and night mode** — the day/night toggle only changes the color theme (Section 1), never the scroll-camera mechanics.
7. **Hero content (headline, CTA card, nav) stays fixed and fully legible throughout the scroll-pin** — it does not move with the camera, it's the static UI layer on top of the moving city.
8. **On exiting the pinned scroll distance,** the page unpins and normal scrolling resumes into whatever section follows the hero.

**Suggested technical approach (adjust as needed for the existing stack):**
- Pin via CSS `position: sticky` on an inner hero within a tall outer wrapper, OR a scroll-linked animation library (e.g. Framer Motion's `useScroll` + `useTransform`, or GSAP ScrollTrigger with `pin: true`) — prefer whichever is already a dependency in the project; don't add a new heavy animation library just for this if `framer-motion` or similar is already present.
- Represent each building as a small data object: `{ lane, baseDepth, size, color, windowSeed }`. On every scroll-progress update, compute each building's current depth as `(baseDepth - progress * speedMultiplier) % maxDepth`, then map depth → `{ scale, x, y, opacity }` via a perspective/easing function (closer depth = bigger scale, further outward x, lower on screen).
- Keep this to a fixed pool of building elements (e.g. 20-30 reused nodes), animating their transforms every frame — do not mount/unmount DOM nodes per spawn, that will jank on scroll. Plain CSS `transform: translate3d(...) scale(...)` updated via `requestAnimationFrame`/the animation library's own frame loop, not React re-renders per scroll pixel.
- Throttle scroll listener work via the animation library's built-in scroll-progress hooks rather than a raw `onScroll` handler recalculating from scratch.

## 4. Acceptance checklist (Claude Code should self-verify against these)

- [ ] Day and night mode render pixel-perfect to the two reference screenshots (nav, headline, CTA card, badge, scroll hint, skyline layout)
- [ ] Day/night toggle switches instantly with no layout shift
- [ ] Scrolling down pins the hero and drives buildings toward the viewer with visible forward-motion parallax (not a static skyline, not a simple fade/slide)
- [ ] Buildings continuously spawn at the horizon and recycle — scrolling for an extended distance never "runs out" of city
- [ ] Near buildings move faster/larger than far buildings (differential parallax is clearly visible)
- [ ] Headline/CTA/nav remain fixed, legible, and interactive throughout the scroll-pin (the "Continue with GitHub" button and repo input are clickable at any scroll position within the pin)
- [ ] Frame rate stays smooth (no visible jank) while scrolling continuously through the whole pinned distance
- [ ] Releasing scroll at the end of the pinned distance transitions cleanly into normal page scroll for whatever comes after the hero
