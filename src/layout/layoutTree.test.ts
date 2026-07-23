import { describe, expect, it } from 'vitest'
import { buildTree, type FlatFile } from '../data/tree'
import {
  layoutTree,
  type LayoutFolderNode,
  type LayoutTreeNode,
} from './layoutTree'

function file(path: string, loc = 10): FlatFile {
  return {
    path,
    size: loc * 20,
    loc,
    language: 'TypeScript',
    role: 'other',
    complexity: 0,
  }
}

const CONTAINER = { x: 0, y: 0, width: 100, height: 100 }

function assertNoNaN(node: LayoutTreeNode) {
  expect(Number.isNaN(node.rect.x)).toBe(false)
  expect(Number.isNaN(node.rect.y)).toBe(false)
  expect(Number.isNaN(node.rect.width)).toBe(false)
  expect(Number.isNaN(node.rect.height)).toBe(false)
  expect(node.rect.width).toBeGreaterThanOrEqual(0)
  expect(node.rect.height).toBeGreaterThanOrEqual(0)
  if (node.type === 'folder') {
    for (const child of node.children) assertNoNaN(child)
  }
}

describe('layoutTree', () => {
  it('assigns the full container rect to the root', () => {
    const tree = buildTree([file('src/App.tsx')])
    const layout = layoutTree(tree, CONTAINER)
    expect(layout.rect).toEqual(CONTAINER)
  })

  it('handles an empty folder without crashing', () => {
    const tree = buildTree([])
    const layout = layoutTree(tree, CONTAINER)
    expect(layout.children).toEqual([])
    assertNoNaN(layout)
  })

  it('handles a single file', () => {
    const tree = buildTree([file('README.md', 5)])
    const layout = layoutTree(tree, CONTAINER)
    expect(layout.children).toHaveLength(1)
    expect(layout.children[0].rect).toEqual(CONTAINER)
    assertNoNaN(layout)
  })

  it('handles a very deeply nested folder', () => {
    const tree = buildTree([file('a/b/c/d/e/f/g/h/deep.ts', 3)])
    const layout = layoutTree(tree, CONTAINER)
    assertNoNaN(layout)

    let cursor: LayoutFolderNode = layout
    for (let i = 0; i < 8; i++) {
      expect(cursor.children).toHaveLength(1)
      const next = cursor.children[0]
      expect(next.type).toBe('folder')
      cursor = next as LayoutFolderNode
    }
    expect(cursor.children[0].type).toBe('file')
  })

  it('handles a huge flat folder with many files and no subfolders', () => {
    const files = Array.from({ length: 2000 }, (_, i) =>
      file(`file-${i}.ts`, (i % 50) + 1),
    )
    const tree = buildTree(files)
    const layout = layoutTree(tree, CONTAINER)
    expect(layout.children).toHaveLength(2000)
    assertNoNaN(layout)

    const totalArea = layout.children.reduce(
      (sum, child) => sum + child.rect.width * child.rect.height,
      0,
    )
    expect(totalArea).toBeCloseTo(CONTAINER.width * CONTAINER.height, 1)
  })

  it('gives a folder with only empty subfolders zero-size children without crashing', () => {
    const tree = buildTree([])
    tree.children.push({
      type: 'folder',
      name: 'empty',
      path: 'empty',
      children: [],
    })
    const layout = layoutTree(tree, CONTAINER)
    assertNoNaN(layout)
    expect(layout.children[0].rect.width).toBe(0)
    expect(layout.children[0].rect.height).toBe(0)
  })
})
