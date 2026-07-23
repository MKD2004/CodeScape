import { describe, expect, it } from 'vitest'
import { buildTree, type FlatFile, type FolderNode } from './tree'

function file(path: string): FlatFile {
  return {
    path,
    size: 100,
    loc: 10,
    language: 'TypeScript',
    role: 'other',
    complexity: 0,
  }
}

function findChild(folder: FolderNode, name: string) {
  return folder.children.find((child) => child.name === name)
}

describe('buildTree', () => {
  it('nests files under their folder path', () => {
    const root = buildTree([file('src/App.tsx'), file('src/data/github.ts')])

    const src = findChild(root, 'src')
    expect(src?.type).toBe('folder')
    if (src?.type !== 'folder') throw new Error('expected folder')

    expect(findChild(src, 'App.tsx')).toMatchObject({
      type: 'file',
      path: 'src/App.tsx',
    })

    const data = findChild(src, 'data')
    expect(data?.type).toBe('folder')
    if (data?.type !== 'folder') throw new Error('expected folder')
    expect(findChild(data, 'github.ts')).toMatchObject({
      type: 'file',
      path: 'src/data/github.ts',
    })
  })

  it('reuses the same folder node for siblings', () => {
    const root = buildTree([
      file('src/a.ts'),
      file('src/b.ts'),
      file('src/c.ts'),
    ])
    const folders = root.children.filter((child) => child.name === 'src')
    expect(folders).toHaveLength(1)
    const src = folders[0] as FolderNode
    expect(src.children).toHaveLength(3)
  })

  it('handles a single top-level file with no folders', () => {
    const root = buildTree([file('README.md')])
    expect(root.children).toEqual([
      expect.objectContaining({ type: 'file', path: 'README.md' }),
    ])
  })

  it('handles deeply nested paths', () => {
    const root = buildTree([file('a/b/c/d/e/deep.ts')])
    let cursor: FolderNode = root
    for (const segment of ['a', 'b', 'c', 'd', 'e']) {
      const next = findChild(cursor, segment)
      expect(next?.type).toBe('folder')
      cursor = next as FolderNode
    }
    expect(findChild(cursor, 'deep.ts')).toMatchObject({
      path: 'a/b/c/d/e/deep.ts',
    })
  })

  it('returns an empty root for no files', () => {
    const root = buildTree([])
    expect(root.children).toEqual([])
  })
})
