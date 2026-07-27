import * as THREE from 'three'

function buildFacadeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 128
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

/** Shared low-poly window-grid facade texture, multiplied against each building's instance color. */
export function getFacadeTexture(): THREE.CanvasTexture {
  if (cached) return cached
  const texture = new THREE.CanvasTexture(buildFacadeCanvas())
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  cached = texture
  return texture
}
