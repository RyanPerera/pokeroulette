import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePicks } from '../hooks/usePicks'
import { fetchAllPokemon } from '../lib/pokeapi'
import { TRAINERS_DEDUPED } from '../data/trainers'
import SpinSlot from '../components/SpinSlot'
import PickedList from '../components/PickedList'
import SettingsPanel from '../components/SettingsPanel'

/* localStorage key used to persist user settings across reloads */
const LS_SPIN_MS = 'pokeroulette.spinMs'

export default function MainPage() {
  const { user, signOut } = useAuth()
  const { picks, loading: picksLoading, addPick, removePick, resetAllPicks } = usePicks(user?.id)

  const [pokemonList, setPokemonList] = useState([])
  const [loadingPoke, setLoadingPoke] = useState(true)
  const [pokeError, setPokeError] = useState(null)
  const [category, setCategory] = useState('pokemon')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ── Settings (persisted to localStorage) ──────────────────────────── */
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [spinMs, setSpinMs] = useState(() => {
    const saved = Number(localStorage.getItem(LS_SPIN_MS))
    return Number.isFinite(saved) && saved >= 500 ? saved : 4000
  })
  useEffect(() => { localStorage.setItem(LS_SPIN_MS, String(spinMs)) }, [spinMs])

  useEffect(() => {
    fetchAllPokemon()
      .then(setPokemonList)
      .catch(e => setPokeError(e.message))
      .finally(() => setLoadingPoke(false))
  }, [])

  const pickedIds = useMemo(() => new Set(picks.map(p => p.entry_id)), [picks])

  const allEntries = useMemo(() => {
    let base = []
    if (category === 'pokemon' || category === 'both') base = [...base, ...pokemonList]
    if (category === 'trainer' || category === 'both') base = [...base, ...TRAINERS_DEDUPED]
    return base
  }, [category, pokemonList])

  const pool = useMemo(() => allEntries.filter(e => !pickedIds.has(e.id)), [allEntries, pickedIds])

  /* SEEN / OWN split by type (POKeMON / TRAINER / BOTH rows in the dex) */
  const seenStats = {
    pokemon: pokemonList.length,
    trainers: TRAINERS_DEDUPED.length,
    both: pokemonList.length + TRAINERS_DEDUPED.length,
  }
  const ownStats = {
    pokemon: picks.filter(p => p.entry_type === 'pokemon').length,
    trainers: picks.filter(p => p.entry_type === 'trainer').length,
    both: picks.length,
  }

  const handlePick = async entry => { await addPick(entry) }

  return (
    /* Full-screen pink scanline backdrop (from body) */
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">

      {/* Centered max-width container */}
      <div className="w-full max-w-[1640px] flex gap-0 relative"
        style={{ height: 'calc(100vh - 2rem)', maxHeight: 860 }}>

        {/* Main slot */}
        <main className="flex-1 flex min-h-0 relative">
          {loadingPoke ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4"
              style={{ background: '#e94e8a', border: '4px solid #000' }}>
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
              <p className="font-pixel text-[8px]" style={{ color: '#fff' }}>LOADING POKeDEX...</p>
            </div>
          ) : pokeError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3"
              style={{ background: '#e94e8a', border: '4px solid #000' }}>
              <p className="font-pixel text-[8px] text-center px-8"
                style={{ color: '#fff', lineHeight: 2 }}>
                Could not load Pokemon data.<br />Check your connection and reload.
              </p>
              <button onClick={() => window.location.reload()}
                className="font-pixel text-[8px] px-4 py-2"
                style={{ background: '#CC0000', color: '#fff', border: '3px solid #880000' }}>
                RELOAD
              </button>
            </div>
          ) : (
            <SpinSlot
              entries={allEntries}
              pool={pool}
              onPick={handlePick}
              disabled={picksLoading}
              category={category}
              onCategoryChange={setCategory}
              seenStats={seenStats}
              ownStats={ownStats}
              pickedIds={pickedIds}
              onSignOut={signOut}
              onShowPicks={() => setSidebarOpen(o => !o)}
              spinMs={spinMs}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
        </main>

        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className="fixed top-0 right-0 h-full z-30 flex flex-col pt-3 pb-3 px-3
                     lg:relative lg:top-auto lg:z-auto"
          style={{
            width: 272,
            background: '#982050',
            borderLeft: '4px solid #000',
            boxShadow: 'inset 3px 0 0 #ff7eb0',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.25s',
          }}
        >
          <PickedList
            picks={picks}
            onRemove={removePick}
            onReset={resetAllPicks}
            loadingPicks={picksLoading}
          />
        </aside>
      </div>

      {/* Settings overlay — opened from the SpinSlot footer's MENU button */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        spinMs={spinMs}
        onSpinMsChange={setSpinMs}
      />
    </div>
  )
}
