import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { ARCHETYPES, type Archetype } from './archetypes'
import { ARCHETYPE_GEOMETRIES } from './geometry'
import { createFacadeMaterial } from './facadeMaterial'
import type { BuildingInstance } from './prepareScene'
import { useCityStore } from '../state/cityStore'

const material = createFacadeMaterial()
const SELECTED_BRIGHTNESS = 1.6

const RISE_DURATION_MS = 550
const RISE_STAGGER_MS = 500

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function ArchetypeGroup({
  archetype,
  buildings,
}: {
  archetype: Archetype
  buildings: BuildingInstance[]
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = ARCHETYPE_GEOMETRIES[archetype]
  const select = useCityStore((s) => s.select)
  const clearSelection = useCityStore((s) => s.clearSelection)
  const selectedPath = useCityStore((s) => s.selected?.path)

  const animStartRef = useRef(0)
  const animatingRef = useRef(false)

  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const quaternion = useMemo(() => new THREE.Quaternion(), [])
  const scaleVec = useMemo(() => new THREE.Vector3(), [])
  const posVec = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  function applyInstances(heightScale: (index: number) => number) {
    const mesh = meshRef.current
    if (!mesh) return

    buildings.forEach((building, i) => {
      const scale = heightScale(i)
      posVec.set(building.x, 0, building.z)
      scaleVec.set(building.width, Math.max(building.height * scale, 0.001), building.depth)
      matrix.compose(posVec, quaternion, scaleVec)
      mesh.setMatrixAt(i, matrix)

      color.set(building.color)
      if (building.file.path === selectedPath) {
        color.multiplyScalar(SELECTED_BRIGHTNESS)
      }
      mesh.setColorAt(i, color)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  useEffect(() => {
    animStartRef.current = performance.now()
    animatingRef.current = buildings.length > 0
  }, [buildings])

  useLayoutEffect(() => {
    if (animatingRef.current) return
    applyInstances(() => 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, selectedPath])

  useFrame(() => {
    if (!animatingRef.current) return
    const elapsed = performance.now() - animStartRef.current
    const count = buildings.length || 1
    let stillAnimating = false

    applyInstances((i) => {
      const delay = (i / count) * RISE_STAGGER_MS
      const progress = Math.min(
        Math.max((elapsed - delay) / RISE_DURATION_MS, 0),
        1,
      )
      if (progress < 1) stillAnimating = true
      return easeOutCubic(progress)
    })

    if (!stillAnimating) animatingRef.current = false
  })

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    const id = event.instanceId
    if (id === undefined) return
    const building = buildings[id]
    if (building.file.path === selectedPath) clearSelection()
    else select(building.file)
  }

  if (buildings.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, buildings.length]}
      onClick={handleClick}
      castShadow
      receiveShadow
    />
  )
}

export function Buildings({ buildings }: { buildings: BuildingInstance[] }) {
  const grouped = useMemo(() => {
    const map = new Map<Archetype, BuildingInstance[]>()
    for (const archetype of ARCHETYPES) map.set(archetype, [])
    for (const building of buildings)
      map.get(building.archetype)?.push(building)
    return map
  }, [buildings])

  return (
    <>
      {ARCHETYPES.map((archetype) => (
        <ArchetypeGroup
          key={archetype}
          archetype={archetype}
          buildings={grouped.get(archetype) ?? []}
        />
      ))}
    </>
  )
}
