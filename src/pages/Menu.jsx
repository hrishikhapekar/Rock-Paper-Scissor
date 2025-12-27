import { supabase } from '../supabase'

function Menu({ user, onNavigate }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="card">
      <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '36px' }}>
        🪨📄✂️ Rock Paper Scissors
      </h1>
      
      {user && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '18px' }}>Welcome back, {user.user_metadata?.full_name || 'Player'}!</p>
        </div>
      )}
      
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '30px' }}>Choose Game Mode</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => onNavigate('ai-game')}
            style={{ fontSize: '18px', padding: '15px 30px', minWidth: '250px' }}
          >
            🤖 Practice vs AI
          </button>
          
          {user ? (
            <button 
              className="btn btn-primary" 
              onClick={() => onNavigate('ranked-queue')}
              style={{ fontSize: '18px', padding: '15px 30px', minWidth: '250px' }}
            >
              🏆 Ranked Multiplayer
            </button>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={() => onNavigate('login')}
              style={{ fontSize: '18px', padding: '15px 30px', minWidth: '250px' }}
            >
              🔐 Login for Ranked Play
            </button>
          )}
          
          {user && (
            <button 
              className="btn btn-secondary" 
              onClick={() => onNavigate('dashboard')}
              style={{ fontSize: '16px', padding: '12px 24px', minWidth: '250px' }}
            >
              📊 Dashboard & Leaderboard
            </button>
          )}
        </div>
        
        {user && (
          <div style={{ marginTop: '30px' }}>
            <button 
              className="btn" 
              onClick={handleLogout}
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Menu