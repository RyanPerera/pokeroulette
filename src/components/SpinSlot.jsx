import { useState, useRef, useEffect, useCallback } from 'react'
import PokeballIcon from './PokeballIcon'
import pokeballSil from '../assets/pokeballsil.png'

const EASE_OUT = t => 1 - Math.pow(1 - t, 4)
const SPIN_COUNT = 500
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

/* Grey pixelated wheel-rim gradient — fades over the sprite scroller */
const FADE_TOP_GREY = mkFade('bottom', '#4a4a4a')
const FADE_BOT_GREY = mkFade('top', '#4a4a4a')

/* Pixel staircase rounded corners (clip-path). `s` = step size in px,
   corner depth is 4*s — the classic GBA window corner. */
const pixelRound = (s) => {
  const a = `${s}px`, b = `${s * 2}px`, c = `${s * 4}px`
  return `polygon(
    0 ${c}, ${a} ${c}, ${a} ${b}, ${b} ${b}, ${b} ${a}, ${c} ${a}, ${c} 0,
    calc(100% - ${c}) 0, calc(100% - ${c}) ${a}, calc(100% - ${b}) ${a},
    calc(100% - ${b}) ${b}, calc(100% - ${a}) ${b}, calc(100% - ${a}) ${c}, 100% ${c},
    100% calc(100% - ${c}), calc(100% - ${a}) calc(100% - ${c}),
    calc(100% - ${a}) calc(100% - ${b}), calc(100% - ${b}) calc(100% - ${b}),
    calc(100% - ${b}) calc(100% - ${a}), calc(100% - ${c}) calc(100% - ${a}),
    calc(100% - ${c}) 100%,
    ${c} 100%, ${c} calc(100% - ${a}), ${b} calc(100% - ${a}),
    ${b} calc(100% - ${b}), ${a} calc(100% - ${b}), ${a} calc(100% - ${c}),
    0 calc(100% - ${c})
  )`
}

export default function SpinSlot({
  entries = [],             /* full dex — everything browseable           */
  pool = [],                /* not-yet-owned — what the roulette draws on */
  onPick, disabled,
  category, onCategoryChange,
  seenStats = { pokemon: 0, trainers: 0, both: 0 },
  ownStats = { pokemon: 0, trainers: 0, both: 0 },
  pickedIds,
  onSignOut, onShowPicks,
  spinMs = 4000,            /* spin duration in ms (overridable from settings) */
  onOpenSettings,           /* () => void — called when the user hits MENU */
  initialIndex = 0,         /* starting browse position (used by the dev preview) */
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
  const [browseIdx, setBrowseIdx] = useState(initialIndex)
  const [spinSeq, setSpinSeq] = useState([])
  const [spinFloat, setSpinFloat] = useState(0)
  const [winner, setWinner] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

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
    if (entries.length === 0) { setBrowseIdx(0); return }
    setBrowseIdx(i => Math.min(i, entries.length - 1))
  }, [entries.length])

  useEffect(() => {
    const el = wrapRef.current; if (!el) return
    const fn = e => {
      if (mode !== 'browse') return
      e.preventDefault()
      setBrowseIdx(i => Math.max(0, Math.min(entries.length - 1, i + Math.sign(e.deltaY))))
    }
    el.addEventListener('wheel', fn, { passive: false })
    return () => el.removeEventListener('wheel', fn)
  }, [mode, entries.length])

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
        setBrowseIdx(i => Math.max(0, Math.min(entries.length - 1, i + Math.sign(dy))))
    }
    el.addEventListener('touchstart', s, { passive: true })
    el.addEventListener('touchmove', m, { passive: false })
    return () => { el.removeEventListener('touchstart', s); el.removeEventListener('touchmove', m) }
  }, [mode, entries.length, RIGHT_H])

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

  const displayList = (mode === 'spin' || mode === 'confirm') ? spinSeq : entries
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

      {/* ── Two-panel body (no header / footer — like the GBA screen) ── */}
      <div className="flex flex-1 min-h-0" style={{ overflow: 'hidden' }}>

        {/* LEFT — green scanline panel + dark pokeball silhouette (per image) */}
        <div className="flex flex-shrink-0 relative"
          style={{
            width: '42%',
            borderRight: `4px solid ${C_BORDER}`,
            paddingTop: 52,
            /* bright green horizontal scanlines, like the GBA backdrop */
            background: `repeating-linear-gradient(to bottom,
              #58a858 0px, #58a858 4px,
              #3c7c3c 4px, #3c7c3c 8px)`,
          }}>

          {/* Pokeball silhouette — square, solid dark-navy, offset to the left
              so only its right side shows (band + button let the green through) */}
          <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden', zIndex: 0 }}>
            <img src={pokeballSil} alt=""
              style={{
                position: 'absolute', left: '4%', top: '54%',
                transform: 'translate(-50%, -50%)',
                height: '78%', aspectRatio: '1 / 1', width: 'auto',
                imageRendering: 'pixelated',
              }} />
          </div>

          {/* POKEDEX logo — thick black text on a pixel-rounded white pill */}
          <div className="absolute z-20" style={{ top: 10, left: '50%', transform: 'translateX(-50%)' }}>
            <span className="font-pixel" style={{
              display: 'inline-block', fontSize: 30, fontWeight: 'bold', lineHeight: 1,
              color: '#101010', background: '#f8f8f8',
              padding: '6px 22px 8px', letterSpacing: 3,
              clipPath: pixelRound(4), whiteSpace: 'nowrap',
              textShadow: '2px 0 0 #101010',
            }}>
              POKéDEX
            </span>
          </div>

          {/* SEEN / OWN stats column (wider, like the image) with the
              START MENU / SELECT SEARCH cluster pinned at the bottom */}
          <div className="flex flex-col flex-shrink-0 relative"
            style={{
              width: 148,
              zIndex: 1,
              padding: '20px 8px 14px',
            }}>

            {/* stats — justified between vertically, with POKeMON / TRAINER /
                BOTH rows under each heading (like HOENN / NATIONAL in the image) */}
            <div className="flex flex-col justify-between min-h-0"
              style={{ height: '58%', padding: '4px 0' }}>
              <StatBlock label="SEEN" rows={[
                ['POKéMON', seenStats.pokemon],
                ['TRAINER', seenStats.trainers],
                ['BOTH', seenStats.both],
              ]} />
              <StatBlock label="OWN" rows={[
                ['POKéMON', ownStats.pokemon],
                ['TRAINER', ownStats.trainers],
                ['BOTH', ownStats.both],
              ]} />
            </div>

            {/* spacer pushes MENU / SEARCH to the bottom */}
            <div className="flex-1" />

            {/* START● MENU — opens the menu dialog */}
            <button onClick={() => setMenuOpen(true)}
              className="flex items-center font-pixel active:scale-95 transition-transform"
              style={{
                gap: 8, background: 'transparent', border: 'none',
                padding: '4px 0', cursor: 'pointer',
              }}>
              <ConsoleTag text="START" />
              <span style={{
                fontSize: 19, lineHeight: 1, color: '#f8f8f8',
                textShadow: STAT_OUTLINE,
              }}>MENU</span>
            </button>

            {/* SELECT● SEARCH — opens the search dialog */}
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center font-pixel active:scale-95 transition-transform"
              style={{
                gap: 8, background: 'transparent', border: 'none',
                padding: '4px 0', cursor: 'pointer', marginTop: 8,
              }}>
              <ConsoleTag text="SELECT" />
              <span style={{
                fontSize: 19, lineHeight: 1, color: '#f8f8f8',
                textShadow: STAT_OUTLINE,
              }}>SEARCH</span>
            </button>
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
                    0 0 0 3px #9aa49a`,
            }}>

            {/* Centre selection bar */}
            <div className="absolute inset-x-0 z-10 pointer-events-none"
              style={{
                top: spriteH / 2 - LEFT_H / 2, height: LEFT_H
              }} />

            {/* Sprite track — non-centred sprites squash like a 3D wheel */}
            <div style={{ transform: `translateY(${leftY}px)`, willChange: 'transform' }}>
              {items.map((entry, i) => (
                <SpriteCell key={`${entry.id}-${i}`} entry={entry} h={LEFT_H}
                  dist={Math.abs(winStart + i - floatIdx)} />
              ))}
            </div>

            {/* Pixelated GREY wheel-rim gradient — top + bottom of sprite scroll */}
            <div className="absolute inset-x-0 top-0 pointer-events-none z-20"
              style={{ height: 72, background: FADE_TOP_GREY }} />
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20"
              style={{ height: 72, background: FADE_BOT_GREY }} />

            {/* SPIN button — floats over the bottom of the sprite screen */}
            <button onClick={spin}
              disabled={mode !== 'browse' || disabled || pool.length === 0}
              className="absolute z-30 font-pixel active:scale-95 transition-transform"
              style={{
                bottom: 10, left: '50%', transform: 'translateX(-50%)',
                fontSize: 13, padding: '6px 26px',
                background: mode !== 'browse' || disabled || pool.length === 0 ? '#0a200f' : C_RED,
                color: mode !== 'browse' || disabled || pool.length === 0 ? '#3a5a3a' : '#fff',
                border: `3px solid ${mode !== 'browse' || disabled || pool.length === 0 ? '#000' : '#880000'}`,
                boxShadow: mode !== 'browse' || disabled || pool.length === 0 ? 'none' : '3px 3px 0 #000',
                cursor: mode !== 'browse' || disabled || pool.length === 0 ? 'not-allowed' : 'pointer',
                letterSpacing: 2,
              }}>
              {mode === 'spin' ? '...' : pool.length === 0 ? 'DONE!' : '> SPIN'}
            </button>
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

        {/* RIGHT — name list column with big pink arrows above + below */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* big pink UP arrow strip (replaces the old header) */}
          <div className="flex-shrink-0 flex items-center justify-center"
            style={{ height: 30, background: '#08120a' }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: '19px solid transparent', borderRight: '19px solid transparent',
              borderBottom: '20px solid #f060a8',
            }} />
          </div>

          {/* golden yellow name scroller */}
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

          {/* big pink DOWN arrow strip (replaces the old footer) */}
          <div className="flex-shrink-0 flex items-center justify-center"
            style={{ height: 30, background: '#08120a' }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: '19px solid transparent', borderRight: '19px solid transparent',
              borderTop: '20px solid #f060a8',
            }} />
          </div>
        </div>
      </div>

      {/* ── MENU dialog (START) — settings / picks / sign out ──────────── */}
      {menuOpen && (
        <GbaDialog title="MENU" onClose={() => setMenuOpen(false)}>
          <DialogOption label="SETTINGS"
            onClick={() => { setMenuOpen(false); onOpenSettings?.() }} />
          <DialogOption label={`PICKS  ${ownStats.both}`}
            onClick={() => { setMenuOpen(false); onShowPicks?.() }} />
          <DialogOption label="SIGN OUT" danger
            onClick={() => { setMenuOpen(false); onSignOut?.() }} />
          <DialogOption label="CANCEL" onClick={() => setMenuOpen(false)} />
        </GbaDialog>
      )}

      {/* ── SEARCH dialog (SELECT) — category filter ────────────────────── */}
      {searchOpen && (
        <GbaDialog title="SEARCH" onClose={() => setSearchOpen(false)}>
          {CATEGORIES.map(c => (
            <DialogOption key={c.key} label={c.label} selected={category === c.key}
              onClick={() => { onCategoryChange?.(c.key); setSearchOpen(false) }} />
          ))}
          <DialogOption label="CANCEL" onClick={() => setSearchOpen(false)} />
        </GbaDialog>
      )}

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

/* ── StatBlock — label, WHITE underline, then value (exactly as the image) ── */
const STAT_OUTLINE = `2px 0 0 #181830, -2px 0 0 #181830,
                      0 2px 0 #181830, 0 -2px 0 #181830,
                      2px 2px 0 #181830`
function StatBlock({ label, rows }) {
  return (
    <div className="flex flex-col" style={{ gap: 7 }}>
      <p className="font-pixel text-center"
        style={{
          fontSize: 19, color: '#f8f8f8', letterSpacing: 1,
          lineHeight: 1,
          textShadow: STAT_OUTLINE,
        }}>
        {label}
      </p>
      {/* white underline beneath the heading — full column width */}
      <div style={{
        width: '100%', height: 3, background: '#f8f8f8',
        boxShadow: '0 2px 0 rgba(0,0,0,0.55)',
      }} />
      {/* rows — small label left, larger value right (like HOENN 185) */}
      {rows.map(([name, v]) => (
        <div key={name} className="flex items-baseline justify-between"
          style={{ padding: '2px 2px 0' }}>
          <span className="font-pixel"
            style={{
              fontSize: 11, color: '#f8f8f8', letterSpacing: 0.5,
              lineHeight: 1, textShadow: STAT_OUTLINE,
            }}>
            {name}
          </span>
          <span className="font-pixel"
            style={{
              fontSize: 17, color: '#f8f8f8', lineHeight: 1,
              textShadow: STAT_OUTLINE,
            }}>
            {v}
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

/* ── GbaDialog — small centred Emerald-style menu box ──────────────────── */
function GbaDialog({ title, onClose, children }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          minWidth: 230,
          background: C_FRAME_PINK,
          border: `4px solid ${C_BORDER}`,
          boxShadow:
            `4px 4px 0 rgba(0,0,0,0.75),
             inset 3px 3px 0 ${C_FRAME_PINK_HI},
             inset -3px -3px 0 ${C_FRAME_PINK_LO}`,
          padding: 8,
        }}>
        <p className="font-pixel text-center"
          style={{
            fontSize: 13, color: '#fff', letterSpacing: 3,
            marginBottom: 8, textShadow: '2px 2px 0 #000',
          }}>
          {title}
        </p>
        <div style={{
          background: '#f8f8f8', border: `3px solid ${C_BORDER}`,
          padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── DialogOption — one row in a GbaDialog ─────────────────────────────── */
function DialogOption({ label, onClick, selected, danger }) {
  return (
    <button onClick={onClick}
      className="font-pixel text-left active:scale-95 transition-transform"
      style={{
        fontSize: 12, lineHeight: 1, padding: '7px 10px',
        background: selected ? '#f0f33a' : 'transparent',
        color: danger ? '#a02020' : '#3a3a3a',
        border: 'none', cursor: 'pointer',
        textShadow: '1px 1px 0 #d0d0d0',
        letterSpacing: 1,
      }}>
      {selected ? '▶ ' : '   '}{label}
    </button>
  )
}

/* ── ConsoleTag — pink START / SELECT lozenge with the black button dot
      inside its right end (exactly as the image) ──────────────────────── */
function ConsoleTag({ text }) {
  return (
    <span className="font-pixel" style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: '#e860a8',
      padding: '3px 6px 4px 11px', borderRadius: 11,
      border: '2px solid #882050',
      boxShadow: 'inset 0 2px 0 #f8a0c8',
      textShadow: 'none',
    }}>
      <span style={{
        fontSize: 12, lineHeight: 1, color: '#3a1030', letterSpacing: 1,
      }}>
        {text}
      </span>
      <span style={{
        width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
        background: '#101018', border: '2px solid #000',
        boxShadow: 'inset 1px 2px 0 rgba(255,255,255,0.35)',
      }} />
    </span>
  )
}

/* ── SpriteCell — squashes as it leaves centre, like a 3D scroll wheel ─── */
function SpriteCell({ entry, h, dist }) {
  const [ok, setOk] = useState(true)
  const size = Math.floor(h * 0.82)
  const d = Math.min(1, dist)
  const squash = `scale(${1 - 0.12 * d}, ${1 - 0.45 * d})`
  return (
    <div className="flex items-center justify-center"
      style={{
        height: h,
        opacity: 1 - 0.82 * d,
        transform: squash,
        transition: 'opacity 0.08s, transform 0.08s',
      }}>
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

/* ── NameCell — pokeball (owned only), number, name ────────────────────── */
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

      {/* Pokeball gutter — SVG ball shown ONLY when this entry is owned.
          The gutter keeps its width either way so numbers stay aligned. */}
      <span style={{
        position: 'relative', zIndex: 1, display: 'flex',
        width: nfs + 4, justifyContent: 'center', flexShrink: 0,
      }}>
        {isPicked && <PokeballIcon size={nfs + 2} />}
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
