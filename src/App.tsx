import { useCallback, useEffect, useRef, useState } from 'react'
import { buildRepoCity, type RepoCityData } from './data/pipeline'
import { CityScene } from './scene/CityScene'
import type { PreparedScene } from './scene/prepareScene'
import { captureCityScreenshot, downloadDataUrl } from './scene/screenshot'
import { useCityStore } from './state/cityStore'
import { PixelHero, type LoadProgress } from './ui/PixelHero'
import { Minimap } from './ui/Minimap'
import { MetricsPanel } from './ui/MetricsPanel'
import { friendlyErrorMessage } from './ui/errorMessage'

function parseRepoFromPath(): string | null {
  const match = window.location.pathname.match(/^\/city\/([^/]+)\/([^/]+)\/?$/)
  if (!match) return null
  return `${decodeURIComponent(match[1])}/${decodeURIComponent(match[2])}`
}

function App() {
  const [input, setInput] = useState(() => parseRepoFromPath() ?? 'lukeed/clsx')
  const [data, setData] = useState<RepoCityData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<LoadProgress | null>(null)
  const [scene, setScene] = useState<PreparedScene | null>(null)
  const cameraMode = useCityStore((s) => s.cameraMode)
  const setCameraMode = useCityStore((s) => s.setCameraMode)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const loadRepo = useCallback(async (raw: string) => {
    const [owner, repo] = raw.trim().split('/')
    if (!owner || !repo) {
      setStatus('error')
      setError('Enter a repo as "owner/repo"')
      return
    }

    setStatus('loading')
    setError('')
    setProgress(null)
    setScene(null)
    try {
      const result = await buildRepoCity(owner, repo, {
        onProgress: (done, total) => setProgress({ done, total }),
      })
      setData(result)
      setCameraMode('orbit')
      setStatus('idle')
      window.history.pushState(null, '', `/city/${owner}/${repo}`)
    } catch (err) {
      setStatus('error')
      setError(friendlyErrorMessage(err))
    }
  }, [setCameraMode])

  useEffect(() => {
    const initial = parseRepoFromPath()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time bootstrap fetch from the initial URL, not a render-triggered loop
    if (initial) void loadRepo(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onPopState() {
      const repo = parseRepoFromPath()
      if (repo) {
        setInput(repo)
        void loadRepo(repo)
      } else {
        setData(null)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [loadRepo])

  function handleNewCity() {
    setData(null)
    setScene(null)
    setStatus('idle')
    setError('')
    window.history.pushState(null, '', '/')
  }

  function handleScreenshot() {
    if (!canvasRef.current || !data || !scene) return
    const dataUrl = captureCityScreenshot(canvasRef.current, {
      owner: data.owner,
      repo: data.repo,
      fileCount: data.fileCount,
      totalLoc: data.totalLoc,
      districtCount: scene.districts.length,
    })
    downloadDataUrl(dataUrl, `codescape-${data.owner}-${data.repo}.png`)
  }

  if (!data) {
    return (
      <PixelHero
        input={input}
        onInputChange={setInput}
        onLoad={() => void loadRepo(input)}
        onExampleClick={(repo) => {
          setInput(repo)
          void loadRepo(repo)
        }}
        status={status}
        error={error}
        progress={progress}
      />
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white">
      <CityScene
        key={`${data.owner}/${data.repo}`}
        data={data}
        onSceneReady={setScene}
        onCanvasReady={(canvas) => {
          canvasRef.current = canvas
        }}
      />
      <MetricsPanel owner={data.owner} repo={data.repo} />
      {scene && (
        <Minimap
          districts={scene.districts}
          groundWidth={scene.groundWidth}
          groundDepth={scene.groundDepth}
        />
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            onClick={handleNewCity}
          >
            ← New city
          </button>
          <button
            className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            onClick={() => setCameraMode(cameraMode === 'walk' ? 'orbit' : 'walk')}
          >
            {cameraMode === 'walk' ? 'Exit walk mode' : 'Enter city (walk)'}
          </button>
          <button
            className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            onClick={handleScreenshot}
            disabled={!scene}
          >
            📸 Screenshot
          </button>
        </div>

        <p className="text-xs text-white/50">
          {data.owner}/{data.repo}@{data.branch} — {data.fileCount} files,{' '}
          {data.totalLoc} loc
          {cameraMode === 'walk'
            ? ' — click the canvas to look around, WASD to move, Esc to exit'
            : ' — drag to orbit, scroll to zoom, click a building to inspect'}
        </p>
      </div>
    </div>
  )
}

export default App
