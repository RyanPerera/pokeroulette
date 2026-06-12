/* ── Shared GBA Emerald Pokedex UI helpers ─────────────────────────────────
   Palette sampled from the Emerald Pokedex screenshot, plus helpers for the
   pixel-stepped ("staircase") rounded corners the GBA uses everywhere. */

export const GBA = {
  /* pink device frame */
  PINK: '#d04888',
  PINK_HI: '#e878a8',
  PINK_LO: '#982050',
  PINK_LINE: '#a83068',   // scrollbar track / arrows

  /* dark left panel */
  DARK: '#0d1610',
  DARK_LINE: '#121d15',   // pinstripe
  DARK_DECO: '#1c2a20',   // big decorative circle

  /* POKeDEX logo */
  LOGO: '#f8f8d0',
  LOGO_SH: '#0c2818',

  /* list / screens */
  WHITE: '#f8f8f8',
  LIST_BG: '#eef0f2',     // very light gray list backdrop
  PILL: '#ffffff',        // selected-entry pill
  PILL_SH: '#aeb2b8',     // pill drop shadow
  TEXT: '#42424a',        // dex text
  TEXT_SH: '#c9c9d1',     // dex text drop shadow

  /* buttons */
  GREEN_BTN: '#58b068',
  GREEN_BTN_D: '#2c7040',
  RED: '#CC0000',
  RED_D: '#880000',
}

/* Pixel staircase rounded corners (clip-path).
   `s` is the step size in real px — corner depth is 4*s, matching the
   classic GBA window corner (skip pattern 4,2,1,1). */
export const pixelRound = (s) => {
  const a = `${Math.max(1, Math.round(s))}px`
  const b = `${Math.max(2, Math.round(s * 2))}px`
  const c = `${Math.max(4, Math.round(s * 4))}px`
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

/* Pokeball icon — extracted 1:1 from the SVG used on
   https://ryanperera.github.io/pokeroulette/ (public/pokeball.svg). */
export function PokeballIcon({ size = 12, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block', ...style }}>
      <circle cx="50" cy="50" r="48" fill="#CC0000" stroke="#111" strokeWidth="4" />
      <path d="M2 50 Q2 2 50 2 Q98 2 98 50Z" fill="#CC0000" />
      <path d="M2 50 Q2 98 50 98 Q98 98 98 50Z" fill="white" />
      <rect x="2" y="46" width="96" height="8" fill="#111" />
      <circle cx="50" cy="50" r="14" fill="white" stroke="#111" strokeWidth="4" />
      <circle cx="50" cy="50" r="7" fill="#ddd" />
    </svg>
  )
}
