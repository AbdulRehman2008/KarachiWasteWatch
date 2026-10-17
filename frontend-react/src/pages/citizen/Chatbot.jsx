import { useState, useRef, useEffect } from 'react'
import { askAssistant } from '../../api/api'
import { useAuth } from '../../contexts/AuthContext'
import { 
  BotIcon, 
  SendIcon, 
  UserIcon, 
  SparklesIcon, 
  HelpCircleIcon 
} from '../../components/Icons'

const QUICK_PROMPTS = [
  "How do I report garbage?",
  "What does 'In Progress' status mean?",
  "How does the AI Waste Scanner work?",
  "Which Karachi districts are covered?",
  "How does cleanup verification work?",
  "Where can I find my Citizen ID?"
]

export default function CitizenChatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello ${user?.full_name || 'Citizen'}! I am your **Karachi WasteWatch Guide**.\n\nAsk me anything regarding waste reporting, complaint tracking, our AI detection system, or municipal services across Karachi.`,
      sources: []
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim()
    if (!q || loading) return

    const newMessages = [...messages, { sender: 'user', text: q }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await askAssistant(q)
      setMessages([
        ...newMessages,
        {
          sender: 'assistant',
          text: res.data.answer,
          sources: res.data.sources || [],
          confidence: res.data.confidence
        }
      ])
    } catch {
      setMessages([
        ...newMessages,
        {
          sender: 'assistant',
          text: "I encountered a connection issue while contacting the assistant service. Please verify the backend is running and try again.",
          sources: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{maxWidth: 880, margin: '0 auto'}}>
      <div className="page-header">
        <h1>
          <BotIcon size={24} color="var(--teal)" /> Civic Assistant &amp; Knowledge Guide
        </h1>
        <p>Verified information about municipal procedures, complaint lifecycles, and reporting steps</p>
      </div>

      <div className="card" style={{display: 'flex', flexDirection: 'column', height: '68vh', minHeight: 520, padding: 0, overflow: 'hidden'}}>
        {/* CHAT HEADER */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--gray-900)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BotIcon size={16} color="#2dd4bf" />
            </div>
            <div>
              <div style={{fontWeight: 700, fontSize: '0.88rem'}}>Civic Knowledge Assistant</div>
              <div style={{fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)'}}>English &bull; Urdu &bull; Roman Urdu</div>
            </div>
          </div>
          <span className="badge badge-resolved" style={{fontSize: '0.7rem'}}>
            Online
          </span>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div style={{flex: 1, padding: 18, overflowY: 'auto', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: 12}}>
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                gap: 10,
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {m.sender === 'assistant' && (
                <div style={{
                  background: 'var(--gray-800)',
                  color: '#2dd4bf',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 3
                }}>
                  <BotIcon size={15} color="#2dd4bf" />
                </div>
              )}

              <div style={{
                background: m.sender === 'user' ? 'var(--gray-900)' : '#fff',
                color: m.sender === 'user' ? '#fff' : 'var(--gray-800)',
                padding: '10px 14px',
                borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                fontSize: '0.85rem',
                lineHeight: 1.55,
                border: m.sender === 'assistant' ? '1px solid var(--gray-200)' : 'none',
                whiteSpace: 'pre-wrap'
              }}>
                <div>{m.text}</div>

                {m.sources && m.sources.length > 0 && (
                  <div style={{marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--gray-100)', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center'}}>
                    <span style={{fontSize: '0.68rem', color: 'var(--gray-400)', fontWeight: 600}}>
                      Grounded:
                    </span>
                    {m.sources.map((s, sIdx) => (
                      <span key={sIdx} style={{background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600}}>
                        {s.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div style={{
                  background: 'var(--gray-700)',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 3
                }}>
                  <UserIcon size={15} color="#fff" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{display: 'flex', gap: 10, alignSelf: 'flex-start', maxWidth: '85%'}}>
              <div style={{
                background: 'var(--gray-800)',
                color: '#2dd4bf',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <BotIcon size={15} color="#2dd4bf" />
              </div>
              <div style={{
                background: '#fff',
                padding: '10px 14px',
                borderRadius: '12px 12px 12px 2px',
                border: '1px solid var(--gray-200)',
                color: 'var(--gray-400)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span className="spinner" style={{width: 14, height: 14, margin: 0, borderWidth: 2}} />
                Checking knowledge base...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTIONS */}
        <div style={{
          padding: '8px 14px',
          background: '#fff',
          borderTop: '1px solid var(--gray-150)',
          overflowX: 'auto',
          display: 'flex',
          gap: 6,
          whiteSpace: 'nowrap'
        }}>
          {QUICK_PROMPTS.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                borderRadius: 14,
                padding: '3px 10px',
                fontSize: '0.72rem',
                color: 'var(--gray-600)',
                cursor: 'pointer',
                transition: 'border-color var(--duration), color var(--duration)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-600)' }}
            >
              <SparklesIcon size={10} color="var(--teal)" /> {prompt}
            </button>
          ))}
        </div>

        {/* CHAT INPUT FORM */}
        <div style={{padding: '10px 14px', background: '#fff', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: 8, alignItems: 'center'}}>
          <input
            className="form-input"
            placeholder="Ask a question in English, Urdu, or Roman Urdu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{flex: 1, padding: '9px 14px', borderRadius: 20, fontSize: '0.85rem'}}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{borderRadius: 20, padding: '9px 16px', display: 'flex', gap: 6, alignItems: 'center'}}
          >
            <SendIcon size={15} /> Send
          </button>
        </div>
      </div>
    </div>
  )
}
