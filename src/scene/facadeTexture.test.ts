import { describe, expect, it } from 'vitest'
import {
  BAY_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FLOOR_HEIGHT,
  TILE_COLS,
  TILE_HEIGHT,
  TILE_ROWS,
  TILE_WIDTH,
  windowRects,
} from './facadeTexture'

const PX_PER_METRE = CANVAS_WIDTH / TILE_WIDTH

describe('facade window grid', () => {
  it('keeps the bay and storey at human proportions', () => {
    // A storey shorter than a doorway or a bay narrower than the glass in it
    // would make buildings read as doll houses next to the 1.7m walk camera.
    expect(FLOOR_HEIGHT).toBeGreaterThanOrEqual(3)
    expect(FLOOR_HEIGHT).toBeLessThanOrEqual(4.5)
    expect(BAY_WIDTH).toBeGreaterThanOrEqual(2.5)
    expect(BAY_WIDTH).toBeLessThanOrEqual(4.5)
  })

  it('lays out one window per bay per storey', () => {
    expect(windowRects()).toHaveLength(TILE_COLS * TILE_ROWS)
  })

  it('sizes the tile so the metre grid and the pixel grid agree', () => {
    expect(TILE_WIDTH).toBe(BAY_WIDTH * TILE_COLS)
    expect(TILE_HEIGHT).toBe(FLOOR_HEIGHT * TILE_ROWS)
    expect(CANVAS_HEIGHT / TILE_HEIGHT).toBeCloseTo(PX_PER_METRE, 10)
  })

  it('spaces panes evenly on the whole-pixel grid', () => {
    // Nearest-neighbour magnification turns an uneven pitch into visibly
    // mismatched gaps between windows on the same wall.
    const rects = windowRects()
    for (const rect of rects) {
      expect(Number.isInteger(rect.x)).toBe(true)
      expect(Number.isInteger(rect.y)).toBe(true)
    }
    for (let col = 1; col < TILE_COLS; col++) {
      expect(rects[col].x - rects[col - 1].x).toBe(BAY_WIDTH * PX_PER_METRE)
    }
    for (let row = 1; row < TILE_ROWS; row++) {
      expect(rects[row * TILE_COLS].y - rects[(row - 1) * TILE_COLS].y).toBe(
        FLOOR_HEIGHT * PX_PER_METRE,
      )
    }
  })

  it('gives every pane the same size and a landscape aspect', () => {
    const rects = windowRects()
    const { width, height } = rects[0]
    for (const rect of rects) {
      expect(rect.width).toBe(width)
      expect(rect.height).toBe(height)
    }
    const aspect = width / height
    expect(aspect).toBeGreaterThan(1)
    expect(aspect).toBeLessThan(1.6)
  })

  it('leaves a pier and a sill around every pane', () => {
    for (const [i, rect] of windowRects().entries()) {
      const col = i % TILE_COLS
      const row = Math.floor(i / TILE_COLS)
      const cellX = col * BAY_WIDTH * PX_PER_METRE
      const cellY = row * FLOOR_HEIGHT * PX_PER_METRE
      const cellW = BAY_WIDTH * PX_PER_METRE
      const cellH = FLOOR_HEIGHT * PX_PER_METRE

      // Strictly inside its own cell, so panes never merge into a glass band.
      expect(rect.x).toBeGreaterThan(cellX)
      expect(rect.y).toBeGreaterThan(cellY)
      expect(rect.x + rect.width).toBeLessThan(cellX + cellW)
      expect(rect.y + rect.height).toBeLessThan(cellY + cellH)

      // Glass should dominate the bay without swallowing it whole.
      const coverage = (rect.width * rect.height) / (cellW * cellH)
      expect(coverage).toBeGreaterThan(0.2)
      expect(coverage).toBeLessThan(0.6)
    }
  })

  it('varies pane shading without going opaque or invisible', () => {
    const shades = windowRects().map((r) => r.shade)
    for (const shade of shades) {
      expect(shade).toBeGreaterThan(0.2)
      expect(shade).toBeLessThan(0.9)
    }
    expect(new Set(shades.map((s) => s.toFixed(3))).size).toBeGreaterThan(1)
  })
})
