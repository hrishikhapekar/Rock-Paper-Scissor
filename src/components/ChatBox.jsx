import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

function ChatBox({ roomId, user, disabled }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const chatSubscription = useRef(null)

  useEffect(() => {
    if (roomId && !disabled) {
      loadMessages()
      setupChatSubscription()
    }
    
    return () => {
      if (chatSubscription.current) {
        chatSubscription.current.unsubscribe()
      }
    }
  }, [roomId, disabled])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const setupChatSubscription = () => {
    chatSubscription.current = supabase
      .channel(`chat:${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          // Get username for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single()

          const messageWithProfile = {
            ...payload.new,
            profiles: profile
          }

          setMessages(prev => [...prev, messageWithProfile])
        }
      )
      .subscribe()
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || loading || disabled) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message: newMessage.trim()
        })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (disabled) {
    return null
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className="chat-message">
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.7, 
              marginBottom: '4px' 
            }}>
              <strong>{message.profiles?.username || 'Unknown'}</strong>
              <span style={{ marginLeft: '8px' }}>
                {formatTime(message.created_at)}
              </span>
            </div>
            <div>{message.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="chat-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          maxLength={200}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !newMessage.trim()}
          style={{ padding: '10px 15px', fontSize: '14px' }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatBox