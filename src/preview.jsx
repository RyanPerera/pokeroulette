/* Dev-only preview harness — renders SpinSlot with mock data (no Supabase,
   no auth) so the UI can be eyeballed against the Emerald screenshot.
   Built via vite.preview.config.js, NOT part of the real app bundle. */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import SpinSlot from './components/SpinSlot'
import PickedList from './components/PickedList'
import './index.css'

/* Font path fix for file:// preview — same family, relative URL wins */
const style = document.createElement('style')
style.textContent = `@font-face {
  font-family: 'Pokemon Emerald';
  src: url('./pokemon-emerald.woff2') format('woff2');
  font-weight: normal; font-style: normal; font-display: block;
}`
document.head.appendChild(style)

/* Hoenn dex slice around Zangoose (national id, hoenn no, name) */
const SPECIES = [
  [331, 111, 'CACNEA'], [332, 112, 'CACTURNE'], [333, 113, 'SWABLU'],
  [334, 114, 'ALTARIA'], [335, 115, 'ZANGOOSE'], [336, 116, 'SEVIPER'],
  [337, 117, 'LUNATONE'], [338, 118, 'SOLROCK'], [339, 119, 'BARBOACH'],
  [340, 120, 'WHISCASH'], [341, 121, 'CORPHISH'], [342, 122, 'CRAWDAUNT'],
  [343, 123, 'BALTOY'], [344, 124, 'CLAYDOL'], [345, 125, 'LILEEP'],
  [346, 126, 'CRADILY'], [347, 127, 'ANORITH'], [348, 128, 'ARMALDO'],
  [349, 129, 'FEEBAS'], [350, 130, 'MILOTIC'], [351, 131, 'CASTFORM'],
  [352, 132, 'KECLEON'], [353, 133, 'SHUPPET'], [354, 134, 'BANETTE'],
  [355, 135, 'DUSKULL'], [356, 136, 'DUSCLOPS'], [357, 137, 'TROPIUS'],
  [358, 138, 'CHIMECHO'], [359, 139, 'ABSOL'], [360, 140, 'WYNAUT'],
]

const entries = SPECIES.map(([nat, no, name]) => ({
  id: `pokemon_${nat}`,
  type: 'pokemon',
  pokeId: no,
  name,
  sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nat}.png`,
  region: 'Hoenn',
}))

/* Mock owned: SEVIPER + CACTURNE — these should show the pokeball */
const pickedIds = new Set(['pokemon_336', 'pokemon_332'])
const pool = entries.filter(e => !pickedIds.has(e.id))

const mockPicks = [...pickedIds].map((id, i) => {
  const e = entries.find(x => x.id === id)
  return {
    id: `pick_${i}`, entry_id: id, entry_type: 'pokemon',
    entry_name: e.name, sprite_url: e.sprite,
  }
})

function Preview() {
  const [category, setCategory] = useState('pokemon')
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl flex gap-0 relative"
        style={{ height: 'calc(100vh - 2rem)', maxHeight: 860 }}>
        <main className="flex-1 flex min-h-0 relative">
          <SpinSlot
            entries={entries}
            pool={pool}
            onPick={() => {}}
            disabled={false}
            category={category}
            onCategoryChange={setCategory}
            seenCount={80}
            ownCount={20}
            pickedIds={pickedIds}
            onSignOut={() => {}}
            onShowPicks={() => {}}
            spinMs={4000}
            onOpenSettings={() => {}}
            initialIndex={4}
          />
        </main>
        <aside className="hidden lg:flex flex-col pt-3 pb-3 px-3"
          style={{
            width: 272,
            background: '#982050',
            borderLeft: '4px solid #000',
            boxShadow: 'inset 3px 0 0 #ff7eb0',
          }}>
          <PickedList picks={mockPicks} onRemove={() => {}} onReset={() => {}} loadingPicks={false} />
        </aside>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Preview />)
