import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, User, Bot, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useGuruStore } from '@/stores/guruStore'
import { startGuruSession, processGuruResponse } from '@/api/guru'

export function Guru() {
  const { 
    sessionId, assetId, expertName, currentQuestion, messages, 
    status, isLoading, currentScore, initialScore, 
    startSession, addMessage, setCurrentQuestion, updateScore, setLoading, endSession 
  } = useGuruStore()

  const [input, setInput] = useState('')
  const [assetInput, setAssetInput] = useState('T-101')
  const [expertInput, setExpertInput] = useState('Rahul')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentQuestion])

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetInput.trim() || !expertInput.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await startGuruSession({ asset_id: assetInput, expert_name: expertInput })
      startSession(res.session_id, assetInput, expertInput, res.first_question, res.current_debt_score)
    } catch (err: any) {
      setError(err.message || 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !sessionId || isLoading) return
    const text = input.trim()
    setInput('')
    setError(null)
    addMessage('expert', text)
    setLoading(true)

    try {
      const res = await processGuruResponse(sessionId, text)
      updateScore(res.new_debt_score)
      if (res.session_status === 'completed') {
        endSession()
        addMessage('interviewer', "Thank you! The session is complete. The knowledge debt has been updated.")
      } else if (res.next_question) {
        addMessage('interviewer', res.next_question)
        setCurrentQuestion(res.next_question)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process response')
      setInput(text) // Restore input on error
    } finally {
      setLoading(false)
    }
  }

  const scoreImprovement = initialScore - currentScore

  if (status === 'idle') {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.32,0.72,0,1] }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Guru Mode</h1>
          <p className="text-textSecondary mb-12 text-lg">Interview domain experts to capture tacit knowledge and reduce asset knowledge debt.</p>
          
          <Card>
            <form onSubmit={handleStart} className="p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-textSecondary uppercase">Asset ID</label>
                <input 
                  value={assetInput}
                  onChange={e => setAssetInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors"
                  placeholder="e.g. T-101"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-textSecondary uppercase">Expert Name</label>
                <input 
                  value={expertInput}
                  onChange={e => setExpertInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors"
                  placeholder="e.g. Rahul Kumar"
                  required
                />
              </div>
              {error && (
                <div className="text-critical text-sm flex items-center gap-2 bg-critical/10 p-3 rounded-lg">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <Button type="submit" disabled={isLoading} className="mt-4">
                {isLoading ? 'Initializing Session...' : 'Start Interview'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      
      {/* Session Progress Sidebar */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-1/3 flex flex-col gap-4"
      >
        <Card variant={scoreImprovement > 0 ? 'ok' : 'default'} className="flex-shrink-0">
          <div className="p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg border-b border-white/10 pb-4">Session Info</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Asset</span>
              <span className="font-mono font-semibold">{assetId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Expert</span>
              <span className="font-semibold">{expertName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Status</span>
              <span className="text-accent uppercase tracking-wider text-xs font-bold">{status}</span>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-textSecondary font-bold mb-2">Debt Score Tracker</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tighter">{currentScore}</span>
                {scoreImprovement > 0 && (
                  <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-ok font-bold">
                    (-{scoreImprovement})
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Chat Interface */}
      <Card className="w-full md:w-2/3 h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`flex gap-4 ${msg.role === 'expert' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'interviewer' ? 'bg-accent/20 text-accent' : 'bg-surface2 text-textSecondary'}`}>
                  {msg.role === 'interviewer' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'interviewer' ? 'bg-surface2 border border-white/5 rounded-tl-none' : 'bg-accent/10 border border-accent/20 rounded-tr-none text-accent-100'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Bot size={20} />
                </div>
                <div className="bg-surface2 border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
        
        {status === 'active' && (
          <div className="p-4 border-t border-white/5 bg-black/20">
            {error && <div className="text-critical text-sm mb-2">{error}</div>}
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your response..."
                className="w-full bg-surface2 border border-white/10 rounded-full pl-6 pr-14 py-4 outline-none focus:border-accent/50 transition-colors"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          </div>
        )}
      </Card>

    </div>
  )
}
