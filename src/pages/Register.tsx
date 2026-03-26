import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Zap } from 'lucide-react'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(4, 30, 43, 0.9), rgba(4, 30, 43, 0.9)), url('/section-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-navy border border-[#CDFF00]/30 shadow-glow-sm">
            <Zap className="w-5 h-5" style={{ color: '#CDFF00' }} />
          </div>
          <span className="font-display font-bold text-xl text-soft">car<span style={{ color: '#CDFF00' }}>x</span>.ai</span>
        </div>

        <div className="card">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-soft mb-1">Create your account</h1>
            <p className="text-muted text-sm">Start diagnosing car issues with AI</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label-sm block mb-2">Full Name</label>
              <input type="text" className="input-field" placeholder="John Doe"
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>

            <div>
              <label className="label-sm block mb-2">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="label-sm block mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input-field pr-12"
                  placeholder="Min. 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-soft transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 text-base mt-2 rounded-2xl text-navy font-bold shadow-[0_0_20px_rgba(205,255,0,0.3)] disabled:opacity-50" 
              style={{ background: '#CDFF00' }}
              whileHover={!loading ? { y: -2, boxShadow: '0 8px 25px rgba(205, 255, 0, 0.4)' } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-navy">
                  <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-muted mt-5 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-DEFAULT hover:text-cyan-light transition-colors font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
