import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await resetPassword(email)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden pt-24">
      <Navbar />
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-navy/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Reset Password</h1>
          <p className="text-muted font-medium">We'll help you get back in</p>
        </div>

        <div className="bg-surface dark:bg-slate-800 p-8 rounded-3xl border border-overlay shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-display font-bold text-on-surface mb-2">Check your email</h2>
              <p className="text-muted text-sm mb-6">We've sent a password reset link to <strong className="text-on-surface">{email}</strong></p>
              <Link to="/auth?mode=login" className="inline-flex items-center gap-2 text-navy font-bold hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-5 py-4 rounded-xl bg-surface-low dark:bg-slate-900 border border-overlay text-on-surface font-medium focus:bg-surface focus:border-navy focus:ring-4 focus:ring-navy/10 outline-none transition-all placeholder:text-muted"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <motion.button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 text-base rounded-2xl bg-navy text-white font-bold shadow-[0_10px_30px_rgba(0,112,224,0.3)] disabled:opacity-50"
                  whileHover={!loading ? { y: -2, filter: 'brightness(1.1)' } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </motion.button>
              </form>

              <p className="text-center text-muted mt-6 text-sm">
                Remember your password?{' '}
                <Link to="/auth?mode=login" className="text-navy font-bold hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
