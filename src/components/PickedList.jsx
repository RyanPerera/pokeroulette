import { useState } from 'react'
import PokeballIcon from './PokeballIcon'

/* ── Palette (matches SpinSlot Pokedex theme) ──────────────────────────── */
const C_FRAME_PINK = '#d04888'
const C_FRAME_PINK_HI = '#e878a8'
const C_FRAME_PINK_LO = '#982050'
const C_HEADER_GREEN = '#0e3018'
const C_HEADER_GREEN2 = '#1c4828'
const C_LIST_CREAM = '#e0b828'
const C_YELLOW_HI = '#f8e030'
const C_RED = '#CC0000'
const C_BORDER = '#000'

export default function PickedList({ picks, onRemove, onReset, loadingPicks }) {
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(false)

  const filtered = picks.filter(p =>
    filter === 'all' ? true : p.entry_type === filter
  )

  return (
    <div className="flex flex-col h-full min-h-0"
      style={{
        background: C_FRAME_PINK,
        border: `4px solid ${C_BORDER}`,
        boxShadow:
          `inset 3px 3px 0 ${C_FRAME_PINK_HI},
              inset -3px -3px 0 ${C_FRAME_PINK_LO}`,
      }}>

      {/* Header — dark green, mirrors SpinSlot */}
      <div className="p-3 flex-shrink-0"
        style={{
          background: C_HEADER_GREEN,
          borderBottom: `4px solid ${C_BORDER}`,
          boxShadow: `inset 0 2px 0 ${C_HEADER_GREEN2}, inset 0 -2px 0 #000`,
        }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-pixel" style={{ fontSize: 11, color: '#fff', letterSpacing: 2 }}>
            PICKED
          </h2>
          <span className="font-pixel"
            style={{
              fontSize: 10, color: C_YELLOW_HI,
              textShadow: '1px 1px 0 #000'
            }}>
            {String(picks.length).padStart(3, '0')}
          </span>
        </div>

        <div className="flex gap-1 mb-2">
          {['all', 'pokemon', 'trainer'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 font-pixel transition-colors"
              style={{
                fontSize: 6, padding: '4px 0',
                background: filter === f ? C_FRAME_PINK_HI : '#0a200f',
                color: filter === f ? '#000' : '#8aaa8a',
                border: '2px solid ' + (filter === f ? '#000' : C_HEADER_GREEN2),
                boxShadow: filter === f ? '2px 2px 0 #000' : 'none',
              }}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {picks.length > 0 && (
          confirm ? (
            <div className="flex gap-1">
              <button onClick={() => { onReset(); setConfirm(false) }}
                className="flex-1 font-pixel"
                style={{
                  fontSize: 6, padding: '4px 0', background: C_RED, color: '#fff',
                  border: '2px solid #000', boxShadow: '2px 2px 0 #000'
                }}>
                CONFIRM RESET
              </button>
              <button onClick={() => setConfirm(false)}
                className="flex-1 font-pixel"
                style={{
                  fontSize: 6, padding: '4px 0', background: '#0a200f', color: '#8aaa8a',
                  border: '2px solid #000'
                }}>
                CANCEL
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)}
              className="w-full font-pixel"
              style={{
                fontSize: 6, padding: '4px 0', background: C_FRAME_PINK_LO, color: '#fff',
                border: '2px solid #000', boxShadow: '2px 2px 0 #000'
              }}>
              RESET ALL PICKS
            </button>
          )
        )}
      </div>

      {/* List — golden background to match Pokedex right pane */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2"
        style={{
          gap: 4, display: 'flex', flexDirection: 'column',
          background: C_LIST_CREAM
        }}>
        {loadingPicks ? (
          <p className="font-pixel text-center pt-4"
            style={{ fontSize: 7, color: '#3a2a10' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="font-pixel text-center pt-4"
            style={{ fontSize: 7, color: '#3a2a10', lineHeight: 2 }}>
            No {filter === 'all' ? '' : filter} picks yet
          </p>
        ) : (
          filtered.map(pick => (
            <PickRow key={pick.id} pick={pick} onRemove={onRemove} />
          ))
        )}
      </div>
    </div>
  )
}

function PickRow({ pick, onRemove }) {
  const [imgOk, setImgOk] = useState(true)

  return (
    <div className="flex items-center gap-2 group"
      style={{
        background: '#f0c838',
        padding: '6px 8px',
        border: `2px solid ${C_FRAME_PINK}`,
        boxShadow: `inset 0 0 0 1px ${C_FRAME_PINK_HI}`,
      }}>

      {/* Pokeball icon — everything picked is owned */}
      <PokeballIcon size={14} />

      {/* Sprite */}
      <div className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: 36, height: 36,
          background: '#fff',
          border: `2px solid ${C_BORDER}`,
          boxShadow: `inset 2px 2px 0 rgba(0,0,0,0.15)`,
        }}>
        {imgOk && pick.sprite_url ? (
          <img src={pick.sprite_url} alt={pick.entry_name}
            className="object-contain"
            style={{ width: 32, height: 32, imageRendering: 'pixelated' }}
            onError={() => setImgOk(false)} />
        ) : (
          <span style={{ fontSize: 18, color: '#3a2a10' }}>?</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-pixel truncate"
          style={{ fontSize: 8, color: '#2a1808' }}>
          {pick.entry_name?.toUpperCase()}
        </p>
        <p className="font-pixel" style={{ fontSize: 6, color: '#5a3818', marginTop: 2 }}>
          {pick.entry_type === 'pokemon'
            ? 'No' + String(pick.entry_id?.replace('pokemon_', '')).padStart(3, '0')
            : pick.entry_type?.toUpperCase()}
        </p>
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(pick.id)}
        className="font-pixel"
        style={{
          fontSize: 8, color: C_RED, padding: '2px 4px',
          border: `2px solid ${C_FRAME_PINK_LO}`,
          background: '#fff',
          boxShadow: '2px 2px 0 #000'
        }}
        title="Remove">
        x
      </button>
    </div>
  )
}
