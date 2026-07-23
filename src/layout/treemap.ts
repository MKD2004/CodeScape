export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function worstAspectRatio(rowAreas: number[], length: number): number {
  const sum = rowAreas.reduce((a, b) => a + b, 0)
  const max = Math.max(...rowAreas)
  const min = Math.min(...rowAreas)
  const lengthSq = length * length
  return Math.max(
    (lengthSq * max) / (sum * sum),
    (sum * sum) / (lengthSq * min),
  )
}

function layoutRow(rowAreas: number[], rect: Rect): Rect[] {
  const rowSum = rowAreas.reduce((a, b) => a + b, 0)
  const horizontal = rect.width >= rect.height
  const rects: Rect[] = []

  if (horizontal) {
    const stripWidth = rect.height > 0 ? rowSum / rect.height : 0
    let y = rect.y
    for (const area of rowAreas) {
      const height = rowSum > 0 ? (area / rowSum) * rect.height : 0
      rects.push({ x: rect.x, y, width: stripWidth, height })
      y += height
    }
  } else {
    const stripHeight = rect.width > 0 ? rowSum / rect.width : 0
    let x = rect.x
    for (const area of rowAreas) {
      const width = rowSum > 0 ? (area / rowSum) * rect.width : 0
      rects.push({ x, y: rect.y, width, height: stripHeight })
      x += width
    }
  }
  return rects
}

function shrinkRect(rect: Rect, rowAreas: number[]): Rect {
  const rowSum = rowAreas.reduce((a, b) => a + b, 0)
  const horizontal = rect.width >= rect.height

  if (horizontal) {
    const stripWidth = rect.height > 0 ? rowSum / rect.height : 0
    return {
      x: rect.x + stripWidth,
      y: rect.y,
      width: Math.max(rect.width - stripWidth, 0),
      height: rect.height,
    }
  }

  const stripHeight = rect.width > 0 ? rowSum / rect.width : 0
  return {
    x: rect.x,
    y: rect.y + stripHeight,
    width: rect.width,
    height: Math.max(rect.height - stripHeight, 0),
  }
}

/**
 * Squarified treemap (Bruls/Huizing/van Wijk) over non-negative weights,
 * scaled to fill `rect`'s area. Returns one Rect per weight, same order
 * as the input array.
 */
export function squarify(weights: number[], rect: Rect): Rect[] {
  if (weights.length === 0) return []

  if (rect.width <= 0 || rect.height <= 0) {
    return weights.map(() => ({ x: rect.x, y: rect.y, width: 0, height: 0 }))
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight <= 0) {
    return weights.map(() => ({ x: rect.x, y: rect.y, width: 0, height: 0 }))
  }

  const scale = (rect.width * rect.height) / totalWeight
  const indexed = weights.map((weight, index) => ({
    index,
    area: Math.max(weight, 0) * scale,
  }))
  indexed.sort((a, b) => b.area - a.area)

  const orderedRects: Rect[] = new Array(weights.length)
  let remaining = indexed
  let currentRect = rect

  while (remaining.length > 0) {
    const shortSide = Math.max(
      Math.min(currentRect.width, currentRect.height),
      1e-9,
    )

    let row = [remaining[0]]
    let rowAreas = [remaining[0].area]

    let i = 1
    while (i < remaining.length) {
      const candidateAreas = [...rowAreas, remaining[i].area]
      if (
        worstAspectRatio(candidateAreas, shortSide) <=
        worstAspectRatio(rowAreas, shortSide)
      ) {
        row = [...row, remaining[i]]
        rowAreas = candidateAreas
        i++
      } else {
        break
      }
    }

    const rowRects = layoutRow(rowAreas, currentRect)
    row.forEach((item, idx) => {
      orderedRects[item.index] = rowRects[idx]
    })

    currentRect = shrinkRect(currentRect, rowAreas)
    remaining = remaining.slice(row.length)
  }

  return orderedRects
}
