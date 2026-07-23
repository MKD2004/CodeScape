import { useEffect, useState } from 'react'
import { fetchLastModified } from '../data/github'
import { useCityStore } from '../state/cityStore'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/40">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}

export function MetricsPanel({ owner, repo }: { owner: string; repo: string }) {
  const selected = useCityStore((s) => s.selected)
  const clearSelection = useCityStore((s) => s.clearSelection)
  const [lastModifiedByPath, setLastModifiedByPath] = useState<
    Record<string, string | null>
  >({})

  useEffect(() => {
    if (!selected || selected.path in lastModifiedByPath) return
    let cancelled = false
    fetchLastModified(owner, repo, selected.path).then((date) => {
      if (!cancelled) {
        setLastModifiedByPath((prev) => ({ ...prev, [selected.path]: date }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [selected, owner, repo, lastModifiedByPath])

  if (!selected) return null

  const lastModified =
    selected.path in lastModifiedByPath
      ? lastModifiedByPath[selected.path]
      : 'loading'

  return (
    <div className="pointer-events-auto absolute right-4 top-4 w-72 rounded-lg border border-white/15 bg-black/80 p-4 text-sm text-white backdrop-blur">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="break-all font-mono text-xs text-white/90">
          {selected.path}
        </p>
        <button
          className="shrink-0 text-white/50 hover:text-white"
          onClick={clearSelection}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <dl className="space-y-1 text-xs text-white/70">
        <Row label="Language" value={selected.language} />
        <Row label="Lines of code" value={String(selected.loc)} />
        <Row label="Complexity (proxy)" value={String(selected.complexity)} />
        <Row label="Role" value={selected.role} />
        <Row
          label="Last modified"
          value={
            lastModified === 'loading'
              ? 'Loading…'
              : lastModified
                ? new Date(lastModified).toLocaleDateString()
                : 'Unknown'
          }
        />
      </dl>
    </div>
  )
}
