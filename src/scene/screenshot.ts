export interface ScreenshotInfo {
  owner: string
  repo: string
  fileCount: number
  totalLoc: number
  districtCount: number
}

/** Composites the live WebGL canvas with a title-card overlay into a downloadable PNG. */
export function captureCityScreenshot(
  canvas: HTMLCanvasElement,
  info: ScreenshotInfo,
): string {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.drawImage(canvas, 0, 0)

  const cardHeight = Math.max(out.height * 0.16, 100)
  const gradient = ctx.createLinearGradient(
    0,
    out.height - cardHeight,
    0,
    out.height,
  )
  gradient.addColorStop(0, 'rgba(10,10,15,0)')
  gradient.addColorStop(1, 'rgba(10,10,15,0.92)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, out.height - cardHeight, out.width, cardHeight)

  const pad = Math.max(out.width * 0.025, 20)
  const titleSize = Math.max(out.height * 0.038, 20)
  const metaSize = Math.max(out.height * 0.022, 13)

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${titleSize}px system-ui, sans-serif`
  ctx.fillText(
    `${info.owner}/${info.repo}`,
    pad,
    out.height - pad - metaSize - 8,
  )

  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = `400 ${metaSize}px system-ui, sans-serif`
  ctx.fillText(
    `${info.fileCount.toLocaleString()} files · ${info.totalLoc.toLocaleString()} loc · ${info.districtCount} districts`,
    pad,
    out.height - pad,
  )

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `400 ${Math.round(metaSize * 0.8)}px system-ui, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('CodeScape', out.width - pad, out.height - pad)

  return out.toDataURL('image/png')
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
