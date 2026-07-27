import { Canvas, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import type { RepoCityData } from '../data/pipeline'
import { layoutTree } from '../layout/layoutTree'
import { Buildings } from './Buildings'
import { CameraRig } from './CameraRig'
import { CityLighting } from './CityLighting'
import { Districts } from './Districts'
import { prepareScene, type PreparedScene } from './prepareScene'

const LAYOUT_SIZE = 300

function CanvasReadyBridge({
  onReady,
}: {
  onReady: (canvas: HTMLCanvasElement) => void
}) {
  const { gl } = useThree()
  useEffect(() => {
    onReady(gl.domElement)
  }, [gl, onReady])
  return null
}

export function CityScene({
  data,
  onSceneReady,
  onCanvasReady,
}: {
  data: RepoCityData
  onSceneReady?: (scene: PreparedScene) => void
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}) {
  const scene = useMemo(() => {
    const layout = layoutTree(data.root, {
      x: 0,
      y: 0,
      width: LAYOUT_SIZE,
      height: LAYOUT_SIZE,
    })
    return prepareScene(layout)
  }, [data])

  useEffect(() => {
    onSceneReady?.(scene)
  }, [scene, onSceneReady])

  const drawDistance = Math.max(LAYOUT_SIZE, 150)
  const startDistance = Math.max(scene.groundWidth, scene.groundDepth, 20) * 0.7

  return (
    <Canvas
      className="absolute inset-0"
      shadows
      gl={{ preserveDrawingBuffer: true }}
      camera={{
        position: [startDistance, startDistance * 0.8, startDistance],
        fov: 55,
        near: 0.1,
        far: drawDistance * 1.5,
      }}
    >
      <Sky sunPosition={[40, 60, 20]} turbidity={2} rayleigh={0.8} />
      {onCanvasReady && <CanvasReadyBridge onReady={onCanvasReady} />}
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
