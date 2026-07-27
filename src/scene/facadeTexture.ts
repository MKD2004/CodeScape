import * as THREE from 'three'

const CANVAS_WIDTH = 128
const CANVAS_HEIGHT = 256

function buildFacadeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const cols = 5
  const rows = 14
  const cellW = canvas.width / cols
  const cellH = canvas.height / rows
  const padX = cellW * 0.22
  const padY = cellH * 0.3

  ctx.fillStyle = 'rgba(10, 15, 25, 0.6)'
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillRect(
        col * cellW + padX,
        row * cellH + padY,
        cellW - padX * 2,
        cellH - padY * 2,
      )
    }
  }
  return canvas
}

let cached: THREE.CanvasTexture | null = null

/**
 * Shared low-poly window-grid facade texture, multiplied against each
 * building's instance color. Wrapped + repeat-tiled (not stretched 0→1)
 * so a single window "cell" stays a constant size regardless of how tall
 * or squat the face it lands on is — a stretched 0→1 UV combined with
 * this canvas's tall aspect ratio is what produced the diagonal smearing
 * on short/thin faces (roof caps, spires) before this fix.
 *
 * Buildings share one InstancedMesh (and therefore one material/texture)
 * per archetype for draw-call efficiency, so `repeat` can't be varied
 * per-instance without a custom shader — instead every face just repeats
 * the same crisp, fixed-size window cell, which reads correctly at any
 * building height instead of stretching a single image to fit.
 */
export function getFacadeTexture(): THREE.CanvasTexture {
  if (cached) return cached
  const texture = new THREE.CanvasTexture(buildFacadeCanvas())
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 8)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.colorSpace = THREE.SRGBColorSpace
  cached = texture
  return texture
}
