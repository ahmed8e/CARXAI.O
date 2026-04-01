import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, CheckCircle, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const { signIn, signUp, signInWithOAuth } = useAuth()
  const navigate = useNavigate()
  
  // Decide default mode based on localStorage or URL param
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 
                      searchParams.get('mode') === 'login' ? 'login' :
                      localStorage.getItem('carxai_returning') === 'true' ? 'login' : 'login'; 

  const [mode, setMode] = useState<'login' | 'register'>(initialMode as any)
  
  // Feature Flags for OAuth - Switch to TRUE once configured in Supabase
  const GOOGLE_AUTH_ENABLED = false;
  const APPLE_AUTH_ENABLED = false;
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Clear errors when switching modes
  useEffect(() => {
    setError('')
  }, [mode])

  // Mark as returning user when mounting if they ever log in
  const markReturningUser = () => {
    localStorage.setItem('carxai_returning', 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    
    if (mode === 'login') {
      const { error: signInError } = await signIn(email, password, rememberMe)
      if (signInError) {
        setError(signInError.message)
      } else {
        markReturningUser()
        navigate('/dashboard')
      }
    } else {
      const { data, error: signUpError } = await signUp(email, password, fullName)
      if (signUpError) {
        setError(signUpError.message)
      } else {
        markReturningUser()
        
        // Check if user is confirmed. If not, don't redirect, show message.
        if (data?.session) {
          // If session is present, they are logged in (likely email confirm is OFF)
          navigate('/dashboard')
        } else {
          // No session usually means email confirmation is sent
          setIsSuccess(true)
          setSuccessMessage('Account created! Please check your email to confirm and sign in.')
        }
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-soft dark:bg-surface-low flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Simple Top Left Logo instead of Navbar */}
      <div className="absolute top-[calc(1.5rem_+_env(safe-area-inset-top))] left-6 md:top-8 md:left-8 z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy shadow-lg shadow-navy/20 group-hover:scale-105 transition-transform">
            <Zap className="w-4.5 h-4.5 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-black text-xl tracking-tighter text-on-surface">
            car<span className="text-navy">x</span>ai
          </span>
        </Link>
      </div>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-navy/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 mt-20"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-black text-on-surface mb-2 tracking-tight italic">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-muted font-medium">
            {mode === 'login' ? 'Your AI-powered roadside companion' : 'Join thousands of smart drivers'}
          </p>
        </div>

        <div className="bg-surface dark:bg-surface p-8 rounded-3xl border border-overlay shadow-2xl shadow-black/10">
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-surface-low dark:bg-surface-low/60 border border-overlay rounded-[14px] mb-8">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-bold rounded-[10px] transition-all duration-300 ${mode === 'login' ? 'bg-surface dark:bg-surface-high/40 text-on-surface shadow-sm' : 'text-muted hover:text-on-surface'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-bold rounded-[10px] transition-all duration-300 ${mode === 'register' ? 'bg-surface dark:bg-surface-high/40 text-on-surface shadow-sm' : 'text-muted hover:text-on-surface'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Social Login Buttons */}
          {(GOOGLE_AUTH_ENABLED || APPLE_AUTH_ENABLED) && (
            <>
              <div className="space-y-4 mb-8 relative z-10">
                {GOOGLE_AUTH_ENABLED && (
                  <button 
                    type="button"
                    onClick={async () => {
                      const { error } = await signInWithOAuth('google')
                      if (error) {
                        setError('Google sign-in is not configured yet. Please use email.')
                      }
                    }}
                    className="relative w-full flex items-center justify-center py-3.5 px-4 rounded-[14px] bg-surface dark:bg-surface-high/40 border border-overlay text-on-surface text-[15px] font-semibold shadow-sm hover:surface-high transition-all group"
                  >
                    <div className="absolute left-5 flex items-center justify-center w-6 h-6">
                      <svg className="w-[19px] h-[19px] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    Continue with Google
                  </button>
                )}
                {APPLE_AUTH_ENABLED && (
                  <button 
                    type="button"
                    onClick={async () => {
                      const { error } = await signInWithOAuth('apple')
                      if (error) {
                        setError('Apple sign-in is not configured yet. Please use email.')
                      }
                    }}
                    className="relative w-full flex items-center justify-center py-3.5 px-4 rounded-[14px] bg-surface dark:bg-surface-high/40 border border-overlay text-on-surface text-[15px] font-semibold shadow-sm hover:surface-high transition-all group"
                  >
                    <div className="absolute left-5 flex items-center justify-center w-6 h-6 mb-[1px]">
                      <svg className="w-[21px] h-[21px] text-on-surface group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.73 3.83-.66 1.34.07 2.45.64 3.16 1.64-2.68 1.6-2.22 5.38.48 6.47-.64 1.77-1.8 3.58-2.55 4.72zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.4-1.88 4.41-3.74 4.25z"/>
                      </svg>
                    </div>
                    Continue with Apple
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="h-px bg-overlay flex-1"></div>
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Or continue with email</span>
                <div className="h-px bg-overlay flex-1"></div>
              </div>
            </>
          )}


          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
                {error}
              </div>
            )}

            {isSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-on-surface mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-low dark:bg-surface-low/60 border border-overlay text-on-surface text-sm font-medium focus:border-navy focus:ring-[3px] focus:ring-navy/10 placeholder:text-muted transition-all outline-none"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required={mode === 'register'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3.5 rounded-xl bg-surface-low dark:bg-surface-low/60 border border-overlay text-on-surface text-sm font-medium focus:border-navy focus:ring-[3px] focus:ring-navy/10 placeholder:text-muted transition-all outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3.5 rounded-xl bg-surface-low dark:bg-surface-low/60 border border-overlay text-on-surface text-sm font-medium focus:border-navy focus:ring-[3px] focus:ring-navy/10 placeholder:text-muted transition-all outline-none pr-12"
                  placeholder={mode === 'login' ? '••••••••' : 'Min. 6 characters'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors flex items-center justify-center p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {mode === 'login' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between overflow-hidden"
                >
                  <label className="flex items-center gap-3 cursor-pointer group py-1">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer appearance-none w-5 h-5 rounded-md border-2 border-overlay checked:bg-navy checked:border-navy transition-all cursor-pointer"
                      />
                      <CheckCircle className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-sm font-medium text-muted group-hover:text-on-surface transition-colors select-none">Remember me</span>
                  </label>
                  <Link to="/forgot-password" title="sm" className="text-sm text-navy hover:underline font-bold">
                    Forgot password?
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 text-base mt-2 rounded-2xl bg-navy text-white font-bold shadow-[0_10px_30px_rgba(0,112,224,0.3)] disabled:opacity-50" 
              whileHover={!loading ? { y: -2, filter: 'brightness(1.1)' } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating...'}
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
