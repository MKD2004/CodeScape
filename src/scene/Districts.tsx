import type { DistrictTile } from './prepareScene'

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
      <mesh
        position={[0, -0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundWidth * 1.4, groundDepth * 1.4]} />
        <meshStandardMaterial color="#111318" />
      </mesh>
      {districts.map((district) => (
        <mesh
          key={district.path}
          position={[district.x, -0.02, district.z]}
          receiveShadow
        >
          <boxGeometry args={[district.width, 0.06, district.depth]} />
          <meshStandardMaterial color={district.color} />
        </mesh>
      ))}
    </group>
  )
}
