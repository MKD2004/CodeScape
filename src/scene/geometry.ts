import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Archetype } from './archetypes'

/** Combines several unit-space geometries into one, so each archetype stays a
 * single InstancedMesh (flat draw-call cost regardless of repo size) while
 * looking like an actual low-poly skyscraper instead of a bare primitive.
 * Every part is built within local y 0..1 so it scales cleanly with height. */
function buildGeometry(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false)
  merged.computeVertexNormals()
  return merged
}

// Setback tower: broad base, narrower mid-section, thin rooftop antenna —
// the classic stepped-skyscraper silhouette, for component/default files.
const blockGeometry = buildGeometry([
  new THREE.BoxGeometry(1, 0.72, 1).translate(0, 0.36, 0),
  new THREE.BoxGeometry(0.62, 0.22, 0.62).translate(0, 0.83, 0),
  new THREE.CylinderGeometry(0.03, 0.03, 0.06, 6).translate(0, 0.97, 0),
])

// Slim tower with a low pyramidal (4-sided, low-poly) roof + spire — API entry points.
const towerGeometry = buildGeometry([
  new THREE.BoxGeometry(0.72, 0.68, 0.72).translate(0, 0.34, 0),
  new THREE.ConeGeometry(0.54, 0.22, 4).rotateY(Math.PI / 4).translate(0, 0.79, 0),
  new THREE.CylinderGeometry(0.025, 0.025, 0.1, 6).translate(0, 0.95, 0),
])

// Cylindrical drum tower with a flat disc cap and a radio mast — model/data-store silos.
const siloGeometry = buildGeometry([
  new THREE.CylinderGeometry(0.46, 0.46, 0.78, 8).translate(0, 0.39, 0),
  new THREE.CylinderGeometry(0.52, 0.52, 0.06, 8).translate(0, 0.81, 0),
  new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6).translate(0, 0.92, 0),
])

// Three-tier "wedding cake" silhouette — a distinct stepped skyline landmark for tests.
const setbackGeometry = buildGeometry([
  new THREE.BoxGeometry(1, 0.42, 1).translate(0, 0.21, 0),
  new THREE.BoxGeometry(0.62, 0.3, 0.62).translate(0, 0.57, 0),
  new THREE.BoxGeometry(0.36, 0.28, 0.36).translate(0, 0.86, 0),
])

/** Unit geometries (footprint ~1x1, height 1, base sitting on y=0) per role archetype. */
export const ARCHETYPE_GEOMETRIES: Record<Archetype, THREE.BufferGeometry> = {
  component: blockGeometry,
  default: blockGeometry,
  api: towerGeometry,
  model: siloGeometry,
  test: setbackGeometry,
}
