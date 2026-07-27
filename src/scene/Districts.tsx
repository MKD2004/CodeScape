import type { DistrictTile } from './prepareScene'

const ROAD_GUTTER_RATIO = 0.1
const MAX_ROAD_GUTTER = 3.2
const CURB_INSET = 0.35

function roadGutter(size: number): number {
  return Math.min(size * ROAD_GUTTER_RATIO, MAX_ROAD_GUTTER)
}

export function Districts({
  districts,
  groundWidth,
  groundDepth,
}: {
  districts: DistrictTile[]
  groundWidth: number
  groundDepth: number
}) {
  return (
    <group>
      {/* Asphalt roads — the ground plane itself is the road network; districts sit as raised plazas above it. */}
      <mesh
        position={[0, -0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundWidth * 1.4, groundDepth * 1.4]} />
        <meshStandardMaterial color="#55585f" roughness={0.95} />
      </mesh>
      {districts.map((district) => {
        const gutterW = roadGutter(district.width)
        const gutterD = roadGutter(district.depth)
        const curbWidth = Math.max(district.width - gutterW * 2, 0.1)
        const curbDepth = Math.max(district.depth - gutterD * 2, 0.1)
        const plazaWidth = Math.max(curbWidth - CURB_INSET, 0.05)
        const plazaDepth = Math.max(curbDepth - CURB_INSET, 0.05)
        return (
          <group key={district.path}>
            <mesh position={[district.x, -0.02, district.z]} receiveShadow>
              <boxGeometry args={[curbWidth, 0.06, curbDepth]} />
              <meshStandardMaterial color="#d8d4c8" roughness={0.9} />
            </mesh>
            <mesh position={[district.x, 0.01, district.z]} receiveShadow>
              <boxGeometry args={[plazaWidth, 0.06, plazaDepth]} />
              <meshStandardMaterial color={district.color} roughness={0.9} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
