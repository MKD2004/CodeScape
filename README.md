# CodeScape

Paste any public GitHub repo URL and walk through its architecture as an
explorable 3D city — every file a building, every folder a district.

Not affiliated with, and unrelated to, the existing "Git City" project. See
[PROJECT.md](./PROJECT.md) for the full pitch and how the two differ.

## Status

v1 feature-complete, pending deploy — see [plan.md](./plan.md) for the build
plan and progress.

## Features

- Paste any public `owner/repo` and it fetches the file tree, classifies
  every file by role, and lays it out as a squarified treemap
- Buildings extrude from the treemap footprints — height = LOC (log-scaled),
  color = language, shape = file role (component/API/model/test/default) —
  and rise from the ground with a staggered reveal animation on load
- Orbit camera by default; switch to a first-person walk mode (WASD +
  mouse-look) to explore the city at street level
- Click any building for a metrics panel: path, language, LOC, complexity
  proxy, last modified
- Minimap overlay showing a top-down view of the city's districts
- One-click aerial screenshot export with a title-card overlay (repo name,
  file count, LOC, district count)
- Shareable per-repo URLs (`/city/{owner}/{repo}`) — opening the link
  re-fetches and rebuilds the city client-side
- Friendly error states for not-found/private repos, rate limiting, and
  empty repos

## Stack

React + Vite + TypeScript, Three.js via React Three Fiber, Tailwind, Zustand.
See [techstack.md](./techstack.md) for details.

## Dev

```bash
npm install
npm run dev      # start dev server
npm run test     # run unit tests
npm run lint     # eslint
npm run build    # typecheck + production build
```
