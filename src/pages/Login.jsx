import { useState } from 'react'
import { supabase } from '../supabase'

function Login({ onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      
      if (error) throw error
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '36px' }}>
        🪨📄✂️ Rock Paper Scissors
      </h1>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Sign in to play ranked multiplayer matches!
        </p>
        
        {error && <div className="error">{error}</div>}
        
        <button 
          className="btn btn-primary" 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ fontSize: '18px', padding: '15px 30px' }}
        >
          {loading ? 'Signing in...' : '🔐 Sign in with Google'}
        </button>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => onNavigate('menu')}
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}

export default Login