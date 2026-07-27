import type { FileNode } from '../data/tree'
import type { LayoutFolderNode, LayoutTreeNode } from '../layout/layoutTree'
import { archetypeForRole, type Archetype } from './archetypes'
import { getLanguageColor } from './colors'

export interface BuildingInstance {
  file: FileNode
  archetype: Archetype
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
}

export interface DistrictTile {
  name: string
  path: string
  x: number
  z: number
  /** Full plot, road included — the treemap rect. Used by the minimap. */
  width: number
  depth: number
  /** Ground tile: the plot minus the road on every side. Its edge is the kerb. */
  curbWidth: number
  curbDepth: number
  /** Buildable area: the ground tile minus the sidewalk verge on every side. */
  plazaWidth: number
  plazaDepth: number
  color: string
}

export interface StreetProp {
  x: number
  z: number
  rotationY: number
}

export interface RoadDash {
  x: number
  z: number
  horizontal: boolean
}

export interface PreparedScene {
  buildings: BuildingInstance[]
  districts: DistrictTile[]
  streetLamps: StreetProp[]
  trees: StreetProp[]
  benches: StreetProp[]
  roadDashes: RoadDash[]
  groundWidth: number
  groundDepth: number
}

// The scene is authored at roughly 1 unit = 1 metre, so buildings, street props
// and the walk-mode eye height (1.7) all stay in proportion to each other.
const FOOTPRINT_GUTTER_RATIO = 0.14
const MIN_FOOTPRINT = 0.05
/** Ceiling on a single building's footprint. Without it a small repo spreads a
 * handful of files across the whole layout and every "building" reads as a
 * city-block-sized slab that dwarfs the trees and lamps beside it. */
const MAX_FOOTPRINT = 26
const HEIGHT_UNIT = 4.4
/** Roughly two storeys — nothing should read as a shed next to a 6m tree. */
const MIN_HEIGHT = 5.5
/** Tallest a building may stand relative to its own footprint. Height tracks
 * LOC, but a small file in a dense district also gets a narrow footprint, and
 * without this the pair produces a needle rather than a building. */
const MAX_ASPECT = 9

/** Half-width of the road that runs between two neighbouring plots. Both
 * neighbours give up this much, so every road is `ROAD_HALF_WIDTH * 2` wide and
 * the shared plot boundary is exactly its centreline — which is where the lane
 * markings go, one dashed line per road rather than one per district. */
export const ROAD_HALF_WIDTH = 4.5
/** A plot never surrenders more than this fraction of itself to road, so tiny
 * plots keep usable ground. */
export const MAX_ROAD_RATIO = 0.22

export function roadGutter(size: number): number {
  return Math.min(ROAD_HALF_WIDTH, size * MAX_ROAD_RATIO)
}

/** Verge between the kerb and the buildable plaza — where trees, lamps and
 * benches stand, so street props end up beside the road instead of on it. */
const SIDEWALK_WIDTH = 3.2
const MAX_SIDEWALK_RATIO = 0.2

function sidewalkWidth(curbSize: number): number {
  return Math.min(SIDEWALK_WIDTH, curbSize * MAX_SIDEWALK_RATIO)
}

const DISTRICT_PALETTE = [
  '#8bc44c',
  '#e8c15a',
  '#6fb8d1',
  '#e0895a',
  '#c9a8e0',
  '#e07a7a',
]

/** Spacing along the sidewalk between consecutive props (lamps and trees
 * alternate, so each kind repeats every `PROP_STEP * 2`). */
const PROP_STEP = 9
const BENCH_EVERY = 4
/** How far a bench sits in from the sidewalk centreline, towards the plaza. */
const BENCH_INSET = 0.9
const DASH_SPACING = 5

interface PlotTransform {
  centerX: number
  centerZ: number
  scaleX: number
  scaleZ: number
}

function pointOnRectPerimeter(
  t: number,
  halfW: number,
  halfD: number,
): { x: number; z: number; nx: number; nz: number } {
  const topLen = halfW * 2
  const rightLen = halfD * 2
  const bottomLen = halfW * 2
  let d = t
  if (d < topLen) return { x: -halfW + d, z: -halfD, nx: 0, nz: -1 }
  d -= topLen
  if (d < rightLen) return { x: halfW, z: -halfD + d, nx: 1, nz: 0 }
  d -= rightLen
  if (d < bottomLen) return { x: halfW - d, z: halfD, nx: 0, nz: 1 }
  d -= bottomLen
  return { x: -halfW, z: halfD - d, nx: -1, nz: 0 }
}

/** Walks the sidewalk ring of one district, dropping alternating lamps and
 * trees plus the occasional bench. The ring sits between the kerb and the
 * plaza, so nothing lands on the asphalt. */
function perimeterProps(
  district: DistrictTile,
  lamps: StreetProp[],
  trees: StreetProp[],
  benches: StreetProp[],
): void {
  const vergeW = (district.curbWidth - district.plazaWidth) / 2
  const vergeD = (district.curbDepth - district.plazaDepth) / 2
  const halfW = district.curbWidth / 2 - vergeW / 2
  const halfD = district.curbDepth / 2 - vergeD / 2
  if (halfW < 2 || halfD < 2) return

  const total = 4 * halfW + 4 * halfD
  let i = 0
  for (let t = 0; t < total; t += PROP_STEP, i++) {
    const p = pointOnRectPerimeter(t, halfW, halfD)
    const rotationY = Math.atan2(p.nx, p.nz)
    const prop = {
      x: district.x + p.x,
      z: district.z + p.z,
      rotationY,
    }
    if (i % 2 === 0) lamps.push(prop)
    else trees.push(prop)

    // Benches face the road from just inside the lamp/tree line.
    if (i % BENCH_EVERY === 1) {
      benches.push({
        x: prop.x - p.nx * BENCH_INSET,
        z: prop.z - p.nz * BENCH_INSET,
        rotationY,
      })
    }
  }
}

/** Emits dashes along one road centreline. Positions snap to a global lattice
 * so the two districts either side of a shared road produce byte-identical
 * dashes, which `seen` then collapses into a single line. */
function lineDashes(
  fixed: number,
  from: number,
  to: number,
  horizontal: boolean,
  seen: Set<string>,
  out: RoadDash[],
): void {
  if (to <= from) return
  const start = Math.ceil(from / DASH_SPACING) * DASH_SPACING
  for (let v = start; v <= to; v += DASH_SPACING) {
    const x = horizontal ? v : fixed
    const z = horizontal ? fixed : v
    const key = `${horizontal ? 'h' : 'v'}:${Math.round(x * 100)}:${Math.round(z * 100)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ x, z, horizontal })
  }
}

/** One dashed centreline per plot edge. Neighbouring plots share an edge, so
 * the deduped result is one line down the middle of each road. */
function plotRoadDashes(
  minX: number,
  minZ: number,
  width: number,
  depth: number,
  seen: Set<string>,
  out: RoadDash[],
): void {
  const maxX = minX + width
  const maxZ = minZ + depth
  lineDashes(minZ, minX, maxX, true, seen, out)
  lineDashes(maxZ, minX, maxX, true, seen, out)
  lineDashes(minX, minZ, maxZ, false, seen, out)
  lineDashes(maxX, minZ, maxZ, false, seen, out)
}

function heightForLoc(loc: number): number {
  return Math.max(MIN_HEIGHT, Math.log2(loc + 1) * HEIGHT_UNIT)
}

function footprint(size: number): number {
  return Math.min(
    Math.max(size * (1 - FOOTPRINT_GUTTER_RATIO), MIN_FOOTPRINT),
    MAX_FOOTPRINT,
  )
}

function collectBuildings(
  node: LayoutTreeNode,
  centerX: number,
  centerZ: number,
  out: BuildingInstance[],
): void {
  if (node.rect.width <= 0 || node.rect.height <= 0) return

  if (node.type === 'file') {
    out.push({
      file: node,
      archetype: archetypeForRole(node.role),
      x: node.rect.x + node.rect.width / 2 - centerX,
      z: node.rect.y + node.rect.height / 2 - centerZ,
      width: footprint(node.rect.width),
      depth: footprint(node.rect.height),
      height: heightForLoc(node.loc),
      color: getLanguageColor(node.language),
    })
    return
  }

  for (const child of node.children)
    collectBuildings(child, centerX, centerZ, out)
}

/** Squeezes a plot's buildings into its buildable area, so the treemap keeps
 * its relative arrangement but nothing spills onto the sidewalk or the road. */
function applyPlotTransform(
  buildings: BuildingInstance[],
  transform: PlotTransform,
  out: BuildingInstance[],
): void {
  const { centerX, centerZ, scaleX, scaleZ } = transform
  for (const building of buildings) {
    building.x = centerX + (building.x - centerX) * scaleX
    building.z = centerZ + (building.z - centerZ) * scaleZ
    building.width = Math.max(building.width * scaleX, MIN_FOOTPRINT)
    building.depth = Math.max(building.depth * scaleZ, MIN_FOOTPRINT)
    building.height = Math.min(
      building.height,
      Math.min(building.width, building.depth) * MAX_ASPECT,
    )
    out.push(building)
  }
}

/** Pure: turns a laid-out file tree into flat building/district data for the 3D scene. */
export function prepareScene(root: LayoutFolderNode): PreparedScene {
  const centerX = root.rect.x + root.rect.width / 2
  const centerZ = root.rect.y + root.rect.height / 2

  const plots = root.children.filter(
    (child) => child.rect.width > 0 && child.rect.height > 0,
  )

  const districts: DistrictTile[] = []
  const buildings: BuildingInstance[] = []
  const roadDashes: RoadDash[] = []
  const seenDashes = new Set<string>()

  let districtIndex = 0
  for (const plot of plots) {
    const width = plot.rect.width
    const depth = plot.rect.height
    const x = plot.rect.x + width / 2 - centerX
    const z = plot.rect.y + depth / 2 - centerZ

    plotRoadDashes(
      plot.rect.x - centerX,
      plot.rect.y - centerZ,
      width,
      depth,
      seenDashes,
      roadDashes,
    )

    const curbWidth = Math.max(width - roadGutter(width) * 2, 0.1)
    const curbDepth = Math.max(depth - roadGutter(depth) * 2, 0.1)
    const plazaWidth = Math.max(curbWidth - sidewalkWidth(curbWidth) * 2, 0.05)
    const plazaDepth = Math.max(curbDepth - sidewalkWidth(curbDepth) * 2, 0.05)

    const plotBuildings: BuildingInstance[] = []
    collectBuildings(plot, centerX, centerZ, plotBuildings)

    if (plot.type === 'folder') {
      districts.push({
        name: plot.name,
        path: plot.path,
        x,
        z,
        width,
        depth,
        curbWidth,
        curbDepth,
        plazaWidth,
        plazaDepth,
        color: DISTRICT_PALETTE[districtIndex % DISTRICT_PALETTE.length],
      })
      districtIndex++
      applyPlotTransform(
        plotBuildings,
        {
          centerX: x,
          centerZ: z,
          scaleX: plazaWidth / width,
          scaleZ: plazaDepth / depth,
        },
        buildings,
      )
    } else {
      // A file sitting directly at the repo root gets no district tile, but it
      // still has to keep clear of the roads around its own plot.
      applyPlotTransform(
        plotBuildings,
        {
          centerX: x,
          centerZ: z,
          scaleX: curbWidth / width,
          scaleZ: curbDepth / depth,
        },
        buildings,
      )
    }
  }

  const streetLamps: StreetProp[] = []
  const trees: StreetProp[] = []
  const benches: StreetProp[] = []
  for (const district of districts) {
    perimeterProps(district, streetLamps, trees, benches)
  }

  return {
    buildings,
    districts,
    streetLamps,
    trees,
    benches,
    roadDashes,
    groundWidth: root.rect.width,
    groundDepth: root.rect.height,
  }
}
