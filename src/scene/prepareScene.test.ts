import { describe, expect, it } from 'vitest'
import { buildTree, type FlatFile } from '../data/tree'
import type { FileRole } from '../data/classify'
import { layoutTree } from '../layout/layoutTree'
import { prepareScene } from './prepareScene'

function file(path: string, loc = 10, role: FileRole = 'other'): FlatFile {
  return {
    path,
    size: loc * 10,
    loc,
    language: 'TypeScript',
    role,
    complexity: 0,
  }
}

const CONTAINER = { x: 0, y: 0, width: 100, height: 100 }

describe('prepareScene', () => {
  it('creates one building per file', () => {
    const tree = buildTree([
      file('a.ts'),
      file('src/b.ts'),
      file('src/nested/c.ts'),
    ])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)
    expect(scene.buildings).toHaveLength(3)
  })

  it('creates one district per top-level folder, skipping root-level files', () => {
    const tree = buildTree([file('a.ts'), file('src/b.ts'), file('docs/c.md')])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)
    expect(scene.districts.map((d) => d.name).sort()).toEqual(['docs', 'src'])
  })

  it('gives taller buildings to files with more LOC', () => {
    const tree = buildTree([file('small.ts', 5), file('big.ts', 5000)])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)
    const small = scene.buildings.find((b) => b.file.path === 'small.ts')
    const big = scene.buildings.find((b) => b.file.path === 'big.ts')
    expect(small).toBeDefined()
    expect(big).toBeDefined()
    expect(big!.height).toBeGreaterThan(small!.height)
  })

  it('maps roles to archetypes', () => {
    const tree = buildTree([
      file('src/components/Button.tsx', 10, 'component'),
      file('src/api/users.ts', 10, 'api'),
      file('src/models/User.ts', 10, 'model'),
      file('src/foo.test.ts', 10, 'test'),
      file('README.md', 10, 'doc'),
    ])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)
    const byPath = Object.fromEntries(
      scene.buildings.map((b) => [b.file.path, b.archetype]),
    )
    expect(byPath['src/components/Button.tsx']).toBe('component')
    expect(byPath['src/api/users.ts']).toBe('api')
    expect(byPath['src/models/User.ts']).toBe('model')
    expect(byPath['src/foo.test.ts']).toBe('test')
    expect(byPath['README.md']).toBe('default')
  })

  it('produces no buildings or districts for an empty tree', () => {
    const tree = buildTree([])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)
    expect(scene.buildings).toEqual([])
    expect(scene.districts).toEqual([])
  })

  it('centers building positions around the origin', () => {
    const tree = buildTree([file('a.ts'), file('b.ts')])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)
    for (const building of scene.buildings) {
      expect(Math.abs(building.x)).toBeLessThanOrEqual(CONTAINER.width / 2)
      expect(Math.abs(building.z)).toBeLessThanOrEqual(CONTAINER.height / 2)
    }
  })

  it('draws one dashed centreline per road, not one per district', () => {
    const tree = buildTree([
      file('src/a.ts', 40),
      file('src/b.ts', 60),
      file('docs/c.md', 50),
      file('test/d.ts', 55),
    ])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)

    expect(scene.roadDashes.length).toBeGreaterThan(0)
    const positions = scene.roadDashes.map(
      (d) => `${d.horizontal}:${d.x.toFixed(2)}:${d.z.toFixed(2)}`,
    )
    expect(new Set(positions).size).toBe(positions.length)

    // Every dash must sit on a shared plot boundary — the true centre of the
    // road. Drawing them inside each district's own gutter instead puts two
    // parallel lines in every road.
    const centerX = CONTAINER.x + CONTAINER.width / 2
    const centerZ = CONTAINER.y + CONTAINER.height / 2
    const edgesX = new Set<string>()
    const edgesZ = new Set<string>()
    for (const plot of layout.children) {
      edgesX.add((plot.rect.x - centerX).toFixed(2))
      edgesX.add((plot.rect.x + plot.rect.width - centerX).toFixed(2))
      edgesZ.add((plot.rect.y - centerZ).toFixed(2))
      edgesZ.add((plot.rect.y + plot.rect.height - centerZ).toFixed(2))
    }
    for (const dash of scene.roadDashes) {
      const onEdge = dash.horizontal
        ? edgesZ.has(dash.z.toFixed(2))
        : edgesX.has(dash.x.toFixed(2))
      expect(onEdge).toBe(true)
    }
  })

  it('places street props on the sidewalk, never on the road', () => {
    const tree = buildTree([
      file('src/a.ts', 40),
      file('src/b.ts', 60),
      file('docs/c.md', 50),
    ])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)

    const props = [...scene.trees, ...scene.streetLamps, ...scene.benches]
    expect(props.length).toBeGreaterThan(0)
    for (const prop of props) {
      const onGround = scene.districts.some(
        (d) =>
          Math.abs(prop.x - d.x) <= d.curbWidth / 2 &&
          Math.abs(prop.z - d.z) <= d.curbDepth / 2,
      )
      expect(onGround).toBe(true)
    }
  })

  it('keeps every building inside its district plaza', () => {
    const files = Array.from({ length: 40 }, (_, i) =>
      file(`src/mod${i}/f${i}.ts`, i * 7 + 3),
    )
    const tree = buildTree([...files, file('docs/readme.md', 20)])
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)

    for (const building of scene.buildings) {
      const district = scene.districts.find((d) =>
        building.file.path.startsWith(`${d.path}/`),
      )
      expect(district).toBeDefined()
      expect(Math.abs(building.x - district!.x) + building.width / 2).
        toBeLessThanOrEqual(district!.plazaWidth / 2 + 1e-6)
      expect(Math.abs(building.z - district!.z) + building.depth / 2).
        toBeLessThanOrEqual(district!.plazaDepth / 2 + 1e-6)
    }
  })

  it('gives every building a positive footprint', () => {
    const files = Array.from({ length: 200 }, (_, i) => file(`f${i}.ts`, i + 1))
    const tree = buildTree(files)
    const layout = layoutTree(tree, CONTAINER)
    const scene = prepareScene(layout)
    for (const building of scene.buildings) {
      expect(building.width).toBeGreaterThan(0)
      expect(building.depth).toBeGreaterThan(0)
      expect(building.height).toBeGreaterThan(0)
    }
  })
})
