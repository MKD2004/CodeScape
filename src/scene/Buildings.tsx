import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { ARCHETYPES, type Archetype } from './archetypes'
import { ARCHETYPE_GEOMETRIES } from './geometry'
import type { BuildingInstance } from './prepareScene'
import { useCityStore } from '../state/cityStore'

const material = new THREE.MeshStandardMaterial({ toneMapped: false })
const SELECTED_BRIGHTNESS = 1.6

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

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const color = new THREE.Color()

    buildings.forEach((building, i) => {
      matrix.compose(
        new THREE.Vector3(building.x, 0, building.z),
        quaternion,
        new THREE.Vector3(building.width, building.height, building.depth),
      )
      mesh.setMatrixAt(i, matrix)

      color.set(building.color)
      if (building.file.path === selectedPath) {
        color.multiplyScalar(SELECTED_BRIGHTNESS)
      }
      mesh.setColorAt(i, color)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [buildings, selectedPath])

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
