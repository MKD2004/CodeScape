import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { StreetProp } from './prepareScene'

// Everything here is modelled at the scene's 1 unit = 1 metre scale, the same
// scale buildings and the 1.7 walk-mode eye height use: a ~6m tree, an ~8m
// lamp post and a ~1.8m bench. Anything smaller reads as toy-sized next to a
// twelve-storey building.
const treeTrunkGeometry = new THREE.CylinderGeometry(0.22, 0.32, 2.3, 6).translate(0, 1.15, 0)
const treeFoliageGeometry = new THREE.IcosahedronGeometry(2, 0).translate(0, 4, 0)
const lampPoleGeometry = new THREE.CylinderGeometry(0.14, 0.2, 7.2, 6).translate(0, 3.6, 0)
const lampHeadGeometry = new THREE.SphereGeometry(0.42, 8, 6).translate(0, 7.35, 0)

const benchGeometry = mergeGeometries([
  new THREE.BoxGeometry(1.8, 0.12, 0.64).translate(0, 0.64, 0),
  new THREE.BoxGeometry(1.8, 0.48, 0.1).translate(0, 0.88, -0.26),
  new THREE.BoxGeometry(0.1, 0.64, 0.1).translate(-0.8, 0.32, 0.26),
  new THREE.BoxGeometry(0.1, 0.64, 0.1).translate(0.8, 0.32, 0.26),
])
benchGeometry.computeVertexNormals()

const trunkMaterial = new THREE.MeshStandardMaterial({
  color: '#6b4a2f',
  flatShading: true,
  roughness: 0.9,
})
const foliageMaterial = new THREE.MeshStandardMaterial({
  color: '#4a9c4a',
  flatShading: true,
  roughness: 0.85,
})
const poleMaterial = new THREE.MeshStandardMaterial({
  color: '#3a3d44',
  flatShading: true,
  roughness: 0.6,
  metalness: 0.2,
})
const lampMaterial = new THREE.MeshStandardMaterial({
  color: '#fff2c2',
  emissive: '#ffe28a',
  emissiveIntensity: 1.2,
  toneMapped: false,
})
const benchMaterial = new THREE.MeshStandardMaterial({
  color: '#8a6a4a',
  flatShading: true,
  roughness: 0.9,
})

// Street props are all drawn at a fixed, uniform scale — unlike buildings,
// nothing here should ever vary per-instance. Clamped as a safety net so a
// future per-instance size (e.g. randomized tree variety) can never blow up
// to building-scale and swallow the camera.
const MIN_PROP_SCALE = 0.85
const MAX_PROP_SCALE = 1.15
const BASE_PROP_SCALE = 1

function clampPropScale(value: number): number {
  return Math.min(Math.max(value, MIN_PROP_SCALE), MAX_PROP_SCALE)
}

function PropLayer({
  geometry,
  material,
  props,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  props: StreetProp[]
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const quaternion = useMemo(() => new THREE.Quaternion(), [])
  const scale = useMemo(() => {
    const s = clampPropScale(BASE_PROP_SCALE)
    return new THREE.Vector3(s, s, s)
  }, [])
  const position = useMemo(() => new THREE.Vector3(), [])
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    props.forEach((prop, i) => {
      position.set(prop.x, 0, prop.z)
      quaternion.setFromAxisAngle(axis, prop.rotationY)
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  }, [props, matrix, quaternion, scale, position, axis])

  if (props.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, props.length]}
      castShadow
      receiveShadow
    />
  )
}

export function StreetFurniture({
  trees,
  streetLamps,
  benches,
}: {
  trees: StreetProp[]
  streetLamps: StreetProp[]
  benches: StreetProp[]
}) {
  return (
    <>
      <PropLayer geometry={treeTrunkGeometry} material={trunkMaterial} props={trees} />
      <PropLayer geometry={treeFoliageGeometry} material={foliageMaterial} props={trees} />
      <PropLayer geometry={lampPoleGeometry} material={poleMaterial} props={streetLamps} />
      <PropLayer geometry={lampHeadGeometry} material={lampMaterial} props={streetLamps} />
      <PropLayer geometry={benchGeometry} material={benchMaterial} props={benches} />
    </>
  )
}
