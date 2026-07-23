import { useState } from 'react'
import { buildRepoCity, type RepoCityData } from './data/pipeline'
import { CityScene } from './scene/CityScene'
import { useCityStore } from './state/cityStore'
import { MetricsPanel } from './ui/MetricsPanel'

function App() {
  const [input, setInput] = useState('lukeed/clsx')
  const [data, setData] = useState<RepoCityData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const cameraMode = useCityStore((s) => s.cameraMode)
  const setCameraMode = useCityStore((s) => s.setCameraMode)

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
      setCameraMode('orbit')
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to load repo')
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white">
      {data && (
        <>
          <CityScene key={`${data.owner}/${data.repo}`} data={data} />
          <MetricsPanel owner={data.owner} repo={data.repo} />
        </>
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <input
            className="w-64 rounded border border-white/20 bg-black/60 px-3 py-1.5 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="owner/repo"
          />
          <button
            className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            onClick={handleLoad}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Loading…' : 'Load city'}
          </button>
          {data && (
            <button
              className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
              onClick={() =>
                setCameraMode(cameraMode === 'walk' ? 'orbit' : 'walk')
              }
            >
              {cameraMode === 'walk' ? 'Exit walk mode' : 'Enter city (walk)'}
            </button>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        {data && (
          <p className="text-xs text-white/50">
            {data.owner}/{data.repo}@{data.branch} — {data.fileCount} files,{' '}
            {data.totalLoc} loc
            {cameraMode === 'walk'
              ? ' — click the canvas to look around, WASD to move, Esc to exit'
              : ' — drag to orbit, scroll to zoom, click a building to inspect'}
          </p>
        )}
      </div>
    </div>
  )
}

export default App
