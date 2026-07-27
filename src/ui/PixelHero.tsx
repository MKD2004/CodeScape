import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  BUILDING_COLORS_DAY,
  BUILDING_COLORS_NIGHT,
  BUILDING_SIDE_FRACTION,
  GUARDRAIL_WIDTH_VW,
  ROAD_HALF_WIDTH_VW,
  VP_X_VW,
  VP_Y_VH,
  WINDOW_DAY,
  WINDOW_LIT_NIGHT,
  WINDOW_LIT_NIGHT_ALT,
  WINDOW_UNLIT_NIGHT,
  computeBuildingScreenState,
  computeDashScreenState,
  computeLampScreenState,
  generateBuildings,
  hexToRgba,
  isWindowGlowing,
  isWindowLit,
  shadeColor,
  type PixelBuilding,
} from './pixelBuildings'

const EXAMPLES = ['lukeed/clsx', 'facebook/react', 'expressjs/express']
const BUILDING_COUNT = 28
const DASH_COUNT = 18
const LAMP_COUNT = 12
const DEPTH_LOOPS = 6
const PIN_HEIGHT_VH = 400

export interface LoadProgress {
  done: number
  total: number
}

type Theme = 'day' | 'night'

const THEME = {
  day: {
    skyTop: '#8ED8F0',
    skyBottom: '#7EC8E8',
    ground: '#8FD17A',
    groundFar: '#7BC468',
    road: '#22252B',
    dash: '#F5C842',
    orb: '#F5C842',
    orbGlow: 'rgba(245, 200, 66, 0.45)',
    panelBg: '#F2EEE3',
    accent: '#F5C842',
    text: '#0A0A0A',
    subtext: '#4B4B4B',
    navPill: '#FFFFFF',
    buildingColors: BUILDING_COLORS_DAY,
    windowLit: WINDOW_DAY,
    windowLitAlt: WINDOW_DAY,
    windowUnlit: WINDOW_DAY,
    guardrail: '#F2EEE3',
    guardrailGlow: 'rgba(245, 200, 66, 0.5)',
    lampGlow: '#F5C842',
    glow: false,
  },
  night: {
    skyTop: '#0B0E23',
    skyBottom: '#191038',
    ground: '#14102B',
    groundFar: '#0B0A1D',
    road: '#1C1836',
    dash: '#9BF6FF',
    orb: '#FFF3C4',
    orbGlow: 'rgba(255, 243, 196, 0.55)',
    panelBg: '#12142B',
    accent: '#F5C842',
    text: '#F2EEE3',
    subtext: '#B7B7C9',
    navPill: '#12142B',
    buildingColors: BUILDING_COLORS_NIGHT,
    windowLit: WINDOW_LIT_NIGHT,
    windowLitAlt: WINDOW_LIT_NIGHT_ALT,
    windowUnlit: WINDOW_UNLIT_NIGHT,
    guardrail: '#C7B8FF',
    guardrailGlow: 'rgba(155, 246, 255, 0.75)',
    lampGlow: '#9BF6FF',
    glow: true,
  },
} as const

const STAR_TINTS = ['#FFFFFF', '#FFFFFF', '#C7B8FF', '#9BF6FF', '#F9A8D4']
const STARS = Array.from({ length: 90 }, (_, i) => ({
  left: ((i * 37) % 100) + (i % 3),
  top: ((i * 53) % 60) * 0.9,
  size: 1 + (i % 3),
  glow: i % 3 === 0,
  color: STAR_TINTS[i % STAR_TINTS.length],
}))

function BuildingWindows({
  building,
  theme,
}: {
  building: PixelBuilding
  theme: Theme
}) {
  const t = THEME[theme]
  const cells = building.rows * building.cols
  return (
    <div
      className="grid h-full w-full gap-[2px] p-[3px]"
      style={{ gridTemplateColumns: `repeat(${building.cols}, 1fr)` }}
    >
      {Array.from({ length: cells }, (_, i) => {
        const lit = theme === 'night' ? isWindowLit(building.windowSeed, i) : true
        const glowing = theme === 'night' && lit && isWindowGlowing(building.windowSeed, i)
        const litColor = i % 5 === 0 ? t.windowLitAlt : t.windowLit
        return (
          <div
            key={i}
            className={glowing ? 'window-glow' : undefined}
            style={
              {
                background: lit ? litColor : t.windowUnlit,
                color: litColor,
                '--glow-delay': (i * 37) % 5,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

function Building({ building, theme }: { building: PixelBuilding; theme: Theme }) {
  const t = THEME[theme]
  const front = t.buildingColors[building.colorIndex % t.buildingColors.length]
  const side = shadeColor(front, 0.5)
  const glowFilter = t.glow
    ? `drop-shadow(0 0 5px ${hexToRgba(front, 0.75)}) drop-shadow(0 0 14px ${hexToRgba(front, 0.4)})`
    : 'none'
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: front,
        borderRadius: '5px 5px 0 0',
        filter: glowFilter,
        boxShadow: t.glow ? undefined : '2px 3px 0 0 rgba(0,0,0,0.25)',
      }}
    >
      <BuildingWindows building={building} theme={theme} />
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: `${BUILDING_SIDE_FRACTION * 100}%`, background: side }}
      />
    </div>
  )
}

export function PixelHero({
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
  const [theme, setTheme] = useState<Theme>('day')
  const loading = status === 'loading'
  const t = THEME[theme]

  const buildings = useMemo(() => generateBuildings(BUILDING_COUNT), [])
  const dashDepths = useMemo(
    () => Array.from({ length: DASH_COUNT }, (_, i) => i / DASH_COUNT),
    [],
  )
  const lampDepths = useMemo(
    () => Array.from({ length: LAMP_COUNT }, (_, i) => i / LAMP_COUNT),
    [],
  )

  const outerRef = useRef<HTMLDivElement | null>(null)
  const buildingRefs = useRef<(HTMLDivElement | null)[]>([])
  const dashRefs = useRef<(HTMLDivElement | null)[]>([])
  const lampRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef(0)
  const lastDrawnProgress = useRef(-1)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    function updateProgress() {
      const outer = outerRef.current
      if (!outer) return
      const rect = outer.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      const p = scrollable > 0 ? -rect.top / scrollable : 0
      progressRef.current = Math.min(1, Math.max(0, p))
    }

    function tick() {
      if (progressRef.current !== lastDrawnProgress.current) {
        lastDrawnProgress.current = progressRef.current
        const vwPx = window.innerWidth / 100
        const vhPx = window.innerHeight / 100

        for (let i = 0; i < buildings.length; i++) {
          const el = buildingRefs.current[i]
          if (!el) continue
          const s = computeBuildingScreenState(buildings[i], progressRef.current, DEPTH_LOOPS)
          const w = s.widthVh * vhPx
          const h = s.heightVh * vhPx
          el.style.width = `${w}px`
          el.style.height = `${h}px`
          el.style.left = `${s.centerXVw * vwPx - w / 2}px`
          el.style.top = `${s.topVh * vhPx}px`
          el.style.opacity = String(s.opacity)
          el.style.zIndex = String(s.zIndex)
        }

        for (let i = 0; i < dashDepths.length; i++) {
          const el = dashRefs.current[i]
          if (!el) continue
          const d = computeDashScreenState(dashDepths[i], progressRef.current, DEPTH_LOOPS)
          const w = d.widthVw * vwPx
          const h = d.heightVh * vhPx
          el.style.width = `${w}px`
          el.style.height = `${h}px`
          el.style.left = `${d.centerXVw * vwPx - w / 2}px`
          el.style.top = `${d.topVh * vhPx - h / 2}px`
          el.style.opacity = String(d.opacity)
        }

        for (let i = 0; i < lampDepths.length; i++) {
          const el = lampRefs.current[i]
          if (!el) continue
          const side = i % 2 === 0 ? -1 : 1
          const s = computeLampScreenState(lampDepths[i], side, progressRef.current, DEPTH_LOOPS)
          const size = s.headSizeVh * vhPx
          el.style.width = `${size}px`
          el.style.height = `${size}px`
          el.style.left = `${s.centerXVw * vwPx - size / 2}px`
          el.style.top = `${s.headTopVh * vhPx - size / 2}px`
          el.style.opacity = String(s.opacity)
          el.style.zIndex = String(s.zIndex)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [buildings, dashDepths, lampDepths])

  const roadClipPath = `polygon(${VP_X_VW - 0.6}% ${VP_Y_VH}%, ${VP_X_VW + 0.6}% ${VP_Y_VH}%, ${VP_X_VW + ROAD_HALF_WIDTH_VW}% 100%, ${VP_X_VW - ROAD_HALF_WIDTH_VW}% 100%)`
  const leftGuardrailClip = `polygon(${VP_X_VW - 0.6}% ${VP_Y_VH}%, ${VP_X_VW - 1.4}% ${VP_Y_VH}%, ${VP_X_VW - ROAD_HALF_WIDTH_VW - GUARDRAIL_WIDTH_VW}% 100%, ${VP_X_VW - ROAD_HALF_WIDTH_VW}% 100%)`
  const rightGuardrailClip = `polygon(${VP_X_VW + 0.6}% ${VP_Y_VH}%, ${VP_X_VW + 1.4}% ${VP_Y_VH}%, ${VP_X_VW + ROAD_HALF_WIDTH_VW + GUARDRAIL_WIDTH_VW}% 100%, ${VP_X_VW + ROAD_HALF_WIDTH_VW}% 100%)`

  return (
    <div ref={outerRef} style={{ height: `${PIN_HEIGHT_VH}vh` }} className="relative w-full">
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        {/* Sky */}
        <div
          className="absolute inset-x-0 top-0 h-[55%]"
          style={{ background: `linear-gradient(to bottom, ${t.skyTop}, ${t.skyBottom})` }}
        >
          {theme === 'night' &&
            STARS.map((s, i) => (
              <div
                key={i}
                className={`absolute rounded-full ${s.glow ? 'star-glow' : ''}`}
                style={
                  {
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: s.size,
                    height: s.size,
                    background: s.color,
                    opacity: 0.85,
                    '--glow-delay': i % 4,
                  } as CSSProperties
                }
              />
            ))}
          <div
            className="absolute rounded-full"
            style={{
              top: '12%',
              right: '14%',
              width: 64,
              height: 64,
              background: t.orb,
              border: theme === 'day' ? '3px solid #0A0A0A' : 'none',
              boxShadow:
                theme === 'day'
                  ? `0 0 48px 16px ${t.orbGlow}`
                  : `0 0 40px 14px ${t.orbGlow}, 0 0 90px 40px ${t.orbGlow}`,
            }}
          />
        </div>

        {/* Ground */}
        <div
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{ background: `linear-gradient(to bottom, ${t.groundFar}, ${t.ground})` }}
        />

        {/* Road — edges are straight lines from the VP, so this is static; it
            shares VP_X_VW/VP_Y_VH/ROAD_HALF_WIDTH_VW with the buildings and
            dashes below to guarantee the same vanishing point. */}
        <div className="absolute inset-0" style={{ background: t.road, clipPath: roadClipPath }} />

        {/* Lane dashes — foreshortened via the same perspectiveFactor() as buildings.
            No explicit z-index: it must stay painted before (below) the buildings
            layer, which relies on DOM order since both use z-index:auto. */}
        <div className="absolute inset-0">
          {dashDepths.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                dashRefs.current[i] = el
              }}
              className="absolute"
              style={{ background: t.dash, willChange: 'left, top, width, height, opacity' }}
            />
          ))}
        </div>

        {/* Guardrails — static straight-line strips just outside the road edges,
            converging to the same VP as the road and buildings. */}
        <div
          className="absolute inset-0"
          style={{
            background: t.guardrail,
            clipPath: leftGuardrailClip,
            filter: `drop-shadow(0 0 4px ${t.guardrailGlow})`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: t.guardrail,
            clipPath: rightGuardrailClip,
            filter: `drop-shadow(0 0 4px ${t.guardrailGlow})`,
          }}
        />

        {/* Lamp posts — glowing heads that recycle along the road edge, same depth cycle as buildings/dashes */}
        <div className="absolute inset-0">
          {lampDepths.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                lampRefs.current[i] = el
              }}
              className="absolute rounded-full"
              style={{
                background: t.lampGlow,
                filter: `drop-shadow(0 0 8px ${t.lampGlow}) drop-shadow(0 0 16px ${t.lampGlow})`,
                willChange: 'left, top, width, height, opacity',
              }}
            />
          ))}
        </div>

        {/* Buildings pool */}
        <div className="absolute inset-0 overflow-hidden">
          {buildings.map((b, i) => (
            <div
              key={b.id}
              ref={(el) => {
                buildingRefs.current[i] = el
              }}
              className="absolute"
              style={{ willChange: 'left, top, width, height, opacity' }}
            >
              <Building building={b} theme={theme} />
            </div>
          ))}
        </div>

        {/* Toolbar (decorative) */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2">
          {['🧭', '🗺️', '🔊'].map((icon, i) => (
            <div
              key={i}
              className="pixel-border pixel-shadow flex h-9 w-9 items-center justify-center text-sm"
              style={{ background: t.navPill }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Nav bar */}
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-4">
          <div
            className="pixel-border flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: t.navPill }}
          >
            <div className="pixel-border h-5 w-5 rounded-md bg-red-500" />
            <span className="font-pixel-head text-[10px]" style={{ color: t.text }}>
              CODESCAPE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
              className="pixel-border flex items-center gap-1.5 rounded-full px-3 py-1.5 font-pixel-body text-xs"
              style={{ background: t.navPill, color: t.text }}
            >
              <span>{theme === 'day' ? '☀️' : '🌙'}</span>
              <span>{theme === 'day' ? 'DAY' : 'NIGHT'}</span>
            </button>
            <button
              type="button"
              title="Sign-in isn't available in v1"
              className="pixel-border rounded-full px-3 py-1.5 font-pixel-body text-xs"
              style={{ background: t.accent, color: '#0A0A0A' }}
            >
              SIGN IN
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute inset-x-0 top-0 z-40 flex flex-col items-center px-4 pt-24 text-center">
          <div
            className="pixel-border rounded-full px-3 py-1 font-pixel-body text-[10px]"
            style={{ background: t.navPill, color: t.text }}
          >
            ◆ PIXEL EDITION v1.0
          </div>

          <h1
            className="pixel-outline-text font-pixel-head mt-4 text-2xl leading-relaxed sm:text-4xl"
            style={{ color: '#FFFFFF' }}
          >
            YOUR CODE
            <br />
            IS A CITY.
          </h1>

          <p
            className="font-pixel-body mt-4 max-w-md text-xs sm:text-sm"
            style={{ color: t.subtext }}
          >
            Paste any GitHub repo. Walk through its architecture as a
            pixel-art city where every file is a building.
          </p>

          <div
            className="pixel-border pixel-shadow mt-6 w-full max-w-sm p-4"
            style={{ background: t.panelBg }}
          >
            <button
              type="button"
              title="Sign-in isn't available in v1"
              className="pixel-border font-pixel-body w-full bg-black py-2.5 text-xs text-white"
            >
              ⌥ CONTINUE WITH GITHUB
            </button>

            <div className="my-3 flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: `${t.text}33` }} />
              <span className="font-pixel-body text-[10px]" style={{ color: t.subtext }}>
                OR
              </span>
              <div className="h-px flex-1" style={{ background: `${t.text}33` }} />
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                onLoad()
              }}
            >
              <input
                className="pixel-border font-pixel-body min-w-0 flex-1 bg-white px-2 py-2 text-[11px] text-black placeholder:text-black/40 focus:outline-none"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="github.com/user/repo"
                disabled={loading}
              />
              <button
                type="submit"
                className="pixel-border font-pixel-body shrink-0 px-3 py-2 text-[11px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: t.accent }}
                disabled={loading}
              >
                {loading ? '…' : 'BUILD →'}
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {EXAMPLES.map((repo) => (
                <button
                  key={repo}
                  type="button"
                  className="pixel-border font-pixel-body rounded-full px-2 py-0.5 text-[9px]"
                  style={{ color: t.text, background: t.navPill }}
                  onClick={() => onExampleClick(repo)}
                  disabled={loading}
                >
                  {repo}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-3">
                <div className="pixel-border h-2 w-full overflow-hidden bg-white">
                  <div
                    className="h-full transition-all duration-150"
                    style={{
                      background: t.accent,
                      width: progress
                        ? `${Math.min(100, (progress.done / Math.max(progress.total, 1)) * 100)}%`
                        : '15%',
                    }}
                  />
                </div>
                <p className="font-pixel-body mt-1.5 text-[9px]" style={{ color: t.subtext }}>
                  {progress
                    ? `Analyzing ${progress.done} / ${progress.total} files…`
                    : 'Fetching repo tree…'}
                </p>
              </div>
            )}

            {status === 'error' && (
              <p className="font-pixel-body mt-3 text-[10px] text-red-600">{error}</p>
            )}
          </div>

          <p className="font-pixel-body mt-4 text-[10px]" style={{ color: t.subtext }}>
            ↓ scroll to walk through the city ↓
          </p>
        </div>
      </div>
    </div>
  )
}
