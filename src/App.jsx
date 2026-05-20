import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 px-8 py-6"
             style={{
               background: '#e94e8a',
               border: '4px solid #000',
               boxShadow:
                 `4px 4px 0 rgba(0,0,0,0.75),
                  inset 3px 3px 0 #ff7eb0,
                  inset -3px -3px 0 #982050`,
             }}>
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
          <p className="font-pixel"
             style={{ fontSize: 9, color: '#fff', letterSpacing: 2,
                      textShadow: '1px 1px 0 #982050' }}>LOADING...</p>
        </div>
      </div>
    )
  }

  return user ? <MainPage /> : <LoginPage />
}
