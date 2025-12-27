import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Menu from './pages/Menu'
import AiGame from './pages/AiGame'
import OnlineGame from './pages/OnlineGame'
import RankedQueue from './pages/RankedQueue'
import Dashboard from './pages/Dashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('menu')
  const [gameData, setGameData] = useState(null)

  useEffect(() => {
    // Clear OAuth error from URL
    if (window.location.search.includes('error=')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        createProfileIfNeeded(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await createProfileIfNeeded(session.user)
      }
      if (!session?.user) {
        setCurrentPage('menu')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const createProfileIfNeeded = async (user) => {
    try {
      console.log('Creating profile for user:', user.id)
      
      // Check if profile exists first
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (existing) {
        console.log('Profile already exists')
        return
      }
      
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: `Player#${Math.floor(Math.random() * 9999)}`,
          rating: 1200
        })
        .select()
      
      if (error) {
        console.error('Profile creation failed:', error)
      } else {
        console.log('Profile created successfully:', data)
      }
    } catch (error) {
      console.error('Profile creation error:', error)
    }
  }

  const navigateTo = (page, data = null) => {
    setCurrentPage(page)
    setGameData(data)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={navigateTo} />
      case 'menu':
        return <Menu user={user} onNavigate={navigateTo} />
      case 'ai-game':
        return <AiGame onNavigate={navigateTo} />
      case 'ranked-queue':
        return <RankedQueue user={user} onNavigate={navigateTo} />
      case 'online-game':
        return <OnlineGame user={user} gameData={gameData} onNavigate={navigateTo} />
      case 'dashboard':
        return <Dashboard user={user} onNavigate={navigateTo} />
      default:
        return <Menu user={user} onNavigate={navigateTo} />
    }
  }

  return (
    <div className="container">
      {renderPage()}
    </div>
  )
}

export default App