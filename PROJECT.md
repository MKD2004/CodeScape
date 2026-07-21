# CodeScape — Project Description

> Working title: **CodeScape** (placeholder — swap freely, just keep it distinct from the existing "Git City" project, which is a different thing — see below)

## One-line pitch

Paste any public GitHub repository URL. Watch it transform into an explorable 3D city where every file is a building, every folder is a district, building shape reflects the file's _role_ in the codebase, and height/color reflect its size and language. Walk through your own architecture like a city.

## Why this project

- Built for pure visual wow-factor + portfolio value — not a research project, not a startup, a **fun, sharp, finish-able side project**.
- Combines skills that are individually simple but rarely combined well: static analysis / file parsing, treemap/layout algorithms, and real-time 3D rendering (WebGL via Three.js).
- Every demo is different (any repo → new city), which makes it inherently shareable and repeatedly interesting, unlike a single fixed portfolio piece.

## What this is NOT (important distinction)

There is an existing, similar-sounding, well-known project called **Git City** (github.com/srizzon/git-city, 5.6k stars, thegitcity.com). It is a **different project** and this repo must not be confused with it:

|                          | Git City (existing, not ours)                                | CodeScape (this project)                             |
| ------------------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| Unit of analysis         | one GitHub **user**                                          | one **file** inside one repo                         |
| What the city represents | a community/leaderboard of developers                        | the internal architecture of a single codebase       |
| Core loop                | social: claim a building, kudos, shop, achievements, compare | exploratory: understand how a codebase is structured |
| Backend                  | Supabase, auth, Stripe, multiplayer persistent world         | mostly stateless — fetch repo → render → done        |

CodeScape is closer in spirit to tools like SourceTrail / CodeSee, reimagined as a walkable stylized city. No social layer, no accounts, no payments, no multiplayer — those are explicitly out of scope.

## Core mechanic

```
GitHub repo URL
      ↓
Fetch file tree + per-file stats (LOC, language, complexity, last-modified)
      ↓
Classify each file by role (component / API route / model / test / config / etc.)
      ↓
Squarified treemap layout → folders become districts, files become footprints
      ↓
Extrude into 3D buildings (height = LOC, color = language, shape = role)
      ↓
Walkable 3D scene with click-to-inspect + shareable aerial screenshot
```

## Data → visual mapping (v1)

| Data dimension                                   | Visual property                             |
| ------------------------------------------------ | ------------------------------------------- |
| Folder                                           | District (ground-plane region from treemap) |
| File LOC                                         | Building height (log-scaled)                |
| Language                                         | Building color (fixed palette)              |
| File role (component/API/model/test/config/etc.) | Building archetype/shape                    |
| Cyclomatic complexity (rough proxy)              | Facade detail / window density              |
| Last modified                                    | Weathering/tint                             |

## Target v1 feature set (must ship)

1. Paste any public GitHub repo URL → fetch and parse
2. Role classification per file (path/extension/import heuristics)
3. Squarified treemap layout (districts + building footprints)
4. 3D extrusion with role-based shape, LOC height, language color
5. Walk-through camera (first-person / WASD + mouse-look)
6. Click a building → metrics panel (path, LOC, language, complexity, last modified)
7. Aerial screenshot capture, shareable

## Explicitly deferred to "Next Level" (see plan.md Phase 5)

Git-history time travel, live dependency graph roads, code-health mode, AI tour guide, minimap+search, achievements/easter eggs. These are real, good ideas — they are sequenced _after_ v1 ships, not built in parallel with it, to avoid the classic side-project death-by-scope-creep.

## Tech stack

See `techstack.md`.

## Build plan & progress tracking

See `plan.md` — Claude Code should check off tasks there as they're completed.
