import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '../state/cityStore'

const MOVE_SPEED = 12
const WALK_HEIGHT = 1.7

function useKeyboardState() {
  const keys = useRef<Record<string, boolean>>({})
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])
  return keys
}

function WalkMovement() {
  const keys = useKeyboardState()
  const { camera } = useThree()
  const direction = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.y = WALK_HEIGHT
  }, [camera])

  useFrame((_, delta) => {
    const pressed = keys.current
    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, camera.up).normalize()

    direction.current.set(0, 0, 0)
    if (pressed.KeyW) direction.current.add(forward.current)
    if (pressed.KeyS) direction.current.sub(forward.current)
    if (pressed.KeyD) direction.current.add(right.current)
    if (pressed.KeyA) direction.current.sub(right.current)

    if (direction.current.lengthSq() > 0) {
      direction.current.normalize().multiplyScalar(MOVE_SPEED * delta)
      camera.position.add(direction.current)
    }
    camera.position.y = WALK_HEIGHT
  })

  return null
}

export function CameraRig() {
  const cameraMode = useCityStore((s) => s.cameraMode)
  const setCameraMode = useCityStore((s) => s.setCameraMode)

  if (cameraMode === 'walk') {
    return (
      <>
        <PointerLockControls onUnlock={() => setCameraMode('orbit')} />
        <WalkMovement />
      </>
    )
  }

  return (
    <OrbitControls
      makeDefault
      minDistance={5}
      maxDistance={250}
      maxPolarAngle={Math.PI / 2.1}
    />
  )
}
