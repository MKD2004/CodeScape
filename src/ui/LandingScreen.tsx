const EXAMPLES = ['lukeed/clsx', 'facebook/react', 'expressjs/express']

export interface LoadProgress {
  done: number
  total: number
}

export function LandingScreen({
  input,
  onInputChange,
  onLoad,
  status,
  error,
  progress,
  onExampleClick,
}: {
  input: string
  onInputChange: (value: string) => void
  onLoad: () => void
  status: 'idle' | 'loading' | 'error'
  error: string
  progress: LoadProgress | null
  onExampleClick: (repo: string) => void
}) {
  const loading = status === 'loading'

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-full max-w-md px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          CodeScape
        </h1>
        <p className="mt-3 text-sm text-white/50">
          Paste a public GitHub repo and walk through it as a 3D city — every
          file a building, every folder a district.
        </p>

        <form
          className="mt-8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onLoad()
          }}
        >
          <input
            className="flex-1 rounded border border-white/20 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="owner/repo"
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            className="shrink-0 rounded bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Building…' : 'Build city'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((repo) => (
            <button
              key={repo}
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 hover:border-white/30 hover:text-white"
              onClick={() => onExampleClick(repo)}
              disabled={loading}
            >
              {repo}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-6">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white/70 transition-all duration-150"
                style={{
                  width: progress
                    ? `${Math.min(100, (progress.done / Math.max(progress.total, 1)) * 100)}%`
                    : '15%',
                }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              {progress
                ? `Analyzing ${progress.done} / ${progress.total} files…`
                : 'Fetching repo tree…'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <p className="mt-6 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
