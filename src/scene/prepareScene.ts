import type { FileNode } from '../data/tree'
import type {
  LayoutFileNode,
  LayoutFolderNode,
  LayoutTreeNode,
} from '../layout/layoutTree'
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
  /**
   * Nesting level of this community. 0 is a top-level folder, which fronts
   * onto the road network; 1 and deeper are folders inside it, drawn as blocks
   * within their parent's grounds. A file sitting loose in the repo root is
   * never a community and gets no tile at all.
   */
  level: number
  x: number
  z: number
  /** Full plot, gutter included — the treemap rect. Used by the minimap. */
  width: number
  depth: number
  /** The visible community boundary: the plot minus its gutter on every side.
   * At level 0 that gutter is half a road, deeper in it is the lane that
   * separates one block from its siblings. */
  curbWidth: number
  curbDepth: number
  /** Buildable area: the boundary minus the verge inside it. */
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
const HEIGHT_UNIT = 4.4
/** Roughly two storeys — nothing should read as a shed next to a 6m tree. */
const MIN_HEIGHT = 5.5
/** Tallest a building may stand relative to its own footprint. Height tracks
 * LOC, but a small file in a dense district also gets a narrow footprint, and
 * without this the pair produces a needle rather than a building. */
const MAX_ASPECT = 9
/** Widest a building may sprawl relative to its own height — the other half of
 * the same rule, keeping a broad plot from producing a pancake.
 *
 * This deliberately replaces an absolute footprint ceiling. A fixed cap in
 * metres does not scale with the plot it sits in: a folder holding one file
 * gets a plot sized by that file's LOC, and capping the building at a constant
 * left the rest of the plot as a wide skirt of bare ground around the base. */
const MAX_SPREAD = 2.6
/** Floor for any tile or plaza dimension, so a sliver of a plot still produces
 * geometry with a positive size. */
const MIN_TILE = 0.05

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

/** Gap a nested community gives up on every side. Its sibling gives up the
 * same, so the parent's ground shows through between them as a lane — that
 * strip is what makes each folder's boundary visible. */
const BLOCK_GUTTER = 2.4
const MAX_BLOCK_RATIO = 0.12

function blockGutter(size: number): number {
  return Math.min(BLOCK_GUTTER, size * MAX_BLOCK_RATIO)
}

/** Margin inside a nested community's boundary, so its towers stand within the
 * grounds rather than straddling the edge. */
const BLOCK_MARGIN = 1.4
const MAX_BLOCK_MARGIN_RATIO = 0.09

function blockMargin(curbSize: number): number {
  return Math.min(BLOCK_MARGIN, curbSize * MAX_BLOCK_MARGIN_RATIO)
}

const DISTRICT_PALETTE = [
  '#8bc44c',
  '#e8c15a',
  '#6fb8d1',
  '#e0895a',
  '#c9a8e0',
  '#e07a7a',
]

/** Mixes a hex colour towards white (positive amount) or black (negative). */
function shade(color: string, amount: number): string {
  const value = Number.parseInt(color.slice(1), 16)
  const target = amount < 0 ? 0 : 255
  const k = Math.abs(amount)
  const mix = (channel: number) => Math.round(channel + (target - channel) * k)
  const r = mix((value >> 16) & 255)
  const g = mix((value >> 8) & 255)
  const b = mix(value & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/** A nested community keeps its parent's hue — they are one neighbourhood —
 * but alternates lighter and darker per level, so its boundary stays legible
 * against the ground it sits on. */
function nestedColor(parent: string, level: number): string {
  return shade(parent, level % 2 === 1 ? -0.18 : 0.16)
}

/** Spacing along the sidewalk between consecutive props (lamps and trees
 * alternate, so each kind repeats every `PROP_STEP * 2`). */
const PROP_STEP = 9
const BENCH_EVERY = 4
/** How far a bench sits in from the sidewalk centreline, towards the plaza. */
const BENCH_INSET = 0.9
const DASH_SPACING = 5

/**
 * One axis of the map from layout space into world space, as
 * `world = layout * scale + offset`. Every community shrinks its children into
 * its own grounds; composing these keeps a tower inside the boundary of every
 * ancestor without any node needing to know how deep it sits.
 */
interface Axis {
  scale: number
  offset: number
}

const IDENTITY: Axis = { scale: 1, offset: 0 }

function project(axis: Axis, value: number): number {
  return value * axis.scale + axis.offset
}

/** Composes a shrink by `k` about world point `center` onto an existing axis. */
function shrinkAbout(axis: Axis, center: number, k: number): Axis {
  return { scale: axis.scale * k, offset: axis.offset * k + center * (1 - k) }
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

/** Walks the sidewalk ring of one street-level community, dropping alternating
 * lamps and trees plus the occasional bench. The ring sits between the kerb and
 * the plaza, so nothing lands on the asphalt. */
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
 * the deduped result is one line down the middle of each road. Only the
 * street-level plots get these — the lanes between nested blocks are internal
 * paths, not roads. */
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

/** Footprint from the plot, leaving a proportional gutter so neighbouring
 * buildings never touch, then held to `MAX_SPREAD` so a broad plot cannot flatten
 * its building into a slab. */
function footprint(plotSize: number, height: number): number {
  const size = Math.min(
    plotSize * (1 - FOOTPRINT_GUTTER_RATIO),
    height * MAX_SPREAD,
  )
  return Math.max(size, MIN_FOOTPRINT)
}

interface SceneContext {
  centerX: number
  centerZ: number
  districts: DistrictTile[]
  buildings: BuildingInstance[]
}

function addBuilding(
  node: LayoutFileNode,
  ax: Axis,
  az: Axis,
  ctx: SceneContext,
): void {
  const plotWidth = node.rect.width * ax.scale
  const plotDepth = node.rect.height * az.scale
  if (plotWidth <= 0 || plotDepth <= 0) return

  // Height comes from LOC, then bounds the footprint; the footprint bounds the
  // height back only in the opposite regime (a narrow plot), so the two clamps
  // never fight over the same building.
  const storeys = heightForLoc(node.loc)
  const width = footprint(plotWidth, storeys)
  const depth = footprint(plotDepth, storeys)
  ctx.buildings.push({
    file: node,
    archetype: archetypeForRole(node.role),
    x: project(ax, node.rect.x + node.rect.width / 2 - ctx.centerX),
    z: project(az, node.rect.y + node.rect.height / 2 - ctx.centerZ),
    width,
    depth,
    height: Math.min(storeys, Math.min(width, depth) * MAX_ASPECT),
    color: getLanguageColor(node.language),
  })
}

/**
 * Turns one folder into a community: a bounded plot of ground carrying its own
 * towers, then recurses so every folder inside it becomes a smaller community
 * within those grounds.
 */
function addCommunity(
  folder: LayoutFolderNode,
  level: number,
  color: string,
  ax: Axis,
  az: Axis,
  ctx: SceneContext,
): void {
  const width = folder.rect.width * ax.scale
  const depth = folder.rect.height * az.scale
  if (width <= 0 || depth <= 0) return

  const x = project(ax, folder.rect.x + folder.rect.width / 2 - ctx.centerX)
  const z = project(az, folder.rect.y + folder.rect.height / 2 - ctx.centerZ)

  // At street level the plot gives up half a road on each side; deeper in it
  // gives up a narrow lane instead, which is what separates one block of a
  // community from the next.
  const gutterW = level === 0 ? roadGutter(width) : blockGutter(width)
  const gutterD = level === 0 ? roadGutter(depth) : blockGutter(depth)
  const curbWidth = Math.max(width - gutterW * 2, MIN_TILE)
  const curbDepth = Math.max(depth - gutterD * 2, MIN_TILE)

  const vergeW = level === 0 ? sidewalkWidth(curbWidth) : blockMargin(curbWidth)
  const vergeD = level === 0 ? sidewalkWidth(curbDepth) : blockMargin(curbDepth)
  const plazaWidth = Math.max(curbWidth - vergeW * 2, MIN_TILE)
  const plazaDepth = Math.max(curbDepth - vergeD * 2, MIN_TILE)

  ctx.districts.push({
    name: folder.name,
    path: folder.path,
    level,
    x,
    z,
    width,
    depth,
    curbWidth,
    curbDepth,
    plazaWidth,
    plazaDepth,
    color,
  })

  const childAx = shrinkAbout(ax, x, plazaWidth / width)
  const childAz = shrinkAbout(az, z, plazaDepth / depth)

  for (const child of folder.children) {
    if (child.type === 'folder') {
      addCommunity(
        child,
        level + 1,
        nestedColor(color, level + 1),
        childAx,
        childAz,
        ctx,
      )
    } else {
      addBuilding(child, childAx, childAz, ctx)
    }
  }
}

/** Pure: turns a laid-out file tree into flat building/district data for the 3D scene. */
export function prepareScene(root: LayoutFolderNode): PreparedScene {
  const ctx: SceneContext = {
    centerX: root.rect.x + root.rect.width / 2,
    centerZ: root.rect.y + root.rect.height / 2,
    districts: [],
    buildings: [],
  }

  const plots: LayoutTreeNode[] = root.children.filter(
    (child) => child.rect.width > 0 && child.rect.height > 0,
  )

  const roadDashes: RoadDash[] = []
  const seenDashes = new Set<string>()

  let paletteIndex = 0
  for (const plot of plots) {
    const width = plot.rect.width
    const depth = plot.rect.height

    plotRoadDashes(
      plot.rect.x - ctx.centerX,
      plot.rect.y - ctx.centerZ,
      width,
      depth,
      seenDashes,
      roadDashes,
    )

    if (plot.type === 'folder') {
      addCommunity(
        plot,
        0,
        DISTRICT_PALETTE[paletteIndex % DISTRICT_PALETTE.length],
        IDENTITY,
        IDENTITY,
        ctx,
      )
      paletteIndex++
      continue
    }

    // A file sitting loose in the repo root belongs to no community, so it gets
    // no boundary of its own — just enough of an inset to keep it off the road.
    const x = plot.rect.x + width / 2 - ctx.centerX
    const z = plot.rect.y + depth / 2 - ctx.centerZ
    const curbWidth = Math.max(width - roadGutter(width) * 2, MIN_TILE)
    const curbDepth = Math.max(depth - roadGutter(depth) * 2, MIN_TILE)
    addBuilding(
      plot,
      shrinkAbout(IDENTITY, x, curbWidth / width),
      shrinkAbout(IDENTITY, z, curbDepth / depth),
      ctx,
    )
  }

  const streetLamps: StreetProp[] = []
  const trees: StreetProp[] = []
  const benches: StreetProp[] = []
  for (const district of ctx.districts) {
    // Street furniture belongs on streets; the lanes inside a community are
    // too narrow to line with lamp posts.
    if (district.level === 0) {
      perimeterProps(district, streetLamps, trees, benches)
    }
  }

  return {
    buildings: ctx.buildings,
    districts: ctx.districts,
    streetLamps,
    trees,
    benches,
    roadDashes,
    groundWidth: root.rect.width,
    groundDepth: root.rect.height,
  }
}
