# Tech Stack — CodeScape

## Frontend / rendering

- **React** + **Vite** (fast dev server, simpler than Next.js since there's no need for SSR/routing complexity in v1)
- **Three.js** via **@react-three/fiber** (R3F) — declarative Three.js in React
- **@react-three/drei** — camera controls (`PointerLockControls`/`FirstPersonControls`), `Text`, `Html` overlays, `Environment`/sky helpers, `Detail` for LOD
- **TypeScript** throughout — this project has enough moving data shapes (file tree, treemap nodes, classification results) that types pay for themselves fast
- **Tailwind CSS** — for the UI chrome (URL input screen, loading state, metrics panel, minimap)
- **Zustand** — small global state store (current repo data, selected building, camera mode) — simpler than Redux for this scope

## Data fetching / parsing

- **GitHub REST API** (`GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`) — fetch full file tree without cloning
- **GitHub raw content API / contents API** — fetch individual file contents for LOC/complexity analysis (rate-limited — see notes below)
- **Simple in-house LOC/complexity counter** — a lightweight parser (line counting + regex-based complexity proxy: count of `if/for/while/switch/case/&&/||/catch`) is enough for v1; no need for full ASTs yet
- Language detection via file extension mapping (small static table) rather than a heavy library, at least for v1

## Layout algorithm

- Hand-rolled **squarified treemap** implementation (Bruls/Huizing/van Wijk algorithm) — no external dependency needed, it's ~100 lines of well-understood code

## Backend

- **v1 has effectively no backend.** The GitHub fetch + parsing can run client-side, or through a thin serverless function only if needed to avoid CORS/rate-limit issues (e.g. a single Vercel/Cloudflare Worker function that proxies GitHub API calls and does the LOC/complexity pass server-side, returning clean JSON to the frontend).
- If a backend proxy is used: **Node.js + a single serverless function** (Vercel Functions or Cloudflare Workers). No database in v1 — nothing needs to persist between sessions.
- Optional light caching layer (e.g. Vercel KV / Upstash Redis) to avoid re-parsing the same repo every visit — _nice-to-have, not required for v1._

## Hosting / deployment

- **Vercel** (pairs naturally with Vite/React + optional serverless functions, generous free tier, trivial deploy from GitHub)

## Dev tooling

- **ESLint + Prettier** — consistent formatting from day one
- **Vitest** — unit tests for the treemap algorithm and classification logic specifically (these are the two places subtle bugs will hide)

## Explicitly NOT used in v1 (avoid scope creep)

- No database, no auth, no payments, no multiplayer/websockets
- No AST-based static analysis (esprima/ts-morph) — regex-based heuristics are enough until Phase 5
- No Next.js — not needed without SSR/multi-page routing requirements
- No physics engine — this is a walk-through, not a game with collision physics (basic bounding-box collision, if any, is hand-rolled)

## Performance techniques (see project discussion — GPU load)

- `InstancedMesh` for buildings — one geometry/material, many instanced transforms, keeps draw calls flat regardless of repo size
- LOD via `@react-three/drei`'s `<Detail>` — simplified geometry at distance
- Frustum culling (automatic in Three.js) + a sensible fog/draw-distance cutoff
- Flat/toon shading materials instead of full PBR — cheaper and fits the stylized look
- Single directional light + baked ambient, no per-building real-time shadows
