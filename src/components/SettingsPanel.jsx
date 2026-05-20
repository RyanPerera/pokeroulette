/* ── GBA Pokedex palette (mirrors SpinSlot) ────────────────────────────── */
const C_FRAME_PINK    = '#d04888'
const C_FRAME_PINK_HI = '#e878a8'
const C_FRAME_PINK_LO = '#982050'
const C_HEADER_GREEN  = '#0e3018'
const C_HEADER_GREEN2 = '#1c4828'
const C_LIST_CREAM    = '#f0f33a'
const C_YELLOW_HI     = '#f8e030'
const C_RED           = '#CC0000'
const C_BORDER        = '#000'

/**
 * Pokedex-styled modal for editing spin/scroll settings.
 *
 * Props:
 *   open           - boolean
 *   onClose        - () => void
 *   spinMs         - number (current spin duration in ms)
 *   onSpinMsChange - (newMs: number) => void
 *
 * Add more sliders here as you expose more knobs (spinCount, ease, etc.).
 * The panel is intentionally self-contained — no global state required.
 */
export default function SettingsPanel({
  open, onClose,
  spinMs, onSpinMsChange,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>

      <div onClick={e => e.stopPropagation()}
        className="flex flex-col"
        style={{
          width: '100%', maxWidth: 380,
          background: C_FRAME_PINK,
          border: `4px solid ${C_BORDER}`,
          boxShadow:
            `4px 4px 0 rgba(0,0,0,0.75),
             inset 3px 3px 0 ${C_FRAME_PINK_HI},
             inset -3px -3px 0 ${C_FRAME_PINK_LO}`,
        }}>

        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between"
          style={{
            background: C_HEADER_GREEN,
            borderBottom: `4px solid ${C_BORDER}`,
            boxShadow: `inset 0 2px 0 ${C_HEADER_GREEN2}, inset 0 -2px 0 #000`,
          }}>
          <span className="font-pixel"
            style={{ fontSize: 13, color: '#fff', letterSpacing: 3 }}>
            SETTINGS
          </span>
          <button onClick={onClose} className="font-pixel"
            style={{
              fontSize: 9, padding: '2px 8px',
              background: C_FRAME_PINK_HI, color: '#000',
              border: '2px solid #000', boxShadow: '2px 2px 0 #000',
            }}>
            CLOSE
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-5"
          style={{ background: C_LIST_CREAM }}>

          <SettingSlider
            label="SPIN DURATION"
            valueLabel={`${(spinMs / 1000).toFixed(1)}s`}
            min={500} max={10000} step={100}
            value={spinMs}
            onChange={onSpinMsChange}
            tickLeft="0.5s"
            tickRight="10s"
          />

          {/* Add more SettingSlider rows here for additional knobs. */}
        </div>

        {/* Footer bar — match SpinSlot styling */}
        <div className="px-3 flex items-center justify-between"
          style={{
            background: C_HEADER_GREEN,
            borderTop: `4px solid ${C_BORDER}`,
            height: 38,
            boxShadow: `inset 0 2px 0 ${C_HEADER_GREEN2}, inset 0 -2px 0 #000`,
          }}>
          <span className="font-pixel" style={{ fontSize: 8, color: C_FRAME_PINK_HI }}>
            ◄ BACK
          </span>
          <span className="font-pixel" style={{ fontSize: 8, color: C_YELLOW_HI }}>
            SAVED
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── A single labelled slider row ──────────────────────────────────────── */
function SettingSlider({ label, valueLabel, min, max, step, value, onChange, tickLeft, tickRight }) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="flex items-baseline justify-between">
        <span className="font-pixel"
          style={{ fontSize: 9, color: C_FRAME_PINK_LO, letterSpacing: 1 }}>
          {label}
        </span>
        <span className="font-pixel"
          style={{ fontSize: 11, color: '#2a1808',
                   textShadow: `1px 1px 0 ${C_FRAME_PINK_HI}` }}>
          {valueLabel}
        </span>
      </div>

      <input type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: C_FRAME_PINK,
          height: 18,
        }} />

      <div className="flex justify-between font-pixel"
        style={{ fontSize: 7, color: '#5a3818' }}>
        <span>{tickLeft}</span>
        <span>{tickRight}</span>
      </div>
    </div>
  )
}
