function ScoreBoard({ player1Name, player1Score, player2Name, player2Score }) {
  return (
    <div className="scoreboard">
      <div className="player-score">
        <div className="player-name">{player1Name}</div>
        <div className="score">{player1Score}</div>
      </div>
      <div className="vs">VS</div>
      <div className="player-score">
        <div className="player-name">{player2Name}</div>
        <div className="score">{player2Score}</div>
      </div>
    </div>
  )
}

export default ScoreBoard