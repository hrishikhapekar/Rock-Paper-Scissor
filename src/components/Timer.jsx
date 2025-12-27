import { useEffect } from 'react'

function Timer({ timeLeft, isActive, onTimeout, onTick }) {
  useEffect(() => {
    let interval = null
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        onTick(prev => {
          const newTime = prev - 1
          if (newTime <= 0) {
            onTimeout()
            return 0
          }
          return newTime
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, onTimeout, onTick])

  return (
    <div className={`timer ${timeLeft <= 5 ? 'warning' : ''}`}>
      {timeLeft}
    </div>
  )
}

export default Timer