export function CityLighting({ drawDistance }: { drawDistance: number }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[40, 60, 20]} intensity={1.2} castShadow />
      <fog attach="fog" args={['#0a0a0f', drawDistance * 0.3, drawDistance]} />
    </>
  )
}
