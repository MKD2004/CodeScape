import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Archetype } from './archetypes'

/** Combines several unit-space geometries into one, so each archetype stays a
 * single InstancedMesh (flat draw-call cost regardless of repo size) while
 * looking like an actual low-poly skyscraper instead of a bare primitive.
 * Every shape is a straight vertical extrusion (no tapering to a point) —
 * only the cross-section/roof detail changes per archetype. */
function buildGeometry(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false)
  merged.computeVertexNormals()
  return merged
}

// Straight rectangular tower with a thin flat roof cap — plain office tower.
const blockGeometry = buildGeometry([
  new THREE.BoxGeometry(0.62, 0.95, 0.62).translate(0, 0.475, 0),
  new THREE.BoxGeometry(0.7, 0.05, 0.7).translate(0, 0.975, 0),
])

// Slim tower with a flat overhanging helipad slab — API entry points.
const towerGeometry = buildGeometry([
  new THREE.BoxGeometry(0.5, 0.94, 0.5).translate(0, 0.47, 0),
  new THREE.BoxGeometry(0.68, 0.04, 0.68).translate(0, 0.96, 0),
  new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6).translate(0, 1.02, 0),
])

// Straight cylindrical tower with a flat disc cap and radio mast — model/data-store silos.
const siloGeometry = buildGeometry([
  new THREE.CylinderGeometry(0.34, 0.34, 0.95, 10).translate(0, 0.475, 0),
  new THREE.CylinderGeometry(0.4, 0.4, 0.04, 10).translate(0, 0.97, 0),
  new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6).translate(0, 1.05, 0),
])

// Twin paired towers, straight and thin — a distinct landmark silhouette for tests.
const testGeometry = buildGeometry([
  new THREE.BoxGeometry(0.34, 0.92, 0.34).translate(-0.2, 0.46, 0),
  new THREE.BoxGeometry(0.34, 1.0, 0.34).translate(0.2, 0.5, 0),
])

// Hexagonal prism tower, straight — utility/config buildings.
const configGeometry = buildGeometry([
  new THREE.CylinderGeometry(0.4, 0.4, 0.96, 6).translate(0, 0.48, 0),
  new THREE.CylinderGeometry(0.44, 0.44, 0.04, 6).translate(0, 0.98, 0),
])

// Rectangular tower with a mid-height belt band — style sheets.
const styleGeometry = buildGeometry([
  new THREE.BoxGeometry(0.6, 0.95, 0.6).translate(0, 0.475, 0),
  new THREE.BoxGeometry(0.7, 0.04, 0.7).translate(0, 0.52, 0),
])

/** Unit geometries (footprint ~1x1, height 1, base sitting on y=0) per role archetype. */
export const ARCHETYPE_GEOMETRIES: Record<Archetype, THREE.BufferGeometry> = {
  component: blockGeometry,
  default: blockGeometry,
  api: towerGeometry,
  model: siloGeometry,
  test: testGeometry,
  config: configGeometry,
  style: styleGeometry,
}
