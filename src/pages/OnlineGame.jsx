import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import GameBoard from '../components/GameBoard'
import ScoreBoard from '../components/ScoreBoard'
import Timer from '../components/Timer'
import ChatBox from '../components/ChatBox'
import MatchStatus from '../components/MatchStatus'

const MOVES = ['rock', 'paper', 'scissors']
const MOVE_EMOJIS = { rock: '🪨', paper: '📄', scissors: '✂️' }

function OnlineGame({ user, gameData, onNavigate }) {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [myPlayer, setMyPlayer] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [gameState, setGameState] = useState('waiting') // waiting, playing, buffer, finished
  const [timeLeft, setTimeLeft] = useState(15)
  const [bufferTime, setBufferTime] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [shuffledMoves, setShuffledMoves] = useState([...MOVES])
  const [myMove, setMyMove] = useState(null)
  const [opponentMove, setOpponentMove] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState('')
  const [rematchVoting, setRematchVoting] = useState(null)
  const [votingTimeLeft, setVotingTimeLeft] = useState(0)
  
  const roomSubscription = useRef(null)
  const playersSubscription = useRef(null)
  const chatSubscription = useRef(null)

  useEffect(() => {
    if (gameData?.roomId) {
      initializeGame()
    }
    
    return () => {
      cleanup()
    }
  }, [gameData])

  useEffect(() => {
    if (room && room.current_round) {
      shuffleMoves()
    }
  }, [room?.current_round])

  const cleanup = () => {
    if (roomSubscription.current) {
      roomSubscription.current.unsubscribe()
    }
    if (playersSubscription.current) {
      playersSubscription.current.unsubscribe()
    }
    if (chatSubscription.current) {
      chatSubscription.current.unsubscribe()
    }
  }

  const initializeGame = async () => {
    try {
      // Get room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', gameData.roomId)
        .single()

      if (roomError) throw roomError
      setRoom(roomData)

      // Get players
      const { data: playersData, error: playersError } = await supabase
        .from('room_players')
        .select(`
          *,
          profiles:user_id (username, rating)
        `)
        .eq('room_id', gameData.roomId)

      if (playersError) throw playersError
      setPlayers(playersData)

      const me = playersData.find(p => p.user_id === user.id)
      const opp = playersData.find(p => p.user_id !== user.id)
      setMyPlayer(me)
      setOpponent(opp)

      // Set up real-time subscriptions
      setupSubscriptions()

      // Start game if both players present
      if (playersData.length === 2 && roomData.status === 'waiting') {
        await startRound()
      }
    } catch (error) {
      setError('Failed to initialize game: ' + error.message)
    }
  }

  const setupSubscriptions = () => {
    // Room updates
    roomSubscription.current = supabase
      .channel(`room:${gameData.roomId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${gameData.roomId}` },
        (payload) => {
          setRoom(payload.new)
        }
      )
      .subscribe()

    // Player updates
    playersSubscription.current = supabase
      .channel(`players:${gameData.roomId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${gameData.roomId}` },
        async () => {
          // Refresh players data
          const { data: playersData } = await supabase
            .from('room_players')
            .select(`
              *,
              profiles:user_id (username, rating)
            `)
            .eq('room_id', gameData.roomId)

          if (playersData) {
            setPlayers(playersData)
            const me = playersData.find(p => p.user_id === user.id)
            const opp = playersData.find(p => p.user_id !== user.id)
            setMyPlayer(me)
            setOpponent(opp)
            
            // Check if round should resolve
            checkRoundResolution(playersData)
          }
        }
      )
      .subscribe()
  }

  const startRound = async () => {
    try {
      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', gameData.roomId)

      // Clear previous moves
      await supabase
        .from('room_players')
        .update({ move: null })
        .eq('room_id', gameData.roomId)

      // Reset all game state
      setGameState('playing')
      setTimeLeft(15)
      setIsTimerActive(true)
      setMyMove(null)
      setOpponentMove(null)
      setRoundResult(null)
      setShowResult(false)
      setBufferTime(0)
      
      console.log('Round started:', room?.current_round)
    } catch (error) {
      setError('Failed to start round: ' + error.message)
    }
  }

  const shuffleMoves = () => {
    const shuffled = [...MOVES].sort(() => Math.random() - 0.5)
    setShuffledMoves(shuffled)
  }

  const handlePlayerMove = async (move) => {
    if (myMove || gameState !== 'playing') return

    try {
      setMyMove(move)
      setGameState('buffer')
      setBufferTime(3)
      setIsTimerActive(false)

      // Submit move to database
      await supabase
        .from('room_players')
        .update({ move })
        .eq('room_id', gameData.roomId)
        .eq('user_id', user.id)

      // Start buffer countdown
      const bufferInterval = setInterval(() => {
        setBufferTime(prev => {
          if (prev <= 1) {
            clearInterval(bufferInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Buffer timeout
      setTimeout(async () => {
        clearInterval(bufferInterval)
        setBufferTime(0)
        // Force check resolution after buffer ends
        setTimeout(async () => {
          const { data: updatedPlayers } = await supabase
            .from('room_players')
            .select(`
              *,
              profiles:user_id (username, rating)
            `)
            .eq('room_id', gameData.roomId)
          
          if (updatedPlayers) {
            checkRoundResolution(updatedPlayers)
          }
        }, 500)
      }, 3000)
    } catch (error) {
      setError('Failed to submit move: ' + error.message)
      setGameState('playing')
      setIsTimerActive(true)
      setMyMove(null)
    }
  }

  const handleTimeout = async () => {
    if (!myMove && gameState === 'playing') {
      // Auto-play first move in shuffled list
      await handlePlayerMove(shuffledMoves[0])
    }
  }

  const checkRoundResolution = (playersData) => {
    const me = playersData.find(p => p.user_id === user.id)
    const opp = playersData.find(p => p.user_id !== user.id)

    console.log('Checking resolution:', { me: me?.move, opp: opp?.move, bufferTime })

    if (me?.move && opp?.move && bufferTime === 0 && gameState !== 'showing-result') {
      console.log('Resolving round with moves:', me.move, opp.move)
      resolveRound(me.move, opp.move)
    }
  }

  const resolveRound = async (myMove, oppMove) => {
    try {
      if (!room) {
        console.error('Room is null, cannot resolve round')
        return
      }
      
      setOpponentMove(oppMove)
      const result = determineWinner(myMove, oppMove)
      setRoundResult(result)
      setShowResult(true)
      setGameState('showing-result')

      // Update scores based on round result
      let newMyScore = myScore
      let newOppScore = oppScore
      
      if (result === 'win') {
        newMyScore = myScore + 1
        setMyScore(newMyScore)
      } else if (result === 'lose') {
        newOppScore = oppScore + 1
        setOppScore(newOppScore)
      }

      const winThreshold = Math.ceil(room.total_rounds / 2)
      console.log('Scores:', { newMyScore, newOppScore, winThreshold, currentRound: room.current_round })

      // Check if game is finished
      if (newMyScore >= winThreshold || newOppScore >= winThreshold) {
        setTimeout(() => finishGame(newMyScore >= winThreshold), 3000)
      } else if (room.current_round >= room.total_rounds) {
        // All rounds played, determine winner by score
        setTimeout(() => finishGame(newMyScore > newOppScore), 3000)
      } else {
        setTimeout(() => nextRound(), 3000)
      }
    } catch (error) {
      console.error('Failed to resolve round:', error)
      setError('Failed to resolve round: ' + error.message)
    }
  }

  const determineWinner = (move1, move2) => {
    if (move1 === move2) return 'tie'
    
    const winConditions = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    }
    
    return winConditions[move1] === move2 ? 'win' : 'lose'
  }

  const nextRound = async () => {
    try {
      if (!room) {
        console.error('Room is null, cannot start next round')
        return
      }
      
      await supabase
        .from('rooms')
        .update({ current_round: room.current_round + 1 })
        .eq('id', gameData.roomId)

      await startRound()
    } catch (error) {
      setError('Failed to start next round: ' + error.message)
    }
  }

  const finishGame = async (didWin) => {
    try {
      await supabase
        .from('rooms')
        .update({ status: 'finished' })
        .eq('id', gameData.roomId)

      setGameState('finished')

      // Update ratings using ELO system
      await updateRatings(didWin)

      // Start rematch voting
      startRematchVoting()
    } catch (error) {
      setError('Failed to finish game: ' + error.message)
    }
  }

  const updateRatings = async (didWin) => {
    try {
      const K = 32 // ELO K-factor
      const myRating = myPlayer.profiles.rating
      const oppRating = opponent.profiles.rating

      const expectedScore = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400))
      const actualScore = didWin ? 1 : 0
      const newRating = Math.round(myRating + K * (actualScore - expectedScore))

      await supabase
        .from('profiles')
        .update({ rating: newRating })
        .eq('id', user.id)
    } catch (error) {
      console.error('Failed to update rating:', error)
    }
  }

  const startRematchVoting = () => {
    setRematchVoting({ myVote: null, oppVote: null })
    setVotingTimeLeft(10)

    const votingInterval = setInterval(() => {
      setVotingTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(votingInterval)
          setRematchVoting(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const voteRematch = async (vote) => {
    try {
      setRematchVoting(prev => ({ ...prev, myVote: vote }))
      
      // In a real implementation, you'd store votes in the database
      // For now, we'll simulate opponent voting
      setTimeout(() => {
        const oppVote = Math.random() > 0.5 // 50% chance opponent accepts
        setRematchVoting(prev => ({ ...prev, oppVote }))
        
        if (vote && oppVote) {
          // Both accepted - start new game
          setTimeout(() => resetForRematch(), 1000)
        } else {
          // Someone declined - end voting
          setTimeout(() => setRematchVoting(null), 2000)
        }
      }, 1000)
    } catch (error) {
      setError('Failed to vote: ' + error.message)
    }
  }

  const resetForRematch = async () => {
    try {
      await supabase
        .from('rooms')
        .update({ 
          current_round: 1, 
          status: 'waiting',
          rematch_count: (room.rematch_count || 0) + 1
        })
        .eq('id', gameData.roomId)

      setRematchVoting(null)
      await startRound()
    } catch (error) {
      setError('Failed to start rematch: ' + error.message)
    }
  }

  if (!room || !myPlayer || !opponent) {
    return (
      <div className="card">
        <div className="loading">Loading game...</div>
        {error && <div className="error">{error}</div>}
      </div>
    )
  }

  const [myScore, setMyScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Ranked Match</h2>
      
      {error && <div className="error">{error}</div>}
      
      <ScoreBoard 
        player1Name={myPlayer.profiles.username}
        player1Score={myScore}
        player2Name={opponent.profiles.username}
        player2Score={oppScore}
      />
      
      <MatchStatus 
        currentRound={room.current_round}
        totalRounds={room.total_rounds}
        status={gameState}
      />
      
      {gameState === 'playing' && (
        <Timer 
          timeLeft={timeLeft}
          isActive={isTimerActive}
          onTimeout={handleTimeout}
          onTick={setTimeLeft}
        />
      )}
      
      {gameState === 'buffer' && bufferTime > 0 && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            Move submitted! Waiting for confirmation...
          </div>
          <div style={{ fontSize: '24px', color: '#ffa502' }}>
            Buffer: {bufferTime}s
          </div>
        </div>
      )}
      
      {showResult && (
        <div className="game-result">
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div>{myPlayer.profiles.username}</div>
              <div style={{ fontSize: '48px' }}>{MOVE_EMOJIS[myMove]}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div>{opponent.profiles.username}</div>
              <div style={{ fontSize: '48px' }}>{MOVE_EMOJIS[opponentMove]}</div>
            </div>
          </div>
          <div className={`result-text ${roundResult}`}>
            {roundResult === 'win' && 'You Win This Round!'}
            {roundResult === 'lose' && 'Opponent Wins This Round!'}
            {roundResult === 'tie' && 'Round Tied!'}
          </div>
        </div>
      )}
      
      {gameState === 'finished' && rematchVoting && (
        <div className="rematch-voting">
          <h3>Match Finished!</h3>
          <div className="voting-timer">
            Rematch voting: {votingTimeLeft}s
          </div>
          {rematchVoting.myVote === null ? (
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px' }}>
              <button className="btn btn-primary" onClick={() => voteRematch(true)}>
                ✓ Rematch
              </button>
              <button className="btn" onClick={() => voteRematch(false)}>
                ✗ Exit
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <div>Your vote: {rematchVoting.myVote ? 'Accept' : 'Decline'}</div>
              <div>Waiting for opponent...</div>
            </div>
          )}
        </div>
      )}
      
      <GameBoard 
        moves={shuffledMoves}
        onMoveSelect={handlePlayerMove}
        disabled={!!myMove || showResult || gameState === 'buffer'}
        selectedMove={myMove}
      />
      
      <ChatBox 
        roomId={gameData.roomId}
        user={user}
        disabled={gameState === 'finished' && !rematchVoting}
      />
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className="btn btn-secondary" onClick={() => onNavigate('menu')}>
          ← Exit Game
        </button>
      </div>
    </div>
  )
}

export default OnlineGame