const CACHE_KEY = 'pokeroulette_pokemon_v2'
const TOTAL = 1025

// Deterministic sprite URL — no API call needed
export function pokeSpriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

// Extract numeric ID from PokeAPI resource URL
function idFromUrl(url) {
  const parts = url.replace(/\/$/, '').split('/')
  return parseInt(parts[parts.length - 1], 10)
}

// Capitalise first letter of each dash-separated word, clean form names
function formatName(raw) {
  return raw
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function fetchAllPokemon() {
  // Return from localStorage cache if fresh
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, ts } = JSON.parse(cached)
      // Cache valid for 7 days
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000 && data.length >= TOTAL) {
        return data
      }
    }
  } catch {}

  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${TOTAL}&offset=0`
  )
  if (!res.ok) throw new Error('Failed to fetch Pokémon list')
  const json = await res.json()

  const data = json.results
    .map(p => {
      const id = idFromUrl(p.url)
      return {
        id: `pokemon_${id}`,
        pokeId: id,
        name: formatName(p.name),
        type: 'pokemon',
        sprite: pokeSpriteUrl(id),
      }
    })
    .filter(p => p.pokeId >= 1 && p.pokeId <= TOTAL)
    .sort((a, b) => a.pokeId - b.pokeId)

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}

  return data
}
