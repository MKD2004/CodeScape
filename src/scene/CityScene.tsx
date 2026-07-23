import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import type { RepoCityData } from '../data/pipeline'
import { layoutTree } from '../layout/layoutTree'
import { Buildings } from './Buildings'
import { CameraRig } from './CameraRig'
import { CityLighting } from './CityLighting'
import { Districts } from './Districts'
import { prepareScene } from './prepareScene'

const LAYOUT_SIZE = 300

export function CityScene({ data }: { data: RepoCityData }) {
  const scene = useMemo(() => {
    const layout = layoutTree(data.root, {
      x: 0,
      y: 0,
      width: LAYOUT_SIZE,
      height: LAYOUT_SIZE,
    })
    return prepareScene(layout)
  }, [data])

  const drawDistance = Math.max(LAYOUT_SIZE, 150)
  const startDistance = Math.max(scene.groundWidth, scene.groundDepth, 20) * 0.7

  return (
    <Canvas
      className="absolute inset-0"
      shadows
      camera={{
        position: [startDistance, startDistance * 0.8, startDistance],
        fov: 55,
        near: 0.1,
        far: drawDistance * 1.5,
      }}
    >
      <color attach="background" args={['#0a0a0f']} />
      <CityLighting drawDistance={drawDistance} />
      <Districts
        districts={scene.districts}
        groundWidth={scene.groundWidth}
        groundDepth={scene.groundDepth}
      />
      <Buildings buildings={scene.buildings} />
      <CameraRig />
    </Canvas>
  )
}
