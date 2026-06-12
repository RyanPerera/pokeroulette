import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

/* Palette — mirrors SpinSlot Pokedex theme */
const C_FRAME_PINK    = '#d04888'
const C_FRAME_PINK_HI = '#e878a8'
const C_FRAME_PINK_LO = '#982050'
const C_HEADER_GREEN  = '#0e3018'
const C_HEADER_GREEN2 = '#1c4828'
const C_LIST_CREAM    = '#e0b828'
const C_YELLOW_HI     = '#f8e030'
const C_RED           = '#CC0000'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Pokedex device */}
      <div className="w-full max-w-md"
           style={{
             background: C_FRAME_PINK,
             border: '4px solid #000',
             boxShadow:
               `4px 4px 0 rgba(0,0,0,0.75),
                inset 3px 3px 0 ${C_FRAME_PINK_HI},
                inset -3px -3px 0 ${C_FRAME_PINK_LO}`,
           }}>

        {/* Header bar (dark green, matches SpinSlot) */}
        <div className="flex items-center justify-between px-3 py-2"
             style={{
               background: C_HEADER_GREEN,
               borderBottom: '4px solid #000',
               boxShadow: `inset 0 2px 0 ${C_HEADER_GREEN2}, inset 0 -2px 0 #000`,
             }}>
          <span className="font-pixel text-white"
                style={{ fontSize: 13, letterSpacing: 3 }}>
            POKeDEX
          </span>
          <span style={{ display: 'inline-block', width: 0, height: 0,
                         borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                         borderBottom: `8px solid ${C_FRAME_PINK_HI}` }} />
        </div>

        {/* Cream body */}
        <div className="p-5"
             style={{
               background: C_LIST_CREAM,
               borderTop: '2px solid #000',
               borderBottom: '2px solid #000',
             }}>

          <h1 className="font-pixel text-center"
              style={{ fontSize: 20, color: C_FRAME_PINK_LO,
                       textShadow: `2px 2px 0 ${C_YELLOW_HI}`,
                       letterSpacing: 3, marginBottom: 4 }}>
            POKeMON
          </h1>
          <h2 className="font-pixel text-center"
              style={{ fontSize: 28, color: C_FRAME_PINK,
                       textShadow: '2px 2px 0 #982050',
                       letterSpacing: 4, marginBottom: 16 }}>
            ROULETTE
          </h2>

          {/* Mode tabs */}
          <div className="flex mb-4" style={{ gap: 4 }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage('') }}
                className="flex-1 font-pixel"
                style={{
                  fontSize: 14, padding: '8px 0',
                  background: mode === m ? C_FRAME_PINK : '#fff4d0',
                  color:      mode === m ? '#fff' : C_FRAME_PINK_LO,
                  border: '2px solid #000',
                  boxShadow: mode === m ? '2px 2px 0 #000' : 'none',
                  textShadow: mode === m ? '1px 1px 0 #982050' : 'none',
                  letterSpacing: 2,
                }}>
                {m === 'login' ? 'LOG IN' : 'SIGN UP'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="font-pixel block mb-1"
                     style={{ fontSize: 13, color: C_FRAME_PINK_LO, letterSpacing: 1, textShadow: 'none' }}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full font-pixel focus:outline-none"
                style={{
                  background: '#fff',
                  border: '3px solid #000',
                  color: '#1a1208',
                  fontSize: 17,
                  padding: '10px 12px',
                  textShadow: 'none',
                }}
                placeholder="trainer@email.com"
              />
            </div>
            <div>
              <label className="font-pixel block mb-1"
                     style={{ fontSize: 13, color: C_FRAME_PINK_LO, letterSpacing: 1, textShadow: 'none' }}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full font-pixel focus:outline-none"
                style={{
                  background: '#fff',
                  border: '3px solid #000',
                  color: '#1a1208',
                  fontSize: 17,
                  padding: '10px 12px',
                  textShadow: 'none',
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="font-pixel text-center"
                 style={{ fontSize: 13, color: C_RED, lineHeight: 1.6, textShadow: 'none' }}>{error}</p>
            )}
            {message && (
              <p className="font-pixel text-center"
                 style={{ fontSize: 13, color: C_HEADER_GREEN, lineHeight: 1.6, textShadow: 'none' }}>{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-pixel active:scale-95 transition-transform"
              style={{
                fontSize: 17,
                padding: '10px 0',
                background: loading ? '#888' : C_RED,
                color: '#fff',
                border: '3px solid #000',
                boxShadow: '3px 3px 0 #000',
                letterSpacing: 2,
                marginTop: 4,
              }}
            >
              {loading ? '...' : mode === 'login' ? '> START' : '> CREATE'}
            </button>
          </form>
        </div>

        {/* Bottom bar — matches SpinSlot footer */}
        <div className="flex items-center justify-between px-3"
             style={{
               background: C_HEADER_GREEN,
               borderTop: '4px solid #000',
               height: 38,
               boxShadow: `inset 0 2px 0 ${C_HEADER_GREEN2}, inset 0 -2px 0 #000`,
             }}>
          <div className="flex items-center gap-2 font-pixel"
               style={{ fontSize: 8, color: C_FRAME_PINK_HI, letterSpacing: 1 }}>
            <PixelDot color={C_RED} />
            <span>MENU</span>
          </div>
          <div className="flex items-center gap-2 font-pixel"
               style={{ fontSize: 8, color: C_YELLOW_HI, letterSpacing: 1 }}>
            <PixelDot color={C_YELLOW_HI} />
            <span>SEARCH</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PixelDot({ color }) {
  return (
    <span style={{
      width: 11, height: 11, display: 'inline-block',
      background: color, border: '2px solid #000',
      boxShadow: `inset 2px 2px 0 rgba(255,255,255,0.55), inset -1px -1px 0 rgba(0,0,0,0.4)`,
    }} />
  )
}
