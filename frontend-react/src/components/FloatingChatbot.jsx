import { useState, useRef, useEffect } from 'react'
import { askAssistant } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import {
  BotIcon,
  SendIcon,
  UserIcon,
  SparklesIcon,
  HelpCircleIcon
} from './Icons'

const QUICK_PROMPTS = [
  "Can you speak in Urdu?",
  "Kachra kaise report karein?",
  "How does AI Scanner work?",
  "شکایت کی اسٹیٹس کا کیا مطلب ہے؟",
  "Which Karachi districts are covered?"
]

export default function FloatingChatbot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello ${user?.full_name || 'Citizen'}! I am your **Karachi WasteWatch AI Guide**.\n\nI can assist you in **English**, **اردو (Urdu)**, or **Roman Urdu** regarding waste reporting, complaint tracking, and our AI scanner across Karachi.`,
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
    if (isOpen) scrollToBottom()
  }, [messages, loading, isOpen])

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true)
    window.addEventListener('open-rag-chat', handleOpenChat)
    return () => window.removeEventListener('open-rag-chat', handleOpenChat)
  }, [])

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
          confidence: res.data.confidence,
          lang: res.data.detected_language,
          engine: res.data.engine
        }
      ])
    } catch {
      setMessages([
        ...newMessages,
        {
          sender: 'assistant',
          text: "I encountered a brief connection issue. Please ensure the backend is running and try again.",
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
    <>
      {/* ── FAB BUTTON ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle WasteWatch AI Assistant"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--gray-900)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)' }}
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        ) : (
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <BotIcon size={24} color="#fff" />
            <span style={{
              position:'absolute', top:-2, right:-2,
              width:10, height:10, borderRadius:'50%',
              background:'#22c55e', border:'2px solid var(--gray-900)'
            }} />
          </div>
        )}
      </button>

      {/* ── CHAT WINDOW ── */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 84,
          right: 24,
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(540px, calc(100vh - 110px))',
          zIndex: 9999,
          background: '#fff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--gray-150)',
          animation: 'chatSlideIn 0.2s var(--ease)'
        }}>

          {/* Header */}
          <div style={{
            padding: '13px 16px',
            background: 'var(--gray-900)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0
          }}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{
                width:32, height:32, borderRadius:'50%',
                background:'rgba(255,255,255,0.08)',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'1px solid rgba(255,255,255,0.1)'
              }}>
                <BotIcon size={17} color="#2dd4bf" />
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:'0.85rem',letterSpacing:'-0.01em'}}>WasteWatch Assistant</div>
                <div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.4)',letterSpacing:'0.02em'}}>
                  English · اردو · Roman Urdu
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background:'rgba(255,255,255,0.07)',
                border:'none', color:'rgba(255,255,255,0.7)',
                width:28, height:28, borderRadius:'50%',
                cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center',
                transition:'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex:1, padding:'14px 14px',
            overflowY:'auto', background:'var(--gray-50)',
            display:'flex', flexDirection:'column', gap:10
          }}>
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user'
              const isUrdu = m.lang === 'ur' || /[\u0600-\u06FF]/.test(m.text)

              return (
                <div key={idx} style={{
                  display:'flex', gap:7,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth:'88%'
                }}>
                  {!isUser && (
                    <div style={{
                      width:26, height:26, borderRadius:'50%',
                      background:'var(--gray-800)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      flexShrink:0, marginTop:3
                    }}>
                      <BotIcon size={14} color="#2dd4bf" />
                    </div>
                  )}
                  <div style={{
                    background: isUser ? 'var(--gray-900)' : '#fff',
                    color: isUser ? '#fff' : 'var(--gray-800)',
                    padding: '9px 12px',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    fontSize: '0.83rem',
                    lineHeight: 1.55,
                    border: isUser ? 'none' : '1px solid var(--gray-150)',
                    whiteSpace: 'pre-wrap',
                    direction: isUrdu && !isUser ? 'rtl' : 'ltr',
                    textAlign: isUrdu && !isUser ? 'right' : 'left'
                  }}>
                    <div>{m.text}</div>
                    {m.sources && m.sources.length > 0 && (
                      <div style={{
                        marginTop:7, paddingTop:6,
                        borderTop:'1px solid var(--gray-100)',
                        display:'flex', flexWrap:'wrap', gap:4,
                        alignItems:'center', direction:'ltr', textAlign:'left'
                      }}>
                        <span style={{fontSize:'0.65rem',color:'var(--gray-400)',fontWeight:600}}>
                          Sources:
                        </span>
                        {m.sources.map((s, sIdx) => (
                          <span key={sIdx} style={{
                            background:'#e0f2fe', color:'#0369a1',
                            padding:'1px 6px', borderRadius:8,
                            fontSize:'0.65rem', fontWeight:600
                          }}>
                            {s.title.split('/')[0]}
                          </span>
                        ))}
                        {m.engine && (
                          <span style={{
                            background: m.engine.includes('Generative') ? '#dcfce7' : 'var(--gray-100)',
                            color: m.engine.includes('Generative') ? '#15803d' : 'var(--gray-600)',
                            padding:'1px 6px', borderRadius:8,
                            fontSize:'0.63rem', fontWeight:700
                          }}>
                            ⚡ {m.engine}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <div style={{
                      width:26, height:26, borderRadius:'50%',
                      background:'var(--gray-700)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      flexShrink:0, marginTop:3
                    }}>
                      <UserIcon size={14} color="#fff" />
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div style={{display:'flex',gap:7,alignSelf:'flex-start',maxWidth:'88%'}}>
                <div style={{
                  width:26, height:26, borderRadius:'50%',
                  background:'var(--gray-800)',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                }}>
                  <BotIcon size={14} color="#2dd4bf" />
                </div>
                <div style={{
                  background:'#fff', padding:'9px 14px',
                  borderRadius:'12px 12px 12px 2px',
                  border:'1px solid var(--gray-150)',
                  fontSize:'0.78rem', color:'var(--gray-400)',
                  display:'flex', alignItems:'center', gap:7
                }}>
                  <span className="spinner" style={{width:13,height:13,margin:0,borderWidth:2}} />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={{
            padding:'8px 12px',
            background:'#fff',
            borderTop:'1px solid var(--gray-100)',
            overflowX:'auto',
            display:'flex', gap:5,
            whiteSpace:'nowrap',
            flexShrink:0
          }}>
            {QUICK_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  background:'var(--gray-50)',
                  border:'1px solid var(--gray-200)',
                  borderRadius:12,
                  padding:'3px 10px',
                  fontSize:'0.7rem',
                  color:'var(--gray-600)',
                  cursor:'pointer',
                  display:'inline-flex', alignItems:'center', gap:4,
                  fontFamily:'inherit',
                  transition:'border-color 0.12s, color 0.12s',
                  whiteSpace:'nowrap'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--teal)'; e.currentTarget.style.color='var(--teal)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color='var(--gray-600)' }}
              >
                <SparklesIcon size={9} color="var(--teal)" /> {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding:'10px 12px',
            background:'#fff',
            borderTop:'1px solid var(--gray-150)',
            display:'flex', gap:8, alignItems:'center',
            flexShrink:0
          }}>
            <input
              className="form-input"
              placeholder="Ask in English, Urdu, or Roman Urdu..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{flex:1, padding:'9px 13px', borderRadius:20, fontSize:'0.82rem'}}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                borderRadius:'50%', width:36, height:36,
                padding:0, display:'flex',
                alignItems:'center', justifyContent:'center', flexShrink:0
              }}
            >
              <SendIcon size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
