import { useState, useRef, useEffect, useCallback } from 'react'

const EASE_OUT = t => 1 - Math.pow(1 - t, 4)
const SPIN_COUNT = 500
const SPIN_MS = 4000
const HALF_WIN = 40

/* ── GBA Pokemon Emerald Pokedex palette ──────────────────────────────── */
const C_FRAME_PINK = '#d04888'   // pink/magenta outer frame
const C_FRAME_PINK_HI = '#e878a8'   // light pink inner highlight
const C_FRAME_PINK_LO = '#982050'   // dark pink/magenta inner shadow
const C_HEADER_GREEN = '#0e3018'   // dark olive-green header/footer bar
const C_HEADER_GREEN2 = '#1c4828'   // slightly lighter green for inner edge
const C_BORDER = '#000'
const C_SCREEN_WHITE = '#f8f8f8'   // sprite viewport white
const C_LIST_CREAM = '#f0f33a'   // GOLDEN YELLOW list background
const C_LIST_CREAM_D = '#a07810'   // gold darker shade for divider/track
const C_YELLOW_HI = '#000'   // selected entry text yellow
const C_RED = '#CC0000'
const C_DROPSHADOW = '#bdbdbd'

/* Pixelated stepped gradient fades — 6 discrete bands, GBA scaling */
const mkFade = (dir, col) => `linear-gradient(to ${dir},
  ${col} 0px,    ${col} 12px,
  ${col}e6 12px, ${col}e6 22px,
  ${col}bb 22px, ${col}bb 32px,
  ${col}88 32px, ${col}88 42px,
  ${col}55 42px, ${col}55 52px,
  ${col}22 52px, ${col}22 62px,
  transparent 62px)`

const FADE_TOP_WHITE = mkFade('bottom', '#f8f8f8')
const FADE_BOT_WHITE = mkFade('top', '#f8f8f8')
/* Grey pixelated wheel-rim gradient — fades over the gold list */
const FADE_TOP_GREY = mkFade('bottom', '#4a4a4a')
const FADE_BOT_GREY = mkFade('top', '#4a4a4a')

export default function SpinSlot({
  pool, onPick, disabled,
  category, onCategoryChange,
  pickedCount, totalCount,
  seenHoenn, seenNational, ownHoenn, ownNational,
  pickedIds,
  onSignOut, onShowPicks,
  spinMs = 4000,            /* spin duration in ms (overridable from settings) */
  onOpenSettings,           /* () => void — called when the user hits MENU */
}) {
  const wrapRef = useRef(null)
  const spriteScrollRef = useRef(null)
  const namesScrollRef = useRef(null)
  const rafRef = useRef(null)

  const [containerH, setContainerH] = useState(640)
  /* Each scroller has its OWN height (sprite viewport has margin, names list doesn't).
     Centering uses each scroller's actual height so the focused row lands at its
     true visual midpoint — which is also where the triangle pointer sits. */
  const [spriteH, setSpriteH] = useState(640)
  const [namesH, setNamesH] = useState(640)

  const LEFT_H = Math.max(80, Math.floor(containerH / 3))
  const RIGHT_H = Math.max(30, Math.floor(containerH / 10))

  const [mode, setMode] = useState('browse')
  const [browseIdx, setBrowseIdx] = useState(0)
  const [spinSeq, setSpinSeq] = useState([])
  const [spinFloat, setSpinFloat] = useState(0)
  const [winner, setWinner] = useState(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    setContainerH(el.offsetHeight)
    const ro = new ResizeObserver(() => setContainerH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = spriteScrollRef.current
    if (!el) return
    setSpriteH(el.offsetHeight)
    const ro = new ResizeObserver(() => setSpriteH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = namesScrollRef.current
    if (!el) return
    setNamesH(el.offsetHeight)
    const ro = new ResizeObserver(() => setNamesH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (pool.length === 0) { setBrowseIdx(0); return }
    setBrowseIdx(i => Math.min(i, pool.length - 1))
  }, [pool.length])

  useEffect(() => {
    const el = wrapRef.current; if (!el) return
    const fn = e => {
      if (mode !== 'browse') return
      e.preventDefault()
      setBrowseIdx(i => Math.max(0, Math.min(pool.length - 1, i + Math.sign(e.deltaY))))
    }
    el.addEventListener('wheel', fn, { passive: false })
    return () => el.removeEventListener('wheel', fn)
  }, [mode, pool.length])

  const touchLastY = useRef(0)
  useEffect(() => {
    const el = wrapRef.current; if (!el) return
    const s = e => { touchLastY.current = e.touches[0].clientY }
    const m = e => {
      if (mode !== 'browse') return
      e.preventDefault()
      const dy = touchLastY.current - e.touches[0].clientY
      touchLastY.current = e.touches[0].clientY
      if (Math.abs(dy) > RIGHT_H / 2)
        setBrowseIdx(i => Math.max(0, Math.min(pool.length - 1, i + Math.sign(dy))))
    }
    el.addEventListener('touchstart', s, { passive: true })
    el.addEventListener('touchmove', m, { passive: false })
    return () => { el.removeEventListener('touchstart', s); el.removeEventListener('touchmove', m) }
  }, [mode, pool.length, RIGHT_H])

  const spin = useCallback(() => {
    if (mode !== 'browse' || disabled || pool.length === 0) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const w = pool[Math.floor(Math.random() * pool.length)]
    const seq = Array.from({ length: SPIN_COUNT }, () => pool[Math.floor(Math.random() * pool.length)])
    seq.push(w)
    setSpinSeq(seq); setSpinFloat(0); setWinner(null); setMode('spin')
    const t0 = performance.now()
    const tick = now => {
      const t = Math.min((now - t0) / spinMs, 1)
      setSpinFloat(EASE_OUT(t) * SPIN_COUNT)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else { setSpinFloat(SPIN_COUNT); setWinner(w); setMode('confirm') }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [mode, disabled, pool, spinMs])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const confirmPick = async () => { if (!winner) return; setMode('browse'); setWinner(null); await onPick(winner) }
  const skipPick = () => { setMode('browse'); setWinner(null) }

  const displayList = (mode === 'spin' || mode === 'confirm') ? spinSeq : pool
  const floatIdx = mode === 'spin' ? spinFloat : mode === 'confirm' ? SPIN_COUNT : browseIdx
  const centreI = Math.round(floatIdx)
  const winStart = Math.max(0, centreI - HALF_WIN)
  const winEnd = Math.min(displayList.length - 1, centreI + HALF_WIN)
  const items = displayList.slice(winStart, winEnd + 1)

  const leftY = -(floatIdx - winStart) * LEFT_H + spriteH / 2 - LEFT_H / 2
  const rightY = -(floatIdx - winStart) * RIGHT_H + namesH / 2 - RIGHT_H / 2

  const scrollPct = displayList.length > 1 ? floatIdx / (displayList.length - 1) : 0

  const CATEGORIES = [
    { key: 'pokemon', label: 'POKeMON' },
    { key: 'trainer', label: 'TRAINERS' },
    { key: 'both', label: 'BOTH' },
  ]

  /* Fallback stat values when older callers haven't passed split counts */
  const sH = seenHoenn ?? totalCount ?? pool.length
  const sN = seenNational ?? totalCount ?? pool.length
  const oH = ownHoenn ?? pickedCount ?? 0
  const oN = ownNational ?? pickedCount ?? 0

  return (
    <div ref={wrapRef} className="flex-1 flex flex-col min-h-0 select-none relative"
      style={{
        background: C_FRAME_PINK,
        border: `4px solid ${C_BORDER}`,
        boxShadow:
          `4px 4px 0 rgba(0,0,0,0.75),
              inset 3px 3px 0 ${C_FRAME_PINK_HI},
              inset -3px -3px 0 ${C_FRAME_PINK_LO}`,
      }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 relative"
        style={{
          background: C_HEADER_GREEN,
          borderBottom: `4px solid ${C_BORDER}`,
          boxShadow: `inset 0 2px 0 ${C_HEADER_GREEN2}, inset 0 -2px 0 #000`,
        }}>

        {/* Save-floppy + POKEDEX title cluster (left) */}
        <div className="flex items-center gap-2">
          <FloppyIcon />
          <span className="font-pixel text-white tracking-widest" style={{ fontSize: 13, letterSpacing: 3 }}>
            POKeDEX
          </span>
          {/* Pink up-triangle scroll indicator next to the title */}
          <span style={{
            display: 'inline-block', width: 0, height: 0,
            borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderBottom: `8px solid ${C_FRAME_PINK_HI}`, marginLeft: 4
          }} />
        </div>

        {/* Category toggles — small pixelated pills */}
        <div className="flex gap-1">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => onCategoryChange?.(c.key)}
              className="font-pixel"
              style={{
                fontSize: 7, padding: '2px 6px',
                background: category === c.key ? C_FRAME_PINK_HI : '#0a200f',
                color: category === c.key ? '#000' : '#8aaa8a',
                border: `2px solid ${category === c.key ? '#000' : C_HEADER_GREEN2}`,
                boxShadow: category === c.key ? '2px 2px 0 #000' : 'none'
              }}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onShowPicks} className="font-pixel"
            style={{
              fontSize: 7, padding: '2px 6px', background: C_FRAME_PINK_HI, color: '#000',
              border: '2px solid #000', boxShadow: '2px 2px 0 #000'
            }}>
            PICKS {oN > 0 && <span style={{ color: C_RED }}>{oN}</span>}
          </button>
          <button onClick={onSignOut} className="font-pixel"
            style={{ fontSize: 7, color: '#a04040', padding: '2px 4px' }}>x</button>
        </div>
      </div>

      {/* ── Two-panel body ──────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0" style={{ overflow: 'hidden' }}>

        {/* LEFT — stats column + sprite viewport */}
        <div className="flex flex-shrink-0 relative" style={{ width: '42%', borderRight: `4px solid ${C_BORDER}` }}>

          {/* SEEN / OWN stats column — pink background, HOENN + NATIONAL split */}
          <div className="flex flex-col justify-around items-stretch py-3 px-2 flex-shrink-0"
            style={{
              width: 96,
              background: C_FRAME_PINK,
              borderRight: `3px solid ${C_BORDER}`,
              boxShadow: `inset 2px 0 0 ${C_FRAME_PINK_HI}, inset -2px 0 0 ${C_FRAME_PINK_LO}`,
            }}>

            {/* SEEN block */}
            <StatBlock label="SEEN" rows={[['HOENN', sH], ['NATIONAL', sN]]} />

            {/* Separator pixel */}
            <div style={{ height: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{
                width: '70%', height: 2, background: C_FRAME_PINK_LO,
                boxShadow: `0 2px 0 ${C_FRAME_PINK_HI}`
              }} />
            </div>

            {/* OWN block */}
            <StatBlock label="OWN" rows={[['HOENN', oH], ['NATIONAL', oN]]} />
          </div>

          {/* Sprite viewport — white screen w/ pink double border */}
          <div ref={spriteScrollRef} className="flex-1 relative"
            style={{
              margin: 6,
              background: C_SCREEN_WHITE,
              overflow: 'hidden',
              boxShadow:
                `inset 4px 4px 0 rgba(0,0,0,0.18),
                    inset -2px -2px 0 rgba(255,255,255,0.4),
                    0 0 0 3px ${C_FRAME_PINK_HI}`,
            }}>

            {/* Centre selection bar */}
            <div className="absolute inset-x-0 z-10 pointer-events-none"
              style={{
                top: spriteH / 2 - LEFT_H / 2, height: LEFT_H
              }} />

            {/* Sprite track */}
            <div style={{ transform: `translateY(${leftY}px)`, willChange: 'transform' }}>
              {items.map((entry, i) => (
                <SpriteCell key={`${entry.id}-${i}`} entry={entry} h={LEFT_H}
                  highlighted={winStart + i === centreI} />
              ))}
            </div>

            {/* Pixelated GREY wheel-rim gradient — top + bottom of sprite scroll */}
            <div className="absolute inset-x-0 top-0 pointer-events-none z-20"
              style={{ height: 72, background: FADE_TOP_GREY }} />
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20"
              style={{ height: 72, background: FADE_BOT_GREY }} />
          </div>

          {/* Right-pointing triangle — sits OUTSIDE the sprite viewport (in the
              LEFT panel) so the viewport's inset shadows + outer halo + overflow:hidden
              can't clip or paint over it */}
          <div className="absolute pointer-events-none z-40"
            style={{
              top: '50%',
              right: -16,
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '22px solid transparent',
              borderBottom: '22px solid transparent',
              borderLeft: `28px solid #fff`,
            }} />
        </div>

        {/* RIGHT — cream name list */}
        <div ref={namesScrollRef} className="flex-1 relative" style={{ background: C_LIST_CREAM, overflow: 'hidden' }}>

          <div style={{
            transform: `translateY(${rightY}px)`, willChange: 'transform',
            paddingRight: 22,
          }}>
            {items.map((entry, i) => {
              const absI = winStart + i
              return (
                <NameCell key={`${entry.id}-${i}`} entry={entry} h={RIGHT_H}
                  highlighted={absI === centreI}
                  isPicked={pickedIds?.has(entry.id)} />
              )
            })}
          </div>

          {/* No fade on the names list — entries cut cleanly at top/bottom (matches image) */}

          {/* Up-arrow scroll indicator (top-right, pink) */}
          <div className="absolute z-30 pointer-events-none"
            style={{
              top: 4, right: 24, width: 0, height: 0,
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
              borderBottom: `9px solid ${C_FRAME_PINK}`
            }} />
          {/* Down-arrow scroll indicator (bottom-right, pink) */}
          <div className="absolute z-30 pointer-events-none"
            style={{
              bottom: 4, right: 24, width: 0, height: 0,
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
              borderTop: `9px solid ${C_FRAME_PINK}`
            }} />

          {/* Scrollbar — golden yellow track blending with list + pink thumb */}
          <div className="absolute right-0 top-0 bottom-0 z-20"
            style={{
              width: 16,
              borderLeft: `2px solid ${C_LIST_CREAM_D}`,
              background: C_LIST_CREAM
            }}>
            {/* Vertical track guide line down the middle */}
            <div style={{
              position: 'absolute', top: 14, bottom: 14, left: '50%',
              width: 2, marginLeft: -1, background: C_LIST_CREAM_D
            }} />
            {/* Square pink thumb (matches device frame) */}
            <div style={{
              position: 'absolute',
              top: `calc(14px + ${scrollPct} * (100% - 38px))`,
              left: 1, right: 1, height: 14,
              background: C_FRAME_PINK,
              border: `2px solid ${C_BORDER}`,
              boxShadow: `inset 2px 2px 0 ${C_FRAME_PINK_HI}, inset -2px -2px 0 ${C_FRAME_PINK_LO}`,
            }} />
          </div>
        </div>
      </div>

      {/* ── Bottom bar (dark green, MENU + SEARCH) ─────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 relative"
        style={{
          background: C_HEADER_GREEN,
          borderTop: `4px solid ${C_BORDER}`,
          height: 46,
          boxShadow: `inset 0 2px 0 ${C_HEADER_GREEN2}, inset 0 -2px 0 #000`,
        }}>

        {/* START ● MENU — clickable, opens the settings overlay */}
        <button onClick={onOpenSettings}
          className="flex items-center gap-2 font-pixel active:scale-95 transition-transform"
          style={{
            fontSize: 9, color: '#fff', letterSpacing: 1,
            background: 'transparent', border: 'none',
            padding: '4px 6px', cursor: 'pointer',
          }}>
          <PixelDot color={C_RED} />
          <span style={{ color: C_FRAME_PINK_HI }}>MENU</span>
        </button>

        {/* SPIN button (centre) */}
        <button onClick={spin}
          disabled={mode !== 'browse' || disabled || pool.length === 0}
          className="font-pixel active:scale-95 transition-transform"
          style={{
            fontSize: 9, padding: '5px 22px',
            background: mode !== 'browse' || disabled || pool.length === 0 ? '#0a200f' : C_RED,
            color: mode !== 'browse' || disabled || pool.length === 0 ? '#3a5a3a' : '#fff',
            border: `3px solid ${mode !== 'browse' || disabled || pool.length === 0 ? '#000' : '#880000'}`,
            boxShadow: mode !== 'browse' || disabled || pool.length === 0 ? 'none' : '3px 3px 0 #000',
            cursor: mode !== 'browse' || disabled || pool.length === 0 ? 'not-allowed' : 'pointer',
            letterSpacing: 2,
          }}>
          {mode === 'spin' ? '...' : pool.length === 0 ? 'DONE!' : '> SPIN'}
        </button>

        {/* SELECT ● SEARCH */}
        <div className="flex items-center gap-2 font-pixel"
          style={{ fontSize: 9, color: '#fff', letterSpacing: 1 }}>
          <PixelDot color={C_YELLOW_HI} />
          <span style={{ color: C_YELLOW_HI }}>SEARCH</span>
        </div>
      </div>

      {/* ── Winner overlay ──────────────────────────────────────────── */}
      {mode === 'confirm' && winner && (
        <div className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="flex flex-col items-center gap-4 p-6 mx-4"
            style={{
              background: C_FRAME_PINK,
              border: `4px solid ${C_BORDER}`,
              boxShadow:
                `4px 4px 0 #000,
                    inset 3px 3px 0 ${C_FRAME_PINK_HI},
                    inset -3px -3px 0 ${C_FRAME_PINK_LO}`,
              maxWidth: 280, width: '100%',
            }}>
            <p className="font-pixel" style={{ fontSize: 8, color: C_YELLOW_HI, letterSpacing: 4 }}>
              - YOU GOT -
            </p>
            <div style={{
              width: 124, height: 124, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: C_SCREEN_WHITE,
              border: `3px solid ${C_BORDER}`,
              boxShadow: `inset 3px 3px 0 rgba(0,0,0,0.2),
                                      0 0 0 3px ${C_FRAME_PINK_HI}`
            }}>
              <img src={winner.sprite} alt={winner.name}
                style={{ width: 96, height: 96, imageRendering: 'pixelated', objectFit: 'contain' }}
                onError={e => { e.target.style.opacity = '0.3' }} />
            </div>
            <p className="font-pixel" style={{ fontSize: 13, color: '#fff', textAlign: 'center' }}>
              {winner.name.toUpperCase()}
            </p>
            {winner.type === 'pokemon' && (
              <p className="font-pixel" style={{ fontSize: 7, color: C_YELLOW_HI }}>
                No.{String(winner.pokeId).padStart(3, '0')}
              </p>
            )}
            {winner.type === 'trainer' && (
              <p className="font-pixel" style={{ fontSize: 7, color: C_YELLOW_HI, textAlign: 'center' }}>
                {winner.region} - {winner.role}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button onClick={confirmPick} className="flex-1 font-pixel active:scale-95 transition-transform"
                style={{
                  fontSize: 8, padding: '8px 0', background: C_RED, color: '#fff',
                  border: '3px solid #880000', boxShadow: '3px 3px 0 #000'
                }}>
                KEEP
              </button>
              <button onClick={skipPick} className="flex-1 font-pixel active:scale-95 transition-transform"
                style={{
                  fontSize: 8, padding: '8px 0', background: '#0a200f', color: '#8aaa8a',
                  border: '3px solid #000', boxShadow: '3px 3px 0 #000'
                }}>
                SKIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── StatBlock (SEEN / OWN with HOENN + NATIONAL) ──────────────────────── */
function StatBlock({ label, rows }) {
  return (
    <div className="flex flex-col items-stretch" style={{ gap: 2 }}>
      <p className="font-pixel text-center"
        style={{
          fontSize: 8, color: '#fff', letterSpacing: 2,
          textShadow: `1px 1px 0 ${'#982050'}`
        }}>
        {label}
      </p>
      {rows.map(([region, n]) => (
        <div key={region} className="flex items-baseline justify-between"
          style={{ paddingLeft: 2, paddingRight: 2 }}>
          <span className="font-pixel"
            style={{
              fontSize: 6, color: '#fff', letterSpacing: 1,
              textShadow: `1px 1px 0 ${'#982050'}`
            }}>
            {region}
          </span>
          <span className="font-pixel"
            style={{
              fontSize: 10, color: '#fff',
              textShadow: `1px 1px 0 ${'#982050'}`
            }}>
            {String(n).padStart(3, '0')}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Floppy/save icon (top-left of header) ─────────────────────────────── */
function FloppyIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10"
      style={{ imageRendering: 'pixelated', flexShrink: 0, display: 'block' }}>
      <rect x="0" y="0" width="10" height="10" fill="#000" />
      <rect x="1" y="1" width="8" height="8" fill="#d0d0d0" />
      <rect x="2" y="2" width="6" height="3" fill="#404040" />
      <rect x="3" y="3" width="2" height="2" fill="#d0d0d0" />
      <rect x="2" y="6" width="6" height="3" fill="#909090" />
      <rect x="3" y="7" width="4" height="1" fill="#000" />
    </svg>
  )
}

/* ── PixelDot (for MENU / SEARCH button indicators) ────────────────────── */
function PixelDot({ color }) {
  return (
    <span style={{
      width: 12, height: 12, display: 'inline-block',
      background: color, border: '2px solid #000',
      boxShadow: `inset 2px 2px 0 rgba(255,255,255,0.55), inset -1px -1px 0 rgba(0,0,0,0.4)`,
    }} />
  )
}

/* ── Pokeball icon (red, pixelated, as in the Pokedex image) ───────────── */
function PokeballIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10"
      style={{ imageRendering: 'pixelated', flexShrink: 0, display: 'block' }}>
      <rect x="0" y="0" width="10" height="10" fill="#111" />
      <rect x="1" y="1" width="8" height="3" fill="#CC0000" />
      <rect x="1" y="6" width="8" height="3" fill="#eee" />
      <rect x="1" y="4" width="8" height="2" fill="#111" />
      <rect x="3" y="4" width="4" height="2" fill="#fff" />
      <rect x="4" y="4" width="2" height="2" fill="#ccc" />
    </svg>
  )
}

/* ── SpriteCell ────────────────────────────────────────────────────────── */
function SpriteCell({ entry, h, highlighted }) {
  const [ok, setOk] = useState(true)
  const size = Math.floor(h * 0.82)
  return (
    <div className="flex items-center justify-center"
      style={{ height: h, opacity: highlighted ? 1 : 0.18, transition: 'opacity 0.08s' }}>
      {ok ? (
        <img src={entry.sprite} alt={entry.name}
          style={{ width: size, height: size, imageRendering: 'pixelated', objectFit: 'contain' }}
          onError={() => setOk(false)} />
      ) : (
        <Placeholder name={entry.name} size={size} region={entry.region} />
      )}
    </div>
  )
}

/* ── NameCell — pokeball, number, name (cream rows, yellow highlight) ──── */
function NameCell({ entry, h, highlighted, isPicked }) {
  const fs = Math.max(16, Math.floor(h * 0.52))
  const nfs = Math.max(16, Math.floor(h * 0.52))

  const numStr = entry.type === 'pokemon'
    ? `No${String(entry.pokeId).padStart(3, '0')}`
    : entry.region?.slice(0, 3).toUpperCase()

  return (
    <div className="flex items-center relative"
      style={{
        height: h,
        paddingLeft: 10, paddingRight: 6, gap: 6,
      }}>

      {/* Inset highlight background — sits behind content with margin around it */}
      {highlighted && (
        <div className="absolute pointer-events-none"
          style={{
            top: 4, bottom: 4, left: 32, right: 18,
            background: '#fffbff',
            borderRadius: '20px',
            zIndex: 0,
          }} />
      )}

      {/* Red pokeball — shown for every visible row (matches image) */}
      <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
        <PokeballIcon size={nfs + 4} />
      </span>

      {/* Number */}
      <span className="font-pixel flex-shrink-0"
        style={{
          position: 'relative', zIndex: 1,
          fontSize: nfs,
          lineHeight: 1,
          color: highlighted ? C_YELLOW_HI : '#3a2a10',
          textShadow: highlighted ? `1px 1px 0 ${C_FRAME_PINK_LO}` : 'none',
          minWidth: nfs * 2.8
        }}>
        {numStr}
      </span>

      {/* Name */}
      <span className="font-pixel truncate"
        style={{
          position: 'relative', zIndex: 1,
          fontSize: fs,
          lineHeight: 1,
          color: highlighted ? C_YELLOW_HI : '#3a2a10',
          textShadow: `1px 1px 0 ${C_DROPSHADOW}`,
          fontWeight: 'bold'
        }}>
        {entry.name.toUpperCase()}
      </span>

      {/* Picked-state marker (small dark dot at right edge) */}
      {isPicked && !highlighted && (
        <span style={{
          position: 'absolute', right: 10, top: '50%',
          transform: 'translateY(-50%)',
          width: 6, height: 6, background: C_FRAME_PINK_LO,
          border: '1px solid #000'
        }} />
      )}
    </div>
  )
}

/* ── Placeholder (when sprite fails to load) ───────────────────────────── */
const REGION_BG = {
  Kanto: '#E63946', Johto: '#F4A261', Hoenn: '#2A9D8F',
  Sinnoh: '#4361EE', Unova: '#9B5DE5', Kalos: '#F15BB5',
  Alola: '#FEE440', Galar: '#00BBF9', Paldea: '#FF6B35',
}
function Placeholder({ name, size, region }) {
  const bg = REGION_BG[region] || '#555'
  const txt = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  return (
    <div style={{
      width: size, height: size, background: bg, border: '2px solid rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <span className="font-pixel text-white" style={{ fontSize: Math.floor(size * 0.3) }}>{txt}</span>
    </div>
  )
}
