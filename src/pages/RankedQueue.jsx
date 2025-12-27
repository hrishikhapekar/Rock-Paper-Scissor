import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function RankedQueue({ user, onNavigate }) {
  const [selectedRounds, setSelectedRounds] = useState(5)
  const [isQueuing, setIsQueuing] = useState(false)
  const [queueTime, setQueueTime] = useState(0)
  const [userProfile, setUserProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      initializeProfile()
    }
  }, [user])

  useEffect(() => {
    let interval
    if (isQueuing) {
      interval = setInterval(() => {
        setQueueTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isQueuing])

  const initializeProfile = async () => {
    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (!profile) {
        // Create profile with unique username
        const username = await generateUniqueUsername(user.user_metadata?.full_name || 'Player')
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username,
            avatar_url: user.user_metadata?.avatar_url,
            rating: 1200
          })
          .select()
          .single()

        if (insertError) throw insertError
        setUserProfile(newProfile)
      } else {
        setUserProfile(profile)
      }
    } catch (error) {
      setError('Failed to initialize profile: ' + error.message)
    }
  }

  const generateUniqueUsername = async (baseName) => {
    // Clean base name
    let cleanName = baseName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
    if (!cleanName) cleanName = 'Player'

    // Check if base name is available
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', cleanName)

    if (!existing || existing.length === 0) {
      return cleanName
    }

    // Generate unique username with suffix
    let attempts = 0
    while (attempts < 1000) {
      const suffix = Math.floor(Math.random() * 9999) + 1
      const testName = `${cleanName}#${suffix}`
      
      const { data: existingWithSuffix } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', testName)

      if (!existingWithSuffix || existingWithSuffix.length === 0) {
        return testName
      }
      attempts++
    }

    throw new Error('Could not generate unique username')
  }

  const joinQueue = async () => {
    try {
      setIsQueuing(true)
      setQueueTime(0)
      setError('')

      // Add to matchmaking queue
      const { error: queueError } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: user.id,
          rating: userProfile.rating,
          rounds: selectedRounds
        })

      if (queueError) throw queueError

      // Start looking for matches
      findMatch()
    } catch (error) {
      setError('Failed to join queue: ' + error.message)
      setIsQueuing(false)
    }
  }

  const findMatch = async () => {
    const matchInterval = setInterval(async () => {
      try {
        // Look for another player in queue with similar rating and same rounds
        const ratingRange = Math.max(100, queueTime * 10) // Expand range over time
        
        const { data: opponents, error } = await supabase
          .from('matchmaking_queue')
          .select('*')
          .neq('user_id', user.id)
          .eq('rounds', selectedRounds)
          .gte('rating', userProfile.rating - ratingRange)
          .lte('rating', userProfile.rating + ratingRange)
          .order('joined_at', { ascending: true })
          .limit(1)

        if (error) throw error

        if (opponents && opponents.length > 0) {
          const opponent = opponents[0]
          
          // Create room
          const { data: room, error: roomError } = await supabase
            .from('rooms')
            .insert({
              total_rounds: selectedRounds,
              current_round: 1,
              status: 'waiting'
            })
            .select()
            .single()

          if (roomError) throw roomError

          // Add both players to room
          const { error: playersError } = await supabase
            .from('room_players')
            .insert([
              { room_id: room.id, user_id: user.id },
              { room_id: room.id, user_id: opponent.user_id }
            ])

          if (playersError) throw playersError

          // Remove both from queue
          await supabase
            .from('matchmaking_queue')
            .delete()
            .in('user_id', [user.id, opponent.user_id])

          clearInterval(matchInterval)
          setIsQueuing(false)
          
          // Navigate to game
          onNavigate('online-game', { roomId: room.id })
        }
      } catch (error) {
        console.error('Match finding error:', error)
        clearInterval(matchInterval)
        setIsQueuing(false)
        setError('Matchmaking failed: ' + error.message)
      }
    }, 2000) // Check every 2 seconds

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(matchInterval)
      if (isQueuing) {
        leaveQueue()
        setError('Matchmaking timed out. Please try again.')
      }
    }, 300000)
  }

  const leaveQueue = async () => {
    try {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', user.id)
      
      setIsQueuing(false)
      setQueueTime(0)
    } catch (error) {
      setError('Failed to leave queue: ' + error.message)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!userProfile) {
    return (
      <div className="card">
        <div className="loading">Setting up your profile...</div>
        {error && <div className="error">{error}</div>}
      </div>
    )
  }

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Ranked Matchmaking</h2>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          Player: <strong>{userProfile.username}</strong>
        </div>
        <div style={{ fontSize: '16px', color: '#4ecdc4' }}>
          Rating: <strong>{userProfile.rating}</strong>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {!isQueuing ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Select Match Length</h3>
            <div className="round-selection">
              {[3, 5, 8, 10].map(rounds => (
                <button
                  key={rounds}
                  className={`round-btn ${selectedRounds === rounds ? 'selected' : ''}`}
                  onClick={() => setSelectedRounds(rounds)}
                  style={{
                    background: selectedRounds === rounds 
                      ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' 
                      : 'linear-gradient(45deg, #4ecdc4, #44a08d)'
                  }}
                >
                  Best of {rounds}
                </button>
              ))}
            </div>
            <p style={{ marginTop: '15px', fontSize: '14px', opacity: 0.8 }}>
              First to {Math.ceil(selectedRounds / 2)} wins
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={joinQueue}
              style={{ fontSize: '18px', padding: '15px 30px' }}
            >
              🔍 Find Match
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ fontSize: '24px', marginBottom: '20px' }}>
            🔍 Finding opponent...
          </div>
          <div style={{ fontSize: '18px', marginBottom: '20px' }}>
            Queue time: <strong>{formatTime(queueTime)}</strong>
          </div>
          <div style={{ fontSize: '16px', marginBottom: '30px', opacity: 0.8 }}>
            Match type: Best of {selectedRounds}
          </div>
          <button 
            className="btn" 
            onClick={leaveQueue}
            style={{ fontSize: '16px' }}
          >
            Cancel Search
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button className="btn btn-secondary" onClick={() => onNavigate('menu')}>
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}

export default RankedQueue