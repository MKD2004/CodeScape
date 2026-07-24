import type { DistrictTile } from '../scene/prepareScene'

const SIZE = 140
const PADDING = 6

export function Minimap({
  districts,
  groundWidth,
  groundDepth,
}: {
  districts: DistrictTile[]
  groundWidth: number
  groundDepth: number
}) {
  const extent = Math.max(groundWidth, groundDepth, 1)
  const scale = (SIZE - PADDING * 2) / extent

  function toMapX(x: number): number {
    return SIZE / 2 + x * scale
  }
  function toMapY(z: number): number {
    return SIZE / 2 + z * scale
  }

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-white/15 bg-black/70 p-1.5 backdrop-blur">
      <svg width={SIZE} height={SIZE} role="img" aria-label="City minimap">
        <rect
          x={0}
          y={0}
          width={SIZE}
          height={SIZE}
          fill="#111318"
          rx={4}
        />
        {districts.map((district) => {
          const w = Math.max(district.width * scale, 1)
          const h = Math.max(district.depth * scale, 1)
          return (
            <rect
              key={district.path}
              x={toMapX(district.x) - w / 2}
              y={toMapY(district.z) - h / 2}
              width={w}
              height={h}
              fill={district.color}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={0.5}
            />
          )
        })}
      </svg>
    </div>
  )
}
