import type { DistrictTile } from './prepareScene'

/** Asphalt sits just below the district tiles — a gap small enough to be
 * invisible, large enough to avoid z-fighting. Buildings stand at y=0, flush
 * with the district ground, so no kerb or plinth outlines their bases. */
const ROAD_Y = -0.03

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
      {/* The ground plane itself is the road network; district tiles are laid
          flat on top of it, inset by half a road width on every side. */}
      <mesh
        position={[0, ROAD_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundWidth * 1.4, groundDepth * 1.4]} />
        <meshStandardMaterial color="#55585f" roughness={0.95} />
      </mesh>
      {districts.map((district) => (
        <mesh
          key={district.path}
          position={[district.x, 0, district.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[district.curbWidth, district.curbDepth]} />
          <meshStandardMaterial color={district.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
