function MoveButton({ move, emoji, onClick, disabled, selected }) {
  return (
    <button
      className="move-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.5 : 1,
        transform: selected ? 'scale(1.1)' : 'scale(1)',
        borderColor: selected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
        borderWidth: selected ? '4px' : '3px'
      }}
      title={move.charAt(0).toUpperCase() + move.slice(1)}
    >
      {emoji}
    </button>
  )
}

export default MoveButton