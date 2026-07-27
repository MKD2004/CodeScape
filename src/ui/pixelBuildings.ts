// Deterministic pseudo-random pool of skyline buildings for the pixel hero's
// scroll-driven flythrough. A fixed pool is reused (recycled via modulo depth)
// rather than mounted/unmounted per spawn.
//
// Perspective model: single vanishing point (VP) shared by the road and every
// building/dash. `depth` is 0 (camera plane, nearest) .. 1 (horizon, farthest).
// perspectiveFactor(depth) is the ONE hyperbolic falloff function every
// foreshortened quantity (building scale, lane offset, ground-Y offset, dash
// size/spacing) is derived from, so everything converges to the same VP and
// forshortens at the same rate.

export interface PixelBuilding {
  id: number
  lane: number // -1 (far left) .. 1 (far right), 0 excluded (road)
  baseDepth: number // 0..1, this building's phase offset in the depth cycle
  colorIndex: number // 0..6, index into the building color palette
  cols: number
  rows: number
  windowSeed: number
}

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const BUILDING_COLORS_DAY = [
  '#9B6FD1', // purple
  '#D9A441', // mustard/gold
  '#4FC3C7', // cyan
  '#D9548B', // magenta/pink
  '#5FA85E', // green
  '#C75450', // red
  '#4A7FC7', // blue
]

// Vibrant synthwave/neon night palette (matches the reference skyline).
export const BUILDING_COLORS_NIGHT = [
  '#8B5CF6', // violet
  '#22D3EE', // cyan
  '#F472B6', // pink
  '#6366F1', // indigo/blue
  '#38BDF8', // sky blue
  '#C084FC', // light purple
  '#FB7185', // rose
]

export const WINDOW_LIT_NIGHT = '#FFE9A8'
export const WINDOW_LIT_NIGHT_ALT = '#9BF6FF'
export const WINDOW_UNLIT_NIGHT = 'rgba(0,0,0,0.45)'
export const WINDOW_DAY = 'rgba(0,0,0,0.16)'

/** Fraction of a building's width given to the darker "side wall" panel. */
export const BUILDING_SIDE_FRACTION = 0.28

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, n))
}

/** Darken (or lighten, factor > 1) a `#rrggbb` color — used for the flat-shaded side wall. */
export function shadeColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const toHex = (c: number) => clamp255(Math.round(c * factor)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// --- Shared perspective model ---------------------------------------------

/** Where sky meets ground / where every converging line meets, in vh. */
export const VP_Y_VH = 55
export const VP_X_VW = 50

/** Half-width of the road at the very bottom of the viewport, in vw. */
export const ROAD_HALF_WIDTH_VW = 15

/** Width of each guardrail strip at the bottom of the viewport, in vw. */
export const GUARDRAIL_WIDTH_VW = 3.4

const P_STEEPNESS = 9
const P_EPS = 0.12

/**
 * The one perspective falloff function. depth=0 -> camera plane (max),
 * depth=1 -> horizon/VP (near zero). Hyperbolic, so equal steps in depth
 * produce accelerating screen-space change as depth -> 0 (the "flying
 * forward" feel) — every foreshortened quantity below is `unit * factor`.
 */
export function perspectiveFactor(depth: number): number {
  return 1 / (depth * P_STEEPNESS + P_EPS)
}

const GROUND_UNIT_VH = 34.5 // foot distance below horizon = GROUND_UNIT * factor
const LANE_UNIT_VW = 38.7 // lane-x offset = LANE_UNIT * factor * lane
const ROW_UNIT_VH = 8.5 // building height = rows * ROW_UNIT * factor
const COL_UNIT_VH = 6.5 // building width = cols * COL_UNIT * factor (vh-based so no aspect skew)

export function generateBuildings(count: number): PixelBuilding[] {
  const rand = mulberry32(1337)
  const buildings: PixelBuilding[] = []
  for (let i = 0; i < count; i++) {
    const sideSign = i % 2 === 0 ? -1 : 1
    const lane = sideSign * (0.35 + rand() * 0.65)
    const sizeRoll = rand()
    const cols = sizeRoll < 0.33 ? 2 : sizeRoll < 0.7 ? 3 : 4
    const rows = 4 + Math.floor(rand() * 4) // 4..7
    buildings.push({
      id: i,
      lane,
      baseDepth: i / count,
      colorIndex: Math.floor(rand() * BUILDING_COLORS_DAY.length),
      cols,
      rows,
      windowSeed: Math.floor(rand() * 1e6),
    })
  }
  return buildings
}

export function isWindowLit(windowSeed: number, index: number): boolean {
  const rand = mulberry32(windowSeed + index * 7919)
  return rand() > 0.4
}

export function isWindowGlowing(windowSeed: number, index: number): boolean {
  const rand = mulberry32(windowSeed + index * 104729)
  return rand() > 0.82
}

export interface BuildingScreenState {
  centerXVw: number // horizontal center, in vw (convert with viewport width)
  topVh: number // top edge, in vh (convert with viewport height)
  widthVh: number // width expressed as a vh-based length (convert with viewport height, keeps aspect stable)
  heightVh: number
  opacity: number
  zIndex: number
}

function depthOf(baseDepth: number, progress: number, loops: number): number {
  const raw = baseDepth - progress * loops
  return ((raw % 1) + 1) % 1
}

function fadeFor(depth: number): number {
  // fade in just after spawning at the horizon, fade out just before recycling
  if (depth > 0.94) return (1 - depth) / 0.06
  if (depth < 0.05) return depth / 0.05
  return 1
}

export function computeBuildingScreenState(
  building: PixelBuilding,
  progress: number,
  loops: number,
): BuildingScreenState {
  const depth = depthOf(building.baseDepth, progress, loops)
  const factor = perspectiveFactor(depth)

  const heightVh = building.rows * ROW_UNIT_VH * factor
  const widthVh = building.cols * COL_UNIT_VH * factor
  const footYVh = VP_Y_VH + GROUND_UNIT_VH * factor
  const centerXVw = VP_X_VW + LANE_UNIT_VW * factor * building.lane

  return {
    centerXVw,
    topVh: footYVh - heightVh,
    widthVh,
    heightVh,
    opacity: fadeFor(depth),
    zIndex: Math.round(factor * 1000),
  }
}

export interface DashScreenState {
  centerXVw: number
  topVh: number
  widthVw: number
  heightVh: number
  opacity: number
}

export function computeDashScreenState(
  baseDepth: number,
  progress: number,
  loops: number,
): DashScreenState {
  const depth = depthOf(baseDepth, progress, loops)
  const factor = perspectiveFactor(depth)
  const yVh = VP_Y_VH + GROUND_UNIT_VH * factor
  const roadHalfWidthAtY = ROAD_HALF_WIDTH_VW * ((yVh - VP_Y_VH) / (100 - VP_Y_VH))
  return {
    centerXVw: VP_X_VW,
    topVh: yVh,
    widthVw: roadHalfWidthAtY * 0.22,
    heightVh: 0.5 * factor,
    opacity: fadeFor(depth),
  }
}

export interface LampScreenState {
  centerXVw: number
  headTopVh: number
  headSizeVh: number
  opacity: number
  zIndex: number
}

const LAMP_LANE_VW = ROAD_HALF_WIDTH_VW + GUARDRAIL_WIDTH_VW + 3 // just outside the guardrail, unforeshortened base offset
const LAMP_RISE_VH = 14 // how far the glowing head floats above the ground point, at factor=1
const LAMP_HEAD_UNIT_VH = 2.6

export function computeLampScreenState(
  baseDepth: number,
  side: -1 | 1,
  progress: number,
  loops: number,
): LampScreenState {
  const depth = depthOf(baseDepth, progress, loops)
  const factor = perspectiveFactor(depth)
  const footYVh = VP_Y_VH + GROUND_UNIT_VH * factor
  const laneXVw = VP_X_VW + side * LAMP_LANE_VW * factor
  return {
    centerXVw: laneXVw,
    headTopVh: footYVh - LAMP_RISE_VH * factor,
    headSizeVh: LAMP_HEAD_UNIT_VH * factor,
    opacity: fadeFor(depth),
    zIndex: Math.round(factor * 1000) + 1, // sit just above the building at the same depth
  }
}
