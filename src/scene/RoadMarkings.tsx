import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { RoadDash } from './prepareScene'

const geometry = new THREE.BoxGeometry(2.4, 0.02, 0.3)
const material = new THREE.MeshStandardMaterial({
  color: '#f4f4f4',
  roughness: 0.7,
  toneMapped: false,
})

/** Sits between the asphalt (y = -0.03) and the district tiles (y = 0). */
const DASH_Y = -0.015

/** White dashed centreline down every road, rendered as one InstancedMesh. */
export function RoadMarkings({ dashes }: { dashes: RoadDash[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const quaternion = useMemo(() => new THREE.Quaternion(), [])
  const scale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const position = useMemo(() => new THREE.Vector3(), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    dashes.forEach((dash, i) => {
      position.set(dash.x, DASH_Y, dash.z)
      quaternion.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        dash.horizontal ? 0 : Math.PI / 2,
      )
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  }, [dashes, matrix, quaternion, scale, position])

  if (dashes.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, dashes.length]} />
  )
}
