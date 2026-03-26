import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Zap, ArrowLeft, CheckCircle } from 'lucide-react'

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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-display font-bold text-soft mb-2">Check your email</h2>
              <p className="text-muted text-sm mb-6">We've sent a password reset link to <strong className="text-soft">{email}</strong></p>
              <Link to="/login" className="btn-ghost inline-flex">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-display font-bold text-soft mb-1">Reset Password</h1>
                <p className="text-muted text-sm">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}
                <div>
                  <label className="label-sm block mb-2">Email</label>
                  <input type="email" className="input-field" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3.5 text-base rounded-2xl text-navy font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(205,255,0,0.3)] disabled:opacity-50" style={{ background: '#CDFF00' }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-muted mt-5 text-sm">
                Remember your password?{' '}
                <Link to="/login" className="text-cyan-DEFAULT hover:text-cyan-light transition-colors font-medium">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
