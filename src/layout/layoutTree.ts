import type { FileNode, FolderNode, TreeNode } from '../data/tree'
import { squarify, type Rect } from './treemap'

export interface LayoutFileNode extends FileNode {
  rect: Rect
}

export interface LayoutFolderNode extends Omit<FolderNode, 'children'> {
  rect: Rect
  children: LayoutTreeNode[]
}

export type LayoutTreeNode = LayoutFileNode | LayoutFolderNode

function nodeWeight(node: TreeNode): number {
  if (node.type === 'file') return Math.max(node.loc, 1)
  return node.children.reduce((sum, child) => sum + nodeWeight(child), 0)
}

function layoutFolder(folder: FolderNode, rect: Rect): LayoutFolderNode {
  const weights = folder.children.map(nodeWeight)
  const rects = squarify(weights, rect)

  const children: LayoutTreeNode[] = folder.children.map((child, i) =>
    child.type === 'file'
      ? { ...child, rect: rects[i] }
      : layoutFolder(child, rects[i]),
  )

  return { ...folder, rect, children }
}

/** Pure function: assigns a Rect to every node in the tree, recursively. */
export function layoutTree(root: FolderNode, rect: Rect): LayoutFolderNode {
  return layoutFolder(root, rect)
}
