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
      text: `Hello ${user?.full_name || 'Citizen'}! I am your **Karachi WasteWatch AI Guide**. Ask me anything about reporting waste, tracking complaint statuses, our YOLO AI scanner, or civic services across Karachi.`,
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
          text: "I'm sorry, I encountered a temporary connection issue. Please make sure the backend is active or try asking your question again.",
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
    <div style={{maxWidth: 900, margin: '0 auto'}}>
      <div className="page-header">
        <h1 style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <BotIcon size={28} color="var(--teal)" /> Citizen Assistant (RAG Chatbot)
        </h1>
        <p>Ask questions about app features, reporting steps, AI detections, and complaint tracking</p>
      </div>

      <div className="card" style={{display: 'flex', flexDirection: 'column', height: '68vh', minHeight: 520, padding: 0, overflow: 'hidden'}}>
        {/* CHAT HEADER */}
        <div style={{padding: '16px 20px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: '50%', display: 'flex'}}>
              <SparklesIcon size={20} color="#fff" />
            </div>
            <div>
              <div style={{fontWeight: 700, fontSize: '0.98rem'}}>Civic Knowledge Guide</div>
              <div style={{fontSize: '0.75rem', opacity: 0.85}}>Powered by Retrieval-Augmented Generation</div>
            </div>
          </div>
          <div className="id-pill" style={{background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.72rem'}}>
            Online • Ready to Guide
          </div>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div style={{flex: 1, padding: 20, overflowY: 'auto', background: 'var(--gray-50)', display: 'flex', flexDirection: 'column', gap: 16}}>
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                gap: 12,
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {m.sender === 'assistant' && (
                <div style={{background: 'var(--teal)', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4}}>
                  <BotIcon size={18} color="#fff" />
                </div>
              )}

              <div style={{
                background: m.sender === 'user' ? 'var(--teal)' : '#fff',
                color: m.sender === 'user' ? '#fff' : 'var(--gray-800)',
                padding: '12px 16px',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                border: m.sender === 'assistant' ? '1px solid var(--gray-200)' : 'none',
                whiteSpace: 'pre-wrap'
              }}>
                <div>{m.text}</div>

                {m.sources && m.sources.length > 0 && (
                  <div style={{marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--gray-100)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center'}}>
                    <span style={{fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 600}}>
                      <HelpCircleIcon size={12} color="var(--gray-400)" /> Grounded In:
                    </span>
                    {m.sources.map((s, sIdx) => (
                      <span key={sIdx} style={{background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600}}>
                        {s.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div style={{background: 'var(--gray-800)', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4}}>
                  <UserIcon size={18} color="#fff" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{display: 'flex', gap: 12, alignSelf: 'flex-start', maxWidth: '85%'}}>
              <div style={{background: 'var(--teal)', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <BotIcon size={18} color="#fff" />
              </div>
              <div style={{background: '#fff', padding: '12px 18px', borderRadius: '14px 14px 14px 2px', border: '1px solid var(--gray-200)', color: 'var(--gray-400)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8}}>
                <span className="spinner" style={{width: 16, height: 16, margin: 0, borderWidth: 2}} />
                Retrieving knowledge & drafting answer...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTIONS */}
        <div style={{padding: '10px 16px', background: '#fff', borderTop: '1px solid var(--gray-200)', overflowX: 'auto', display: 'flex', gap: 8, whiteSpace: 'nowrap'}}>
          {QUICK_PROMPTS.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                background: 'var(--gray-100)',
                border: '1px solid var(--gray-200)',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-600)' }}
            >
              <SparklesIcon size={12} color="var(--teal)" /> {prompt}
            </button>
          ))}
        </div>

        {/* CHAT INPUT FORM */}
        <div style={{padding: '12px 16px', background: '#fff', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: 10, alignItems: 'center'}}>
          <input
            className="form-input"
            placeholder="Type your question about Karachi WasteWatch AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{flex: 1, padding: '12px 16px', borderRadius: 24}}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{borderRadius: 24, padding: '12px 20px', display: 'flex', gap: 6, alignItems: 'center'}}
          >
            <SendIcon size={16} /> Send
          </button>
        </div>
      </div>
    </div>
  )
}
