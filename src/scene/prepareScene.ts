import type { FileNode } from '../data/tree'
import type { LayoutFolderNode, LayoutTreeNode } from '../layout/layoutTree'
import { archetypeForRole, type Archetype } from './archetypes'
import { getLanguageColor } from './colors'

export interface BuildingInstance {
  file: FileNode
  archetype: Archetype
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
}

export interface DistrictTile {
  name: string
  path: string
  x: number
  z: number
  width: number
  depth: number
  color: string
}

export interface PreparedScene {
  buildings: BuildingInstance[]
  districts: DistrictTile[]
  groundWidth: number
  groundDepth: number
}

const FOOTPRINT_GUTTER_RATIO = 0.12
const MIN_FOOTPRINT = 0.05
const HEIGHT_UNIT = 4.4
const MIN_HEIGHT = 1.3

const DISTRICT_PALETTE = [
  '#8bc44c',
  '#e8c15a',
  '#6fb8d1',
  '#e0895a',
  '#c9a8e0',
  '#e07a7a',
]

function heightForLoc(loc: number): number {
  return Math.max(MIN_HEIGHT, Math.log2(loc + 1) * HEIGHT_UNIT)
}

function insetSize(size: number): number {
  return Math.min(size * FOOTPRINT_GUTTER_RATIO, size * 0.4)
}

function collectBuildings(
  node: LayoutTreeNode,
  centerX: number,
  centerZ: number,
  out: BuildingInstance[],
): void {
  if (node.rect.width <= 0 || node.rect.height <= 0) return

  if (node.type === 'file') {
    const width = Math.max(
      node.rect.width - insetSize(node.rect.width),
      MIN_FOOTPRINT,
    )
    const depth = Math.max(
      node.rect.height - insetSize(node.rect.height),
      MIN_FOOTPRINT,
    )
    out.push({
      file: node,
      archetype: archetypeForRole(node.role),
      x: node.rect.x + node.rect.width / 2 - centerX,
      z: node.rect.y + node.rect.height / 2 - centerZ,
      width,
      depth,
      height: heightForLoc(node.loc),
      color: getLanguageColor(node.language),
    })
    return
  }

  for (const child of node.children)
    collectBuildings(child, centerX, centerZ, out)
}

/** Pure: turns a laid-out file tree into flat building/district data for the 3D scene. */
export function prepareScene(root: LayoutFolderNode): PreparedScene {
  const centerX = root.rect.x + root.rect.width / 2
  const centerZ = root.rect.y + root.rect.height / 2

  const buildings: BuildingInstance[] = []
  collectBuildings(root, centerX, centerZ, buildings)

  const districts: DistrictTile[] = root.children
    .filter((child): child is LayoutFolderNode => child.type === 'folder')
    .filter((folder) => folder.rect.width > 0 && folder.rect.height > 0)
    .map((folder, index) => ({
      name: folder.name,
      path: folder.path,
      x: folder.rect.x + folder.rect.width / 2 - centerX,
      z: folder.rect.y + folder.rect.height / 2 - centerZ,
      width: folder.rect.width,
      depth: folder.rect.height,
      color: DISTRICT_PALETTE[index % DISTRICT_PALETTE.length],
    }))

  return {
    buildings,
    districts,
    groundWidth: root.rect.width,
    groundDepth: root.rect.height,
  }
}
