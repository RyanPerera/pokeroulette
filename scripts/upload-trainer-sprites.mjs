/**
 * upload-trainer-sprites.mjs
 *
 * Run once from the project root:
 *   node scripts/upload-trainer-sprites.mjs
 *
 * What it does:
 *  1. Reads TRAINERS list
 *  2. For each trainer, fetches their Showdown sprite URL
 *  3. If 200 → downloads and uploads to Supabase Storage
 *  4. If 404 → generates a coloured placeholder SVG and uploads that
 *  5. Rewrites src/data/trainers.js with Supabase CDN URLs
 *
 * Requirements:
 *  - Node 18+ (built-in fetch)
 *  - .env file with VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY
 *    (service role key — found in Supabase Dashboard → Project Settings → API)
 *  - Supabase project with Storage enabled
 */

import { writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.join(__dirname, '..', '.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
// Use service role key — bypasses RLS, required for bucket creation & uploads
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const BUCKET = 'trainer-sprites'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  console.error('    Get your service role key from:')
  console.error('    Supabase Dashboard → Project Settings → API → service_role (secret)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Region colours for placeholder SVGs ──────────────────────────────────────
const REGION_COLORS = {
  Kanto: '#E63946',  Johto: '#F4A261',  Hoenn: '#2A9D8F',
  Sinnoh: '#4361EE', Unova: '#9B5DE5',  Kalos: '#F15BB5',
  Alola:  '#FEE440', Galar: '#00BBF9',  Paldea: '#FF6B35',
}

function makePlaceholderSvg(name, region) {
  const color = REGION_COLORS[region] || '#888'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="46" fill="${color}" stroke="#111" stroke-width="3"/>
  <text x="48" y="56" font-family="monospace" font-size="28" font-weight="bold"
        fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
</svg>`.trim())
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Could not create bucket: ${error.message}`)
    console.log(`✅  Created bucket "${BUCKET}"`)
  } else {
    console.log(`✅  Bucket "${BUCKET}" exists`)
  }
}

async function uploadBuffer(filename, buffer, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType, upsert: true })
  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

// ── Read trainer list from source ────────────────────────────────────────────
// We inline a minimal copy here so the script is standalone
const TRAINERS = [
  // Kanto
  { id: 'tr_red',      name: 'Red',       region: 'Kanto', role: 'Champion',          slug: 'red' },
  { id: 'tr_blue',     name: 'Blue',      region: 'Kanto', role: 'Rival/Champion',    slug: 'blue' },
  { id: 'tr_brock',    name: 'Brock',     region: 'Kanto', role: 'Gym Leader',        slug: 'brock' },
  { id: 'tr_misty',    name: 'Misty',     region: 'Kanto', role: 'Gym Leader',        slug: 'misty' },
  { id: 'tr_ltsurge',  name: 'Lt. Surge', region: 'Kanto', role: 'Gym Leader',        slug: 'ltsurge' },
  { id: 'tr_erika',    name: 'Erika',     region: 'Kanto', role: 'Gym Leader',        slug: 'erika' },
  { id: 'tr_koga',     name: 'Koga',      region: 'Kanto', role: 'Gym Leader',        slug: 'koga' },
  { id: 'tr_sabrina',  name: 'Sabrina',   region: 'Kanto', role: 'Gym Leader',        slug: 'sabrina' },
  { id: 'tr_blaine',   name: 'Blaine',    region: 'Kanto', role: 'Gym Leader',        slug: 'blaine' },
  { id: 'tr_giovanni', name: 'Giovanni',  region: 'Kanto', role: 'Gym Leader/Boss',   slug: 'giovanni' },
  { id: 'tr_lorelei',  name: 'Lorelei',   region: 'Kanto', role: 'Elite Four',        slug: 'lorelei' },
  { id: 'tr_bruno',    name: 'Bruno',     region: 'Kanto', role: 'Elite Four',        slug: 'bruno' },
  { id: 'tr_agatha',   name: 'Agatha',    region: 'Kanto', role: 'Elite Four',        slug: 'agatha' },
  { id: 'tr_lance',    name: 'Lance',     region: 'Kanto', role: 'Elite Four/Champ',  slug: 'lance' },
  // Johto
  { id: 'tr_gold',     name: 'Gold',      region: 'Johto', role: 'Protagonist',       slug: 'gold' },
  { id: 'tr_kris',     name: 'Kris',      region: 'Johto', role: 'Protagonist',       slug: 'kris' },
  { id: 'tr_silver',   name: 'Silver',    region: 'Johto', role: 'Rival',             slug: 'silver' },
  { id: 'tr_falkner',  name: 'Falkner',   region: 'Johto', role: 'Gym Leader',        slug: 'falkner' },
  { id: 'tr_bugsy',    name: 'Bugsy',     region: 'Johto', role: 'Gym Leader',        slug: 'bugsy' },
  { id: 'tr_whitney',  name: 'Whitney',   region: 'Johto', role: 'Gym Leader',        slug: 'whitney' },
  { id: 'tr_morty',    name: 'Morty',     region: 'Johto', role: 'Gym Leader',        slug: 'morty' },
  { id: 'tr_chuck',    name: 'Chuck',     region: 'Johto', role: 'Gym Leader',        slug: 'chuck' },
  { id: 'tr_jasmine',  name: 'Jasmine',   region: 'Johto', role: 'Gym Leader',        slug: 'jasmine' },
  { id: 'tr_pryce',    name: 'Pryce',     region: 'Johto', role: 'Gym Leader',        slug: 'pryce' },
  { id: 'tr_clair',    name: 'Clair',     region: 'Johto', role: 'Gym Leader',        slug: 'clair' },
  { id: 'tr_will',     name: 'Will',      region: 'Johto', role: 'Elite Four',        slug: 'will' },
  { id: 'tr_karen',    name: 'Karen',     region: 'Johto', role: 'Elite Four',        slug: 'karen' },
  // Hoenn
  { id: 'tr_brendan',  name: 'Brendan',   region: 'Hoenn', role: 'Protagonist',       slug: 'brendan' },
  { id: 'tr_may',      name: 'May',       region: 'Hoenn', role: 'Protagonist',       slug: 'may' },
  { id: 'tr_wally',    name: 'Wally',     region: 'Hoenn', role: 'Rival',             slug: 'wally' },
  { id: 'tr_roxanne',  name: 'Roxanne',   region: 'Hoenn', role: 'Gym Leader',        slug: 'roxanne' },
  { id: 'tr_brawly',   name: 'Brawly',    region: 'Hoenn', role: 'Gym Leader',        slug: 'brawly' },
  { id: 'tr_wattson',  name: 'Wattson',   region: 'Hoenn', role: 'Gym Leader',        slug: 'wattson' },
  { id: 'tr_flannery', name: 'Flannery',  region: 'Hoenn', role: 'Gym Leader',        slug: 'flannery' },
  { id: 'tr_norman',   name: 'Norman',    region: 'Hoenn', role: 'Gym Leader',        slug: 'norman' },
  { id: 'tr_winona',   name: 'Winona',    region: 'Hoenn', role: 'Gym Leader',        slug: 'winona' },
  { id: 'tr_tate',     name: 'Tate',      region: 'Hoenn', role: 'Gym Leader',        slug: 'tate' },
  { id: 'tr_liza',     name: 'Liza',      region: 'Hoenn', role: 'Gym Leader',        slug: 'liza' },
  { id: 'tr_wallace',  name: 'Wallace',   region: 'Hoenn', role: 'Gym Leader/Champ',  slug: 'wallace' },
  { id: 'tr_juan',     name: 'Juan',      region: 'Hoenn', role: 'Gym Leader',        slug: 'juan' },
  { id: 'tr_sidney',   name: 'Sidney',    region: 'Hoenn', role: 'Elite Four',        slug: 'sidney' },
  { id: 'tr_phoebe',   name: 'Phoebe',    region: 'Hoenn', role: 'Elite Four',        slug: 'phoebe' },
  { id: 'tr_glacia',   name: 'Glacia',    region: 'Hoenn', role: 'Elite Four',        slug: 'glacia' },
  { id: 'tr_drake',    name: 'Drake',     region: 'Hoenn', role: 'Elite Four',        slug: 'drake' },
  { id: 'tr_steven',   name: 'Steven',    region: 'Hoenn', role: 'Champion',          slug: 'steven' },
  { id: 'tr_archie',   name: 'Archie',    region: 'Hoenn', role: 'Team Boss',         slug: 'archie' },
  { id: 'tr_maxie',    name: 'Maxie',     region: 'Hoenn', role: 'Team Boss',         slug: 'maxie' },
  // Sinnoh
  { id: 'tr_lucas',    name: 'Lucas',     region: 'Sinnoh', role: 'Protagonist',      slug: 'lucas' },
  { id: 'tr_dawn',     name: 'Dawn',      region: 'Sinnoh', role: 'Protagonist',      slug: 'dawn' },
  { id: 'tr_barry',    name: 'Barry',     region: 'Sinnoh', role: 'Rival',            slug: 'barry' },
  { id: 'tr_roark',    name: 'Roark',     region: 'Sinnoh', role: 'Gym Leader',       slug: 'roark' },
  { id: 'tr_gardenia', name: 'Gardenia',  region: 'Sinnoh', role: 'Gym Leader',       slug: 'gardenia' },
  { id: 'tr_maylene',  name: 'Maylene',   region: 'Sinnoh', role: 'Gym Leader',       slug: 'maylene' },
  { id: 'tr_crasherwake', name: 'Crasher Wake', region: 'Sinnoh', role: 'Gym Leader', slug: 'crasherwake' },
  { id: 'tr_fantina',  name: 'Fantina',   region: 'Sinnoh', role: 'Gym Leader',       slug: 'fantina' },
  { id: 'tr_byron',    name: 'Byron',     region: 'Sinnoh', role: 'Gym Leader',       slug: 'byron' },
  { id: 'tr_candice',  name: 'Candice',   region: 'Sinnoh', role: 'Gym Leader',       slug: 'candice' },
  { id: 'tr_volkner',  name: 'Volkner',   region: 'Sinnoh', role: 'Gym Leader',       slug: 'volkner' },
  { id: 'tr_aaron',    name: 'Aaron',     region: 'Sinnoh', role: 'Elite Four',       slug: 'aaron' },
  { id: 'tr_bertha',   name: 'Bertha',    region: 'Sinnoh', role: 'Elite Four',       slug: 'bertha' },
  { id: 'tr_flint',    name: 'Flint',     region: 'Sinnoh', role: 'Elite Four',       slug: 'flint' },
  { id: 'tr_lucian',   name: 'Lucian',    region: 'Sinnoh', role: 'Elite Four',       slug: 'lucian' },
  { id: 'tr_cynthia',  name: 'Cynthia',   region: 'Sinnoh', role: 'Champion',         slug: 'cynthia' },
  { id: 'tr_cyrus',    name: 'Cyrus',     region: 'Sinnoh', role: 'Team Boss',        slug: 'cyrus' },
  // Unova
  { id: 'tr_hilbert',  name: 'Hilbert',   region: 'Unova', role: 'Protagonist',       slug: 'hilbert' },
  { id: 'tr_hilda',    name: 'Hilda',     region: 'Unova', role: 'Protagonist',       slug: 'hilda' },
  { id: 'tr_cheren',   name: 'Cheren',    region: 'Unova', role: 'Rival/Gym Leader',  slug: 'cheren' },
  { id: 'tr_bianca',   name: 'Bianca',    region: 'Unova', role: 'Rival',             slug: 'bianca' },
  { id: 'tr_n',        name: 'N',         region: 'Unova', role: 'Rival/Boss',        slug: 'n' },
  { id: 'tr_cilan',    name: 'Cilan',     region: 'Unova', role: 'Gym Leader',        slug: 'cilan' },
  { id: 'tr_chili',    name: 'Chili',     region: 'Unova', role: 'Gym Leader',        slug: 'chili' },
  { id: 'tr_cress',    name: 'Cress',     region: 'Unova', role: 'Gym Leader',        slug: 'cress' },
  { id: 'tr_lenora',   name: 'Lenora',    region: 'Unova', role: 'Gym Leader',        slug: 'lenora' },
  { id: 'tr_burgh',    name: 'Burgh',     region: 'Unova', role: 'Gym Leader',        slug: 'burgh' },
  { id: 'tr_elesa',    name: 'Elesa',     region: 'Unova', role: 'Gym Leader',        slug: 'elesa' },
  { id: 'tr_clay',     name: 'Clay',      region: 'Unova', role: 'Gym Leader',        slug: 'clay' },
  { id: 'tr_skyla',    name: 'Skyla',     region: 'Unova', role: 'Gym Leader',        slug: 'skyla' },
  { id: 'tr_brycen',   name: 'Brycen',    region: 'Unova', role: 'Gym Leader',        slug: 'brycen' },
  { id: 'tr_drayden',  name: 'Drayden',   region: 'Unova', role: 'Gym Leader',        slug: 'drayden' },
  { id: 'tr_iris',     name: 'Iris',      region: 'Unova', role: 'Gym Leader/Champ',  slug: 'iris' },
  { id: 'tr_shauntal', name: 'Shauntal',  region: 'Unova', role: 'Elite Four',        slug: 'shauntal' },
  { id: 'tr_marshal',  name: 'Marshal',   region: 'Unova', role: 'Elite Four',        slug: 'marshal' },
  { id: 'tr_grimsley', name: 'Grimsley',  region: 'Unova', role: 'Elite Four',        slug: 'grimsley' },
  { id: 'tr_caitlin',  name: 'Caitlin',   region: 'Unova', role: 'Elite Four',        slug: 'caitlin' },
  { id: 'tr_alder',    name: 'Alder',     region: 'Unova', role: 'Champion',          slug: 'alder' },
  { id: 'tr_ghetsis',  name: 'Ghetsis',   region: 'Unova', role: 'Team Boss',         slug: 'ghetsis' },
  // Kalos
  { id: 'tr_calem',    name: 'Calem',     region: 'Kalos', role: 'Protagonist',       slug: 'calem' },
  { id: 'tr_serena',   name: 'Serena',    region: 'Kalos', role: 'Protagonist',       slug: 'serena' },
  { id: 'tr_shauna',   name: 'Shauna',    region: 'Kalos', role: 'Rival',             slug: 'shauna' },
  { id: 'tr_tierno',   name: 'Tierno',    region: 'Kalos', role: 'Rival',             slug: 'tierno' },
  { id: 'tr_trevor',   name: 'Trevor',    region: 'Kalos', role: 'Rival',             slug: 'trevor' },
  { id: 'tr_viola',    name: 'Viola',     region: 'Kalos', role: 'Gym Leader',        slug: 'viola' },
  { id: 'tr_grant',    name: 'Grant',     region: 'Kalos', role: 'Gym Leader',        slug: 'grant' },
  { id: 'tr_korrina',  name: 'Korrina',   region: 'Kalos', role: 'Gym Leader',        slug: 'korrina' },
  { id: 'tr_ramos',    name: 'Ramos',     region: 'Kalos', role: 'Gym Leader',        slug: 'ramos' },
  { id: 'tr_clemont',  name: 'Clemont',   region: 'Kalos', role: 'Gym Leader',        slug: 'clemont' },
  { id: 'tr_valerie',  name: 'Valerie',   region: 'Kalos', role: 'Gym Leader',        slug: 'valerie' },
  { id: 'tr_olympia',  name: 'Olympia',   region: 'Kalos', role: 'Gym Leader',        slug: 'olympia' },
  { id: 'tr_wulfric',  name: 'Wulfric',   region: 'Kalos', role: 'Gym Leader',        slug: 'wulfric' },
  { id: 'tr_malva',    name: 'Malva',     region: 'Kalos', role: 'Elite Four',        slug: 'malva' },
  { id: 'tr_siebold',  name: 'Siebold',   region: 'Kalos', role: 'Elite Four',        slug: 'siebold' },
  { id: 'tr_wikstrom', name: 'Wikstrom',  region: 'Kalos', role: 'Elite Four',        slug: 'wikstrom' },
  { id: 'tr_drasna',   name: 'Drasna',    region: 'Kalos', role: 'Elite Four',        slug: 'drasna' },
  { id: 'tr_diantha',  name: 'Diantha',   region: 'Kalos', role: 'Champion',          slug: 'diantha' },
  { id: 'tr_lysandre', name: 'Lysandre',  region: 'Kalos', role: 'Team Boss',         slug: 'lysandre' },
  // Alola
  { id: 'tr_elio',     name: 'Elio',      region: 'Alola', role: 'Protagonist',       slug: 'elio' },
  { id: 'tr_selene',   name: 'Selene',    region: 'Alola', role: 'Protagonist',       slug: 'selene' },
  { id: 'tr_hau',      name: 'Hau',       region: 'Alola', role: 'Rival',             slug: 'hau' },
  { id: 'tr_lillie',   name: 'Lillie',    region: 'Alola', role: 'Ally',              slug: 'lillie' },
  { id: 'tr_ilima',    name: 'Ilima',     region: 'Alola', role: 'Trial Captain',     slug: 'ilima' },
  { id: 'tr_lana',     name: 'Lana',      region: 'Alola', role: 'Trial Captain',     slug: 'lana' },
  { id: 'tr_kiawe',    name: 'Kiawe',     region: 'Alola', role: 'Trial Captain',     slug: 'kiawe' },
  { id: 'tr_mallow',   name: 'Mallow',    region: 'Alola', role: 'Trial Captain',     slug: 'mallow' },
  { id: 'tr_sophocles',name: 'Sophocles', region: 'Alola', role: 'Trial Captain',     slug: 'sophocles' },
  { id: 'tr_acerola',  name: 'Acerola',   region: 'Alola', role: 'Captain/E4',        slug: 'acerola' },
  { id: 'tr_mina',     name: 'Mina',      region: 'Alola', role: 'Trial Captain',     slug: 'mina' },
  { id: 'tr_hala',     name: 'Hala',      region: 'Alola', role: 'Kahuna/E4',         slug: 'hala' },
  { id: 'tr_olivia',   name: 'Olivia',    region: 'Alola', role: 'Kahuna/E4',         slug: 'olivia' },
  { id: 'tr_nanu',     name: 'Nanu',      region: 'Alola', role: 'Kahuna/E4',         slug: 'nanu' },
  { id: 'tr_hapu',     name: 'Hapu',      region: 'Alola', role: 'Kahuna',            slug: 'hapu' },
  { id: 'tr_molayne',  name: 'Molayne',   region: 'Alola', role: 'Elite Four',        slug: 'molayne' },
  { id: 'tr_kahili',   name: 'Kahili',    region: 'Alola', role: 'Elite Four',        slug: 'kahili' },
  { id: 'tr_kukui',    name: 'Kukui',     region: 'Alola', role: 'Champion',          slug: 'kukui' },
  { id: 'tr_guzma',    name: 'Guzma',     region: 'Alola', role: 'Team Boss',         slug: 'guzma' },
  { id: 'tr_plumeria', name: 'Plumeria',  region: 'Alola', role: 'Team Admin',        slug: 'plumeria' },
  { id: 'tr_lusamine', name: 'Lusamine',  region: 'Alola', role: 'Team Boss',         slug: 'lusamine' },
  // Galar
  { id: 'tr_victor',   name: 'Victor',    region: 'Galar', role: 'Protagonist',       slug: 'victor' },
  { id: 'tr_gloria',   name: 'Gloria',    region: 'Galar', role: 'Protagonist',       slug: 'gloria' },
  { id: 'tr_hop',      name: 'Hop',       region: 'Galar', role: 'Rival',             slug: 'hop' },
  { id: 'tr_marnie',   name: 'Marnie',    region: 'Galar', role: 'Rival',             slug: 'marnie' },
  { id: 'tr_bede',     name: 'Bede',      region: 'Galar', role: 'Rival',             slug: 'bede' },
  { id: 'tr_milo',     name: 'Milo',      region: 'Galar', role: 'Gym Leader',        slug: 'milo' },
  { id: 'tr_nessa',    name: 'Nessa',     region: 'Galar', role: 'Gym Leader',        slug: 'nessa' },
  { id: 'tr_kabu',     name: 'Kabu',      region: 'Galar', role: 'Gym Leader',        slug: 'kabu' },
  { id: 'tr_bea',      name: 'Bea',       region: 'Galar', role: 'Gym Leader',        slug: 'bea' },
  { id: 'tr_allister', name: 'Allister',  region: 'Galar', role: 'Gym Leader',        slug: 'allister' },
  { id: 'tr_opal',     name: 'Opal',      region: 'Galar', role: 'Gym Leader',        slug: 'opal' },
  { id: 'tr_gordie',   name: 'Gordie',    region: 'Galar', role: 'Gym Leader',        slug: 'gordie' },
  { id: 'tr_melony',   name: 'Melony',    region: 'Galar', role: 'Gym Leader',        slug: 'melony' },
  { id: 'tr_piers',    name: 'Piers',     region: 'Galar', role: 'Gym Leader',        slug: 'piers' },
  { id: 'tr_raihan',   name: 'Raihan',    region: 'Galar', role: 'Gym Leader',        slug: 'raihan' },
  { id: 'tr_leon',     name: 'Leon',      region: 'Galar', role: 'Champion',          slug: 'leon' },
  { id: 'tr_oleana',   name: 'Oleana',    region: 'Galar', role: 'Team Admin',        slug: 'oleana' },
  { id: 'tr_rose',     name: 'Rose',      region: 'Galar', role: 'Team Boss',         slug: 'rose' },
  // Paldea
  { id: 'tr_florian',  name: 'Florian',   region: 'Paldea', role: 'Protagonist',      slug: 'florian' },
  { id: 'tr_juliana',  name: 'Juliana',   region: 'Paldea', role: 'Protagonist',      slug: 'juliana' },
  { id: 'tr_nemona',   name: 'Nemona',    region: 'Paldea', role: 'Rival',            slug: 'nemona' },
  { id: 'tr_arven',    name: 'Arven',     region: 'Paldea', role: 'Ally',             slug: 'arven' },
  { id: 'tr_penny',    name: 'Penny',     region: 'Paldea', role: 'Ally/Boss',        slug: 'penny' },
  { id: 'tr_katy',     name: 'Katy',      region: 'Paldea', role: 'Gym Leader',       slug: 'katy' },
  { id: 'tr_brassius', name: 'Brassius',  region: 'Paldea', role: 'Gym Leader',       slug: 'brassius' },
  { id: 'tr_iono',     name: 'Iono',      region: 'Paldea', role: 'Gym Leader',       slug: 'iono' },
  { id: 'tr_kofu',     name: 'Kofu',      region: 'Paldea', role: 'Gym Leader',       slug: 'kofu' },
  { id: 'tr_larry',    name: 'Larry',     region: 'Paldea', role: 'Gym Leader/E4',    slug: 'larry' },
  { id: 'tr_ryme',     name: 'Ryme',      region: 'Paldea', role: 'Gym Leader',       slug: 'ryme' },
  { id: 'tr_tulip',    name: 'Tulip',     region: 'Paldea', role: 'Gym Leader',       slug: 'tulip' },
  { id: 'tr_grusha',   name: 'Grusha',    region: 'Paldea', role: 'Gym Leader',       slug: 'grusha' },
  { id: 'tr_rika',     name: 'Rika',      region: 'Paldea', role: 'Elite Four',       slug: 'rika' },
  { id: 'tr_poppy',    name: 'Poppy',     region: 'Paldea', role: 'Elite Four',       slug: 'poppy' },
  { id: 'tr_hassel',   name: 'Hassel',    region: 'Paldea', role: 'Elite Four',       slug: 'hassel' },
  { id: 'tr_geeta',    name: 'Geeta',     region: 'Paldea', role: 'Champion',         slug: 'geeta' },
  { id: 'tr_kieran',   name: 'Kieran',    region: 'Paldea', role: 'Rival (DLC)',      slug: 'kieran' },
]

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  Starting trainer sprite upload...\n')
  await ensureBucket()

  const results = []
  let hits = 0, misses = 0

  for (const trainer of TRAINERS) {
    const showdownUrl = `https://play.pokemonshowdown.com/sprites/trainers/${trainer.slug}.png`
    process.stdout.write(`  ${trainer.name.padEnd(18)} `)

    let publicUrl
    try {
      const res = await fetch(showdownUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        publicUrl = await uploadBuffer(`${trainer.slug}.png`, buf, 'image/png')
        console.log(`✅  sprite found`)
        hits++
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch {
      // Generate placeholder SVG
      const svg = makePlaceholderSvg(trainer.name, trainer.region)
      publicUrl = await uploadBuffer(`${trainer.slug}.svg`, svg, 'image/svg+xml')
      console.log(`🔷  placeholder generated`)
      misses++
    }

    results.push({ ...trainer, sprite: publicUrl })

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 120))
  }

  console.log(`\n✅  Done! ${hits} real sprites, ${misses} placeholders.\n`)

  // Write updated trainers.js
  const outPath = path.join(__dirname, '..', 'src', 'data', 'trainers.js')
  let out = `// Auto-generated by scripts/upload-trainer-sprites.mjs\n`
  out += `// Sprites hosted in Supabase Storage bucket "${BUCKET}"\n\n`
  out += `export const TRAINERS_DEDUPED = [\n`
  for (const t of results) {
    out += `  { id: ${JSON.stringify(t.id)}, name: ${JSON.stringify(t.name)}, `
    out += `region: ${JSON.stringify(t.region)}, role: ${JSON.stringify(t.role)}, `
    out += `type: 'trainer', sprite: ${JSON.stringify(t.sprite)} },\n`
  }
  out += `]\n`

  writeFileSync(outPath, out)
  console.log(`📝  Updated ${outPath}`)
}

main().catch(e => { console.error('\n❌ ', e.message); process.exit(1) })
