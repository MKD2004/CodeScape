export function Sun({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[14, 16, 16]} />
      <meshBasicMaterial color="#fff6d8" toneMapped={false} />
    </mesh>
  )
}
