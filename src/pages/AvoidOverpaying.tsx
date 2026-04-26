import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, 
  Car, Wrench, DollarSign, MessageSquare, Mic, 
  Bot
} from 'lucide-react'
import { Link } from 'react-router-dom'

type Tone = 'polite' | 'assertive' | 'expert'
type TrustLevel = 'fair' | 'expensive' | 'overpriced' | null

export default function AvoidOverpaying() {
  const [step, setStep] = useState<'input' | 'results'>('input')
  const [carModel, setCarModel] = useState('')
  const [problemDesc, setProblemDesc] = useState('')
  const [quotedPrice, setQuotedPrice] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  
  // Results State
  const [trustLevel, setTrustLevel] = useState<TrustLevel>(null)
  const [fairPriceRange, setFairPriceRange] = useState('')
  const [explanation, setExplanation] = useState('')
  
  // Replies State
  const [selectedTone, setSelectedTone] = useState<Tone>('polite')

  // Live Assistant State
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([])

  const handleCheckPrice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!carModel || !problemDesc || !quotedPrice) return
    
    setIsChecking(true)
    
    // Mock the backend price analysis delay
    setTimeout(() => {
      const price = parseFloat(quotedPrice)
      let level: TrustLevel = 'fair'
      let range = ''
      let exp = ''
      
      // Super mock logic
      if (price < 300) {
        level = 'fair'
        range = `$${(price * 0.9).toFixed(0)} - $${(price * 1.1).toFixed(0)}`
        exp = 'This quote is well within the typical market range for this repair on your vehicle.'
      } else if (price >= 300 && price < 800) {
        level = 'expensive'
        range = `$${(price * 0.6).toFixed(0)} - $${(price * 0.8).toFixed(0)}`
        exp = 'This seems a bit above average. There might be a premium markup on parts or high labor rate.'
      } else {
        level = 'overpriced'
        range = `$${(price * 0.4).toFixed(0)} - $${(price * 0.6).toFixed(0)}`
        exp = 'This quote is significantly higher than standard industry guidelines. Definitely negotiate or get a second opinion.'
      }
      
      setTrustLevel(level)
      setFairPriceRange(range)
      setExplanation(exp)
      
      setIsChecking(false)
      setStep('results')
    }, 1500)
  }

  const generatedReplies: Record<Tone, string[]> = {
    polite: [
      "Thanks for the quote. I've looked into standard rates and was hoping we could meet somewhere around [Fair Price].",
      "I appreciate your time. Is there any flexibility on the price for these specific parts?",
      "Thank you. Let me think about it and maybe check one other place before committing."
    ],
    assertive: [
      "This quote is higher than the standard market rate of [Fair Price]. Can you explain the markup?",
      "I'm prepared to authorize the repair today if we can bring the price down to [Fair Price].",
      "Given the typical labor hours for this job, the labor charge seems high. Could you review that for me?"
    ],
    expert: [
      "Are you using OEM or aftermarket parts? Standard Mitchell/Alldata labor times suggest this is a [X] hour job, not [Y].",
      "Could I get an itemized breakdown? The standard rate for this specific repair usually caps out at [Fair Price].",
      "If the diagnostic fee is being rolled into the repair, the total should be closer to [Fair Price]."
    ]
  }

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false)
      // Simulate Bot responding after "voice recording" finishes
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { role: 'user', text: '(Voice recording sent)' },
          { role: 'assistant', text: "I heard that. If they say it requires a full replacement, ask them to show you the specific failure points first." }
        ])
      }, 500)
    } else {
      setIsRecording(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Premium Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-0.5 mt-0.5">Price Protection</p>
            <h1 className="text-sm font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">Avoid Overpaying</h1>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight mb-2">Check Your Mechanic's Quote</h2>
                <p className="text-sm text-slate-500 font-medium">Enter your repair details below and our AI will tell you if you're getting a fair deal.</p>
              </div>

              <form onSubmit={handleCheckPrice} className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <Car className="w-4 h-4 text-emerald-500" />
                      Vehicle Make & Model
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., 2018 Toyota Camry"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <Wrench className="w-4 h-4 text-emerald-500" />
                      Problem Description
                    </label>
                    <textarea 
                      required
                      placeholder="e.g., Needs front brake pads and rotors replaced"
                      value={problemDesc}
                      onChange={(e) => setProblemDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                    />
                  </div>

                  <div>
                     <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Mechanic's Quoted Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        required
                        placeholder="0.00"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-lg font-black text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                </div>

                <button 
                  type="submit" 
                  disabled={isChecking}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Verify Quote Price
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'results' && trustLevel && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 1. Trust Indicator Header */}
              <div className="bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 w-full h-1.5 ${
                  trustLevel === 'fair' ? 'bg-emerald-500' : 
                  trustLevel === 'expensive' ? 'bg-amber-500' : 
                  'bg-rose-500'
                }`} />
                
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  trustLevel === 'fair' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 
                  trustLevel === 'expensive' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 
                  'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                }`}>
                  {trustLevel === 'fair' ? <ShieldCheck className="w-8 h-8" /> : 
                   trustLevel === 'expensive' ? <AlertTriangle className="w-8 h-8" /> : 
                   <ShieldAlert className="w-8 h-8" />}
                </div>

                <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                  trustLevel === 'fair' ? 'text-emerald-600' : 
                  trustLevel === 'expensive' ? 'text-amber-600' : 
                  'text-rose-600'
                }`}>
                  {trustLevel === 'fair' ? 'Looks Good' : 
                   trustLevel === 'expensive' ? 'Be Careful' : 
                   'High Alert'}
                </div>
                
                <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white capitalize mb-4 tracking-tight">
                  {trustLevel === 'fair' ? 'Fair Price' : 
                   trustLevel === 'expensive' ? 'Slightly Expensive' : 
                   'Overpriced'}
                </h2>
                
                <div className="bg-slate-50 dark:bg-slate-950 w-full p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Estimated Fair Range</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{fairPriceRange}</p>
                </div>
                
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {explanation}
                </p>
              </div>

              {/* 2. Smart Reply Generator */}
              <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 dark:text-white text-base">Smart Reply Generator</h3>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">What to say to the mechanic</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['polite', 'assertive', 'expert'] as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTone(t)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedTone === t 
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  {generatedReplies[selectedTone].map((reply, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 relative group">
                      <p>"{reply.replace('[Fair Price]', fairPriceRange)}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Live Assistant Mode (Voice UI) */}
              <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <div className="text-center mb-6">
                  <h3 className="font-display font-black text-slate-900 dark:text-white text-base">Live Assistant Mode</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-[250px] mx-auto mt-1">
                    Talking to the mechanic right now? Tap record for live AI suggestions.
                  </p>
                </div>

                {messages.length > 0 && (
                  <div className="w-full space-y-3 mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl h-40 overflow-y-auto border border-slate-100 dark:border-slate-800">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex items-start gap-2 max-w-[85%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
                        {m.role === 'assistant' && (
                          <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        )}
                        <div className={`p-3 rounded-2xl text-xs font-medium ${
                          m.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-sm ml-auto' 
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={handleToggleRecord}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isRecording 
                      ? 'bg-rose-50 border-4 border-rose-500 animate-pulse text-rose-500' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
                </button>
                <p className="text-[10px] uppercase font-black tracking-widest mt-4 text-slate-400">
                  {isRecording ? 'Listening...' : 'Tap to Listen'}
                </p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setStep('input')}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all"
                >
                  Check Another Quote
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
