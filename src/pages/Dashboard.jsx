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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setUserProfile(profile)

      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('profiles')
        .select('username, rating, wins, losses')
        .order('rating', { ascending: false })
        .limit(10)

      if (leaderboardError) throw leaderboardError
      setLeaderboard(leaderboardData)

    } catch (err) {
      setError('Failed to load dashboard: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadLocalStats = () => {
    const stats = JSON.parse(
      localStorage.getItem('aiGameStats') ||
      '{"wins":0,"losses":0,"streak":0}'
    )
    setLocalStats(stats)
  }

  const getUserRank = () => {
    if (!userProfile || !leaderboard.length) return null
    const rank =
      leaderboard.findIndex(
        p => p.username === userProfile.username
      ) + 1
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
        <div style={{ textAlign: 'center', marginTop: 20 }}>
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

  const userRank = getUserRank()

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>
        Dashboard
      </h2>

      {userProfile && (
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: 20,
              borderRadius: 10
            }}
          >
            <h3>Your Profile</h3>
            <strong>{userProfile.username}</strong>
            <div style={{ color: '#4ecdc4' }}>
              Rating: <strong>{userProfile.rating}</strong>
            </div>
            {userRank && (
              <div style={{ color: '#ffa502' }}>
                Global Rank: <strong>#{userRank}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {localStats && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ textAlign: 'center' }}>AI Practice Stats</h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              background: 'rgba(255,255,255,0.1)',
              padding: 20,
              borderRadius: 10
            }}
          >
            <Stat label="Wins" value={localStats.wins} color="#2ed573" />
            <Stat label="Losses" value={localStats.losses} color="#ff4757" />
            <Stat label="Streak" value={localStats.streak} color="#ffa502" />
            <Stat
              label="Win Rate"
              value={
                localStats.wins + localStats.losses > 0
                  ? Math.round(
                      (localStats.wins /
                        (localStats.wins + localStats.losses)) *
                        100
                    ) + '%'
                  : '0%'
              }
              color="#4ecdc4"
            />
          </div>
        </div>
      )}

      <div className="leaderboard">
        <h3 style={{ textAlign: 'center', marginBottom: 20 }}>
          Global Leaderboard
        </h3>

        {leaderboard.length > 0 ? (
          leaderboard.map((player, index) => {
            const winRate =
              player.wins + player.losses > 0
                ? Math.round(
                    (player.wins /
                      (player.wins + player.losses)) *
                      100
                  )
                : 0

            return (
              <div
                key={player.username}
                className="leaderboard-item"
                style={{
                  background:
                    player.username === userProfile?.username
                      ? 'rgba(78,205,196,0.2)'
                      : 'rgba(255,255,255,0.1)',
                  border:
                    player.username === userProfile?.username
                      ? '2px solid #4ecdc4'
                      : 'none'
                }}
              >
                <div className="rank">#{index + 1}</div>
                <div className="username">
                  {player.username}
                  {player.username === userProfile?.username && ' (You)'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="rating">{player.rating}</div>
                  <div style={{ fontSize: 12, color: '#ffa502' }}>
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

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <button className="btn btn-primary" onClick={() => onNavigate('ranked-queue')}>
          🏆 Play Ranked
        </button>
        <button className="btn btn-primary" onClick={() => onNavigate('ai-game')}>
          🤖 Practice vs AI
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('menu')}>
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', color }}>
        {value}
      </div>
      <div style={{ fontSize: 14 }}>{label}</div>
    </div>
  )
}

export default Dashboard
