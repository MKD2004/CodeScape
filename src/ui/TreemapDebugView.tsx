import { useState } from 'react'
import { buildRepoCity, type RepoCityData } from '../data/pipeline'
import {
  layoutTree,
  type LayoutFolderNode,
  type LayoutTreeNode,
} from '../layout/layoutTree'

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  HTML: '#e34c26',
  JSON: '#8bc34a',
  Markdown: '#ffffff',
  YAML: '#cb171e',
}

function colorFor(node: LayoutTreeNode): string {
  if (node.type === 'folder') return 'transparent'
  return LANGUAGE_COLORS[node.language] ?? '#666677'
}

function TreemapNode({ node }: { node: LayoutTreeNode }) {
  const { rect } = node
  const style = {
    position: 'absolute' as const,
    left: rect.x,
    top: rect.y,
    width: Math.max(rect.width, 0),
    height: Math.max(rect.height, 0),
  }

  if (node.type === 'file') {
    return (
      <div
        title={`${node.path}\n${node.language} · ${node.loc} loc · ${node.role}`}
        style={{
          ...style,
          background: colorFor(node),
          border: '1px solid rgba(0,0,0,0.35)',
          boxSizing: 'border-box',
        }}
      />
    )
  }

  return (
    <div
      style={{
        ...style,
        border:
          rect.width > 0 && rect.height > 0
            ? '2px solid rgba(255,255,255,0.4)'
            : undefined,
        boxSizing: 'border-box',
      }}
    >
      {node.children.map((child) => (
        <TreemapNode key={child.path || child.name} node={child} />
      ))}
    </div>
  )
}

const CONTAINER_SIZE = { width: 960, height: 600 }

export function TreemapDebugView() {
  const [input, setInput] = useState('lukeed/clsx')
  const [data, setData] = useState<RepoCityData | null>(null)
  const [layout, setLayout] = useState<LayoutFolderNode | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleLoad() {
    const [owner, repo] = input.trim().split('/')
    if (!owner || !repo) {
      setStatus('error')
      setError('Enter a repo as "owner/repo"')
      return
    }

    setStatus('loading')
    setError('')
    try {
      const result = await buildRepoCity(owner, repo)
      setData(result)
      setLayout(layoutTree(result.root, { x: 0, y: 0, ...CONTAINER_SIZE }))
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to load repo')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 p-6 text-white">
      <h1 className="text-2xl font-semibold">CodeScape — treemap debug view</h1>
      <div className="flex gap-2">
        <input
          className="w-64 rounded border border-white/20 bg-white/5 px-3 py-1.5 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="owner/repo"
        />
        <button
          className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          onClick={handleLoad}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Loading…' : 'Load'}
        </button>
      </div>
      {status === 'error' && <p className="text-sm text-red-400">{error}</p>}
      {data && (
        <p className="text-xs text-white/60">
          {data.owner}/{data.repo}@{data.branch} — {data.fileCount} files,{' '}
          {data.totalLoc} loc{data.truncated ? ' (truncated)' : ''}
        </p>
      )}
      {layout && (
        <div
          className="relative bg-black/40"
          style={{ width: CONTAINER_SIZE.width, height: CONTAINER_SIZE.height }}
        >
          <TreemapNode node={layout} />
        </div>
      )}
    </div>
  )
}
