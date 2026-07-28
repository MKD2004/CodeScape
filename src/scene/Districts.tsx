import type { DistrictTile } from './prepareScene'

/**
 * Buildings stand with their base at y=0. The ground has to sit *below* that,
 * not level with it: a tile at exactly y=0 is coplanar with every building's
 * bottom face, the depth buffer cannot separate the two, and the tie renders as
 * a hard outline ringing the base of every building in the city.
 */
const GROUND_Y = -0.04
/** Asphalt goes under the community tiles, far enough to never fight them. */
const ROAD_Y = -0.09
/** Each nesting level stacks a hair higher so a block draws cleanly over its
 * parent's ground. Small enough to read as flat paint, not as a step. */
const LEVEL_STEP = 0.008
/** However deep the tree goes, the ground stays below the buildings. */
const MAX_GROUND_Y = -0.005

function tileY(level: number): number {
  return Math.min(GROUND_Y + level * LEVEL_STEP, MAX_GROUND_Y)
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
      {/* The ground plane itself is the road network. Community tiles are laid
          flat on top of it, inset by half a road width on every side. */}
      <mesh
        position={[0, ROAD_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundWidth * 1.4, groundDepth * 1.4]} />
        <meshStandardMaterial color="#55585f" roughness={0.95} />
      </mesh>
      {/* Pre-order, so a community's ground is drawn before the blocks on it. */}
      {districts.map((district) => (
        <mesh
          key={district.path}
          position={[district.x, tileY(district.level), district.z]}
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
