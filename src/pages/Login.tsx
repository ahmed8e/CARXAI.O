import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Zap, Car } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div 
      className="min-h-screen flex" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(4, 30, 43, 0.9), rgba(4, 30, 43, 0.9)), url('/section-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/30 to-transparent" />
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-navy border border-[#CDFF00]/30 shadow-[0_0_20px_rgba(205,255,0,0.15)]">
              <Zap className="w-6 h-6" style={{ color: '#CDFF00' }} />
            </div>
            <span className="font-display font-bold text-2xl text-soft">car<span style={{ color: '#CDFF00' }}>x</span>.ai</span>
          </div>
          <h2 className="section-title text-soft mb-4">
            Your AI-Powered<br />
            <span className="text-gradient">Roadside Assistant</span>
          </h2>
          <p className="text-muted leading-relaxed">
            Diagnose car issues instantly, find nearby mechanics, and get towing help — all in one place.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {['AI Mechanic', 'Human Help', 'Towing'].map((item, i) => (
              <div key={i} className="card text-center py-4">
                <Car className="w-6 h-6 text-cyan-DEFAULT mx-auto mb-2" />
                <p className="text-xs text-muted">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy border border-[#CDFF00]/30 shadow-glow-sm">
              <Zap className="w-5 h-5" style={{ color: '#CDFF00' }} />
            </div>
            <span className="font-display font-bold text-xl text-soft">car<span style={{ color: '#CDFF00' }}>x</span>.ai</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-soft mb-2">Welcome back</h1>
            <p className="text-muted">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label-sm block mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-sm block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-soft transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-cyan-DEFAULT hover:text-cyan-light transition-colors">
                Forgot password?
              </Link>
            </div>

            <motion.button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 text-base rounded-2xl text-navy font-bold shadow-[0_0_20px_rgba(205,255,0,0.3)] disabled:opacity-50" 
              style={{ background: '#CDFF00' }}
              whileHover={!loading ? { y: -2, boxShadow: '0 8px 25px rgba(205, 255, 0, 0.4)' } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-navy">
                  <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-muted mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-DEFAULT hover:text-cyan-light transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
