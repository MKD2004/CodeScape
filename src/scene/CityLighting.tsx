export function CityLighting({ drawDistance }: { drawDistance: number }) {
  return (
    <>
      <hemisphereLight args={['#bfe3ff', '#d8c9a0', 0.75]} />
      <directionalLight
        position={[40, 60, 20]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <fog attach="fog" args={['#bfe3ff', drawDistance * 0.4, drawDistance]} />
    </>
  )
}
