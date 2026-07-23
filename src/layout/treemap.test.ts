import { describe, expect, it } from 'vitest'
import { squarify, type Rect } from './treemap'

function area(rect: Rect): number {
  return rect.width * rect.height
}

function overlaps(a: Rect, b: Rect): boolean {
  const eps = 1e-6
  return (
    a.x + a.width > b.x + eps &&
    b.x + b.width > a.x + eps &&
    a.y + a.height > b.y + eps &&
    b.y + b.height > a.y + eps
  )
}

function withinBounds(rect: Rect, bounds: Rect): boolean {
  const eps = 1e-6
  return (
    rect.x >= bounds.x - eps &&
    rect.y >= bounds.y - eps &&
    rect.x + rect.width <= bounds.x + bounds.width + eps &&
    rect.y + rect.height <= bounds.y + bounds.height + eps
  )
}

describe('squarify', () => {
  it('returns an empty array for no weights', () => {
    expect(squarify([], { x: 0, y: 0, width: 10, height: 10 })).toEqual([])
  })

  it('gives a single weight the entire rect', () => {
    const rect = { x: 0, y: 0, width: 10, height: 5 }
    expect(squarify([42], rect)).toEqual([rect])
  })

  it('splits two equal weights into two equal halves', () => {
    const rects = squarify([1, 1], { x: 0, y: 0, width: 2, height: 1 })
    expect(rects).toEqual([
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 1 },
    ])
  })

  it('produces no NaN or negative dimensions for varied weights', () => {
    const rects = squarify([6, 6, 4, 3, 2, 2], {
      x: 0,
      y: 0,
      width: 6,
      height: 4,
    })
    for (const rect of rects) {
      expect(Number.isNaN(rect.x)).toBe(false)
      expect(Number.isNaN(rect.y)).toBe(false)
      expect(Number.isNaN(rect.width)).toBe(false)
      expect(Number.isNaN(rect.height)).toBe(false)
      expect(rect.width).toBeGreaterThanOrEqual(0)
      expect(rect.height).toBeGreaterThanOrEqual(0)
    }
  })

  it('tiles the container exactly (areas sum to container area)', () => {
    const rect = { x: 0, y: 0, width: 6, height: 4 }
    const rects = squarify([6, 6, 4, 3, 2, 2], rect)
    const total = rects.reduce((sum, r) => sum + area(r), 0)
    expect(total).toBeCloseTo(area(rect), 6)
  })

  it('gives every rect area proportional to its weight', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 }
    const weights = [50, 30, 15, 5]
    const rects = squarify(weights, rect)
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    weights.forEach((weight, i) => {
      const expectedArea = (weight / totalWeight) * area(rect)
      expect(area(rects[i])).toBeCloseTo(expectedArea, 4)
    })
  })

  it('produces no overlapping rects and stays within the container bounds', () => {
    const rect = { x: 0, y: 0, width: 20, height: 13 }
    const weights = [23, 19, 17, 13, 11, 7, 5, 3, 2, 1]
    const rects = squarify(weights, rect)

    for (const r of rects) {
      expect(withinBounds(r, rect)).toBe(true)
    }
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(overlaps(rects[i], rects[j])).toBe(false)
      }
    }
  })

  it('returns zero-size rects when total weight is zero', () => {
    const rects = squarify([0, 0, 0], { x: 0, y: 0, width: 10, height: 10 })
    for (const rect of rects) {
      expect(rect.width).toBe(0)
      expect(rect.height).toBe(0)
    }
  })

  it('returns zero-size rects when the container has no area', () => {
    const rects = squarify([1, 2, 3], { x: 0, y: 0, width: 0, height: 10 })
    for (const rect of rects) {
      expect(rect.width).toBe(0)
      expect(rect.height).toBe(0)
    }
  })

  it('handles a large number of weights without crashing', () => {
    const weights = Array.from({ length: 500 }, (_, i) => i + 1)
    const rect = { x: 0, y: 0, width: 100, height: 100 }
    const rects = squarify(weights, rect)
    expect(rects).toHaveLength(500)
    const total = rects.reduce((sum, r) => sum + area(r), 0)
    expect(total).toBeCloseTo(area(rect), 3)
  })
})
