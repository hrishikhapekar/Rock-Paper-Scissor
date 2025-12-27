import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Dashboard({ user, onNavigate }) {
  const [userProfile, setUserProfile] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [localStats, setLocalStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardData()
    loadLocalStats()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setUserProfile(profile)

      // Get leaderboard (top 10) with win/loss stats
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('profiles')
        .select('username, rating, wins, losses')
        .order('rating', { ascending: false })
        .limit(10)

      if (leaderboardError) throw leaderboardError
      setLeaderboard(leaderboardData)

    } catch (error) {
      setError('Failed to load dashboard: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadLocalStats = () => {
    const stats = JSON.parse(localStorage.getItem('aiGameStats') || '{"wins": 0, "losses": 0, "streak": 0}')
    setLocalStats(stats)
  }

  const getUserRank = () => {
    if (!userProfile || !leaderboard.length) return null
    const rank = leaderboard.findIndex(player => player.username === userProfile.username) + 1
    return rank > 0 ? rank : null
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">{error}</div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('menu')}>
            ← Back to Menu
          </button>
        </div>
      </div>
    )
  }

  const userRank = getUserRank()

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Dashboard</h2>
      
      {/* User Profile Section */}
      {userProfile && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '20px', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Your Profile</h3>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>
              <strong>{userProfile.username}</strong>
            </div>
            <div style={{ fontSize: '18px', color: '#4ecdc4', marginBottom: '10px' }}>
              Rating: <strong>{userProfile.rating}</strong>
            </div>
            {userRank && (
              <div style={{ fontSize: '16px', color: '#ffa502' }}>
                Global Rank: <strong>#{userRank}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local AI Stats */}
      {localStats && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>AI Practice Stats</h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#2ed573', fontWeight: 'bold' }}>
                {localStats.wins}
              </div>
              <div style={{ fontSize: '14px' }}>Wins</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ff4757', fontWeight: 'bold' }}>
                {localStats.losses}
              </div>
              <div style={{ fontSize: '14px' }}>Losses</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ffa502', fontWeight: 'bold' }}>
                {localStats.streak}
              </div>
              <div style={{ fontSize: '14px' }}>Win Streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#4ecdc4', fontWeight: 'bold' }}>
                {localStats.wins + localStats.losses > 0 
                  ? Math.round((localStats.wins / (localStats.wins + localStats.losses)) * 100)
                  : 0}%
              </div>
              <div style={{ fontSize: '14px' }}>Win Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Global Leaderboard */}
      <div className="leaderboard">
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Global Leaderboard</h3>
        {leaderboard.length > 0 ? (
          leaderboard.map((player, index) => {
            const winRate = (player.wins && player.losses) 
              ? Math.round((player.wins / (player.wins + player.losses)) * 100)
              : 0
            
            return (
              <div 
                key={player.username} 
                className="leaderboard-item"
                style={{
                  background: player.username === userProfile?.username 
                    ? 'rgba(78, 205, 196, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: player.username === userProfile?.username 
                    ? '2px solid #4ecdc4' 
                    : 'none'
                }}
              >
                <div className="rank">#{index + 1}</div>
                <div className="username">
                  {player.username}
                  {player.username === userProfile?.username && ' (You)'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div className="rating">{player.rating}</div>
                  <div style={{ fontSize: '12px', color: '#ffa502' }}>
                    {winRate}% WR
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.7 }}>
            No players found
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => onNavigate('ranked-queue')}
          >
            🏆 Play Ranked
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => onNavigate('ai-game')}
          >
            🤖 Practice vs AI
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onNavigate('menu')}
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard