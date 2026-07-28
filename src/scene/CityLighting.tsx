/** Unit direction of the visible sun mesh, so cast shadows agree with where
 * the sun actually hangs in the sky. */
const SUN_DIRECTION = [0.53, 0.8, 0.27] as const

const SHADOW_MAP_SIZE = 2048

export function CityLighting({ drawDistance }: { drawDistance: number }) {
  // Three's default directional-light shadow camera is a 10-unit box at the
  // origin. Over a city hundreds of units across that leaves nearly everything
  // outside the shadow map, and whatever does fall inside lands on texels far
  // too coarse to keep a shadow attached to the building casting it — which
  // reads as a dark edge sitting offset around every base.
  const halfExtent = drawDistance * 0.8
  const distance = drawDistance * 2
  const texelWorldSize = (halfExtent * 2) / SHADOW_MAP_SIZE
  // Sized in texels rather than hardcoded: too little bias and the ground
  // self-shadows into an acne ring at each base, too much and the shadow peels
  // away from the building instead.
  const normalBias = texelWorldSize * 1.5

  return (
    <>
      <hemisphereLight args={['#bfe3ff', '#d8c9a0', 0.75]} />
      <directionalLight
        position={[
          SUN_DIRECTION[0] * distance,
          SUN_DIRECTION[1] * distance,
          SUN_DIRECTION[2] * distance,
        ]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
        shadow-camera-left={-halfExtent}
        shadow-camera-right={halfExtent}
        shadow-camera-top={halfExtent}
        shadow-camera-bottom={-halfExtent}
        shadow-camera-near={1}
        shadow-camera-far={distance * 2}
        shadow-bias={-0.0002}
        shadow-normalBias={normalBias}
      />
      <fog attach="fog" args={['#bfe3ff', drawDistance * 0.4, drawDistance]} />
    </>
  )
}
