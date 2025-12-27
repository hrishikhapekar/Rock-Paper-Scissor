import { useState, useEffect } from 'react'
import GameBoard from '../components/GameBoard'
import ScoreBoard from '../components/ScoreBoard'
import Timer from '../components/Timer'
import MatchStatus from '../components/MatchStatus'

const MOVES = ['rock', 'paper', 'scissors']
const MOVE_EMOJIS = { rock: '🪨', paper: '📄', scissors: '✂️' }

// Adaptive AI class
class AdaptiveAI {
  constructor() {
    this.playerHistory = []
    this.patterns = new Map()
    this.randomness = 0.15 // 15% randomness
  }

  addPlayerMove(move) {
    this.playerHistory.push(move)
    this.updatePatterns()
  }

  updatePatterns() {
    // Track 2-move and 3-move patterns
    const history = this.playerHistory
    if (history.length >= 2) {
      const pattern2 = history.slice(-2).join('')
      this.patterns.set(pattern2, (this.patterns.get(pattern2) || 0) + 1)
    }
    if (history.length >= 3) {
      const pattern3 = history.slice(-3).join('')
      this.patterns.set(pattern3, (this.patterns.get(pattern3) || 0) + 1)
    }
  }

  predictNextMove() {
    if (this.playerHistory.length < 2 || Math.random() < this.randomness) {
      return MOVES[Math.floor(Math.random() * 3)]
    }

    // Try to predict based on patterns
    let predictedMove = null
    
    // Check 3-move pattern first
    if (this.playerHistory.length >= 3) {
      const recent3 = this.playerHistory.slice(-3).join('')
      let bestNext = null
      let maxCount = 0
      
      for (const [pattern, count] of this.patterns.entries()) {
        if (pattern.startsWith(recent3.slice(1)) && pattern.length === 3 && count > maxCount) {
          maxCount = count
          bestNext = pattern[2]
        }
      }
      if (bestNext) predictedMove = bestNext
    }
    
    // Fallback to 2-move pattern
    if (!predictedMove && this.playerHistory.length >= 2) {
      const recent2 = this.playerHistory.slice(-2).join('')
      let bestNext = null
      let maxCount = 0
      
      for (const [pattern, count] of this.patterns.entries()) {
        if (pattern.startsWith(recent2.slice(1)) && pattern.length === 2 && count > maxCount) {
          maxCount = count
          bestNext = pattern[1]
        }
      }
      if (bestNext) predictedMove = bestNext
    }

    // Counter the predicted move
    if (predictedMove) {
      const counters = { rock: 'paper', paper: 'scissors', scissors: 'rock' }
      return counters[predictedMove]
    }

    return MOVES[Math.floor(Math.random() * 3)]
  }
}

function AiGame({ onNavigate }) {
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds] = useState(5)
  const [gameState, setGameState] = useState('playing') // playing, finished
  const [playerMove, setPlayerMove] = useState(null)
  const [aiMove, setAiMove] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const [shuffledMoves, setShuffledMoves] = useState([...MOVES])
  const [ai] = useState(new AdaptiveAI())
  const [showResult, setShowResult] = useState(false)

  // Load local stats
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('aiGameStats') || '{"wins": 0, "losses": 0, "streak": 0}')
    // Stats loaded but not displayed in this component
  }, [])

  // Shuffle moves at start and after each round
  useEffect(() => {
    shuffleMoves()
  }, [currentRound])

  const shuffleMoves = () => {
    const shuffled = [...MOVES].sort(() => Math.random() - 0.5)
    setShuffledMoves(shuffled)
  }

  const handlePlayerMove = (move) => {
    if (playerMove || gameState !== 'playing') return
    
    setPlayerMove(move)
    setIsTimerActive(false)
    
    // AI makes its move
    const aiChoice = ai.predictNextMove()
    setAiMove(aiChoice)
    
    // Add player move to AI history
    ai.addPlayerMove(move)
    
    // Determine winner
    const result = determineWinner(move, aiChoice)
    setRoundResult(result)
    setShowResult(true)
    
    // Update scores
    if (result === 'win') {
      setPlayerScore(prev => prev + 1)
    } else if (result === 'lose') {
      setAiScore(prev => prev + 1)
    }
    
    // Check if game is finished
    setTimeout(() => {
      const newPlayerScore = result === 'win' ? playerScore + 1 : playerScore
      const newAiScore = result === 'lose' ? aiScore + 1 : aiScore
      
      if (newPlayerScore > totalRounds / 2 || newAiScore > totalRounds / 2 || currentRound >= totalRounds) {
        finishGame(newPlayerScore, newAiScore)
      } else {
        nextRound()
      }
    }, 3000)
  }

  const determineWinner = (playerMove, aiMove) => {
    if (playerMove === aiMove) return 'tie'
    
    const winConditions = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    }
    
    return winConditions[playerMove] === aiMove ? 'win' : 'lose'
  }

  const nextRound = () => {
    setCurrentRound(prev => prev + 1)
    setPlayerMove(null)
    setAiMove(null)
    setRoundResult(null)
    setShowResult(false)
    setTimeLeft(15)
    setIsTimerActive(true)
  }

  const finishGame = (finalPlayerScore, finalAiScore) => {
    setGameState('finished')
    
    // Update local stats
    const stats = JSON.parse(localStorage.getItem('aiGameStats') || '{"wins": 0, "losses": 0, "streak": 0}')
    
    if (finalPlayerScore > finalAiScore) {
      stats.wins++
      stats.streak++
    } else if (finalAiScore > finalPlayerScore) {
      stats.losses++
      stats.streak = 0
    } else {
      stats.streak = 0
    }
    
    localStorage.setItem('aiGameStats', JSON.stringify(stats))
  }

  const handleTimeout = () => {
    if (!playerMove && gameState === 'playing') {
      // Auto-play first move in shuffled list
      handlePlayerMove(shuffledMoves[0])
    }
  }

  const playAgain = () => {
    setPlayerScore(0)
    setAiScore(0)
    setCurrentRound(1)
    setGameState('playing')
    setPlayerMove(null)
    setAiMove(null)
    setRoundResult(null)
    setShowResult(false)
    setTimeLeft(15)
    setIsTimerActive(true)
    shuffleMoves()
  }

  if (gameState === 'finished') {
    const gameResult = playerScore > aiScore ? 'win' : aiScore > playerScore ? 'lose' : 'tie'
    
    return (
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Game Finished!</h2>
        
        <ScoreBoard 
          player1Name="You"
          player1Score={playerScore}
          player2Name="AI"
          player2Score={aiScore}
        />
        
        <div className="game-result">
          <div className={`result-text ${gameResult}`}>
            {gameResult === 'win' && '🎉 You Won!'}
            {gameResult === 'lose' && '🤖 AI Won!'}
            {gameResult === 'tie' && '🤝 It\'s a Tie!'}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={playAgain}>
            Play Again
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('menu')}>
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Practice vs AI</h2>
      
      <ScoreBoard 
        player1Name="You"
        player1Score={playerScore}
        player2Name="AI"
        player2Score={aiScore}
      />
      
      <MatchStatus 
        currentRound={currentRound}
        totalRounds={totalRounds}
        status={showResult ? 'showing-result' : 'playing'}
      />
      
      {!showResult && (
        <Timer 
          timeLeft={timeLeft}
          isActive={isTimerActive}
          onTimeout={handleTimeout}
          onTick={setTimeLeft}
        />
      )}
      
      {showResult && (
        <div className="game-result">
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div>You</div>
              <div style={{ fontSize: '48px' }}>{MOVE_EMOJIS[playerMove]}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div>AI</div>
              <div style={{ fontSize: '48px' }}>{MOVE_EMOJIS[aiMove]}</div>
            </div>
          </div>
          <div className={`result-text ${roundResult}`}>
            {roundResult === 'win' && 'You Win This Round!'}
            {roundResult === 'lose' && 'AI Wins This Round!'}
            {roundResult === 'tie' && 'Round Tied!'}
          </div>
        </div>
      )}
      
      <GameBoard 
        moves={shuffledMoves}
        onMoveSelect={handlePlayerMove}
        disabled={!!playerMove || showResult}
        selectedMove={playerMove}
      />
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className="btn btn-secondary" onClick={() => onNavigate('menu')}>
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}

export default AiGame