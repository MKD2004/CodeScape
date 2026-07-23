import * as THREE from 'three'
import type { Archetype } from './archetypes'

const boxGeometry = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)
const coneGeometry = new THREE.ConeGeometry(0.5, 1, 16).translate(0, 0.5, 0)
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16).translate(
  0,
  0.5,
  0,
)
const octahedronGeometry = new THREE.OctahedronGeometry(0.62).translate(
  0,
  0.62,
  0,
)

/** Unit geometries (footprint 1x1, height 1, base sitting on y=0) per role archetype. */
export const ARCHETYPE_GEOMETRIES: Record<Archetype, THREE.BufferGeometry> = {
  component: boxGeometry,
  default: boxGeometry,
  api: coneGeometry,
  model: cylinderGeometry,
  test: octahedronGeometry,
}
