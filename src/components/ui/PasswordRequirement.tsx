import { Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PasswordRequirementProps {
  password: string
}

export function PasswordRequirement({ password }: PasswordRequirementProps) {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Upper & lowercase letters', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'A number or symbol', met: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const metCount = requirements.filter(r => r.met).length
  
  const getStrength = () => {
    if (!password) return { label: '', color: 'bg-slate-200', width: '0%' }
    if (metCount === 1) return { label: 'Weak', color: 'bg-red-500', width: '33.33%' }
    if (metCount === 2) return { label: 'Medium', color: 'bg-amber-500', width: '66.66%' }
    if (metCount === 3) return { label: 'Strong', color: 'bg-emerald-500', width: '100%' }
    return { label: 'Incomplete', color: 'bg-slate-200', width: '10%' }
  }

  const strength = getStrength()

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-4 pt-2 overflow-hidden"
    >
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Strength</span>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${strength.label === 'Strong' ? 'text-emerald-500' : strength.label === 'Medium' ? 'text-amber-500' : 'text-slate-400'}`}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
          {[1, 2, 3].map((seg) => (
            <div 
              key={seg}
              className={`h-full flex-1 rounded-full transition-all duration-500 ${
                metCount >= seg 
                  ? seg === 1 ? 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                  : seg === 2 ? 'bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                  : 'bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-200/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirement Guidance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 px-1 pb-2">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-2.5 group">
            <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all ${req.met ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
              <Check className={`w-2.5 h-2.5 transition-transform duration-500 ${req.met ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} strokeWidth={4} />
              {!req.met && <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors" />}
            </div>
            <span className={`text-[11px] font-bold tracking-tight transition-colors ${req.met ? 'text-slate-600' : 'text-slate-400'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
