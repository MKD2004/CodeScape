import * as THREE from 'three'

/**
 * Windows are sized in metres, not in fractions of a building. One window bay
 * is 3.2m of frontage and one storey is 3.6m tall, so a window on a squat
 * two-storey block is exactly the same size as a window on a sixty-metre tower.
 * That constant real-world size is what makes a building read as "twelve
 * floors" instead of as a stretched box, and it is what ties the facade to the
 * rest of the scene's 1 unit = 1 metre scale.
 */
export const BAY_WIDTH = 3.2
export const FLOOR_HEIGHT = 3.6

/** The glazed opening inside one bay, in metres. */
const WINDOW_WIDTH = 2
const WINDOW_HEIGHT = 1.8
/** Spandrel under the glass — the sill sits this far above the floor slab. */
const SILL_HEIGHT = 1

/**
 * Bays baked into a single tile. One would be enough to cover a facade by
 * repeat-wrapping, but a 4x4 patch lets the lit/unlit variation repeat every
 * ~13m rather than on every single window.
 */
export const TILE_COLS = 4
export const TILE_ROWS = 4

/** Size of one texture tile in metres — the divisor the facade shader uses. */
export const TILE_WIDTH = BAY_WIDTH * TILE_COLS
export const TILE_HEIGHT = FLOOR_HEIGHT * TILE_ROWS

/** Chosen so every bay, storey, window and sill lands on a whole pixel; with
 * nearest-neighbour magnification a fractional bay would give neighbouring
 * windows visibly different widths. */
const PIXELS_PER_METRE = 10

export const CANVAS_WIDTH = TILE_WIDTH * PIXELS_PER_METRE
export const CANVAS_HEIGHT = TILE_HEIGHT * PIXELS_PER_METRE

export interface WindowRect {
  /** Pixel rect in canvas space, y measured downwards from the tile top. */
  x: number
  y: number
  width: number
  height: number
  /** Opacity of the dark glass fill: low reads as a lit pane, high as an empty one. */
  shade: number
}

/** Deterministic per-pane variation, so the tile does not look silk-screened. */
function paneShade(col: number, row: number): number {
  const raw = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453
  return 0.4 + (raw - Math.floor(raw)) * 0.34
}

/** Metres to whole canvas pixels. The bay and storey sizes above are chosen so
 * this rounding only ever absorbs floating-point noise, but snapping keeps a
 * later tweak to them from producing panes a pixel wider than their neighbours. */
function px(metres: number): number {
  return Math.round(metres * PIXELS_PER_METRE)
}

/** Pure layout of one tile's panes, kept separate from the canvas so the
 * proportions can be asserted in tests without a DOM. */
export function windowRects(): WindowRect[] {
  const rects: WindowRect[] = []
  for (let row = 0; row < TILE_ROWS; row++) {
    for (let col = 0; col < TILE_COLS; col++) {
      rects.push({
        x: px(col * BAY_WIDTH + (BAY_WIDTH - WINDOW_WIDTH) / 2),
        // Canvas y runs downwards, so the sill gap belongs below the glass.
        y: px(row * FLOOR_HEIGHT + FLOOR_HEIGHT - SILL_HEIGHT - WINDOW_HEIGHT),
        width: px(WINDOW_WIDTH),
        height: px(WINDOW_HEIGHT),
        shade: paneShade(col, row),
      })
    }
  }
  return rects
}

function buildFacadeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  // White wall, so each building's instance color comes through untinted.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const rect of windowRects()) {
    ctx.fillStyle = `rgba(10, 15, 25, ${rect.shade.toFixed(3)})`
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  }
  return canvas
}

let cached: THREE.CanvasTexture | null = null

/**
 * Shared window-grid facade texture, multiplied against each building's
 * instance color.
 *
 * The tile is left at repeat 1:1 on purpose: buildings share one InstancedMesh
 * (and therefore one texture) per archetype, so the tiling cannot be varied
 * per-instance here. Instead the facade shader in `Buildings.tsx` projects
 * object-space position scaled by the instance matrix onto this tile, which
 * gives every building the same metres-per-window density no matter its size.
 */
export function getFacadeTexture(): THREE.CanvasTexture {
  if (cached) return cached
  const texture = new THREE.CanvasTexture(buildFacadeCanvas())
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 4
  texture.colorSpace = THREE.SRGBColorSpace
  cached = texture
  return texture
}
