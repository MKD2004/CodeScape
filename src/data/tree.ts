import type { FileRole } from './classify'

export interface FileNode {
  type: 'file'
  name: string
  path: string
  size: number
  loc: number
  language: string
  role: FileRole
  complexity: number
  lastModified: string | null
}

export interface FolderNode {
  type: 'folder'
  name: string
  path: string
  children: TreeNode[]
}

export type TreeNode = FileNode | FolderNode

export interface FlatFile {
  path: string
  size: number
  loc: number
  language: string
  role: FileRole
  complexity: number
  lastModified?: string | null
}

function getOrCreateFolder(
  parent: FolderNode,
  name: string,
  path: string,
): FolderNode {
  const existing = parent.children.find(
    (child): child is FolderNode =>
      child.type === 'folder' && child.name === name,
  )
  if (existing) return existing

  const folder: FolderNode = { type: 'folder', name, path, children: [] }
  parent.children.push(folder)
  return folder
}

export function buildTree(files: FlatFile[]): FolderNode {
  const root: FolderNode = { type: 'folder', name: '', path: '', children: [] }

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean)
    if (segments.length === 0) continue

    let cursor = root
    let pathSoFar = ''
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]
      pathSoFar = pathSoFar ? `${pathSoFar}/${segment}` : segment
      cursor = getOrCreateFolder(cursor, segment, pathSoFar)
    }

    const fileName = segments[segments.length - 1]
    cursor.children.push({
      type: 'file',
      name: fileName,
      path: file.path,
      size: file.size,
      loc: file.loc,
      language: file.language,
      role: file.role,
      complexity: file.complexity,
      lastModified: file.lastModified ?? null,
    })
  }

  return root
}
