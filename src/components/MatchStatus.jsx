function MatchStatus({ currentRound, totalRounds, status }) {
  const getStatusMessage = () => {
    switch (status) {
      case 'waiting':
        return 'Waiting for opponent...'
      case 'playing':
        return 'Make your move!'
      case 'buffer':
        return 'Move submitted, waiting for confirmation...'
      case 'showing-result':
        return 'Round complete!'
      case 'finished':
        return 'Match finished!'
      default:
        return ''
    }
  }

  return (
    <div className="match-status">
      <div className="round-info">
        Round {currentRound} of {totalRounds}
      </div>
      <div className="waiting-message">
        {getStatusMessage()}
      </div>
    </div>
  )
}

export default MatchStatus