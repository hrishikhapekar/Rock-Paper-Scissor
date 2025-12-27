import MoveButton from './MoveButton'

const MOVE_EMOJIS = { rock: '🪨', paper: '📄', scissors: '✂️' }

function GameBoard({ moves, onMoveSelect, disabled, selectedMove }) {
  return (
    <div className="move-buttons">
      {moves.map((move) => (
        <MoveButton
          key={move}
          move={move}
          emoji={MOVE_EMOJIS[move]}
          onClick={() => onMoveSelect(move)}
          disabled={disabled}
          selected={selectedMove === move}
        />
      ))}
    </div>
  )
}

export default GameBoard