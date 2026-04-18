import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Lock, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { PasswordRequirement } from '../components/ui/PasswordRequirement'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const { error: resetError } = await updatePassword(password)
    
    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/auth?mode=login'), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-low flex flex-col items-center justify-center p-6 relative overflow-hidden pt-24">
      <Navbar />
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Set New Password</h1>
          <p className="text-muted font-medium">Create a strong password for your account</p>
        </div>

        <div className="bg-white dark:bg-surface-high/40 p-8 rounded-[40px] border border-overlay shadow-2xl">
          {success ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-[30px] bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-on-surface mb-4">Password Updated!</h2>
              <p className="text-muted text-sm mb-8 font-medium leading-relaxed">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <Link to="/auth?mode=login" className="inline-flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-navy text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-navy/20">
                Sign In Now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 ml-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-on-surface text-sm font-medium focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {password.length > 0 && <PasswordRequirement password={password} />}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-on-surface text-sm font-medium focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none transition-all"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <motion.button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 text-sm mt-4 rounded-2xl bg-navy text-white font-black shadow-lg shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest"
                whileHover={!loading ? { y: -2, filter: 'brightness(1.1)' } : {}}
              >
                {loading ? 'Changing Password...' : 'Save New Password'}
              </motion.button>
              
              <div className="text-center">
                <Link to="/auth?mode=login" className="inline-flex items-center gap-2 text-slate-400 font-bold text-xs hover:text-navy transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
