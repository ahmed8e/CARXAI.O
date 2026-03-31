import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  User, Mail, Shield, CreditCard, 
  ShieldAlert, Users, LogOut,
  Zap, CheckCircle2, Monitor, Globe, 
  HelpCircle, Settings, Camera, Smartphone, AlertTriangle,
  History, X, Loader2, Navigation, Wrench
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

type Section = 'profile' | 'security' | 'preferences' | 'billing' | 'activity' | 'support'

interface ActivityItem {
  id: string;
  type: 'diagnosis' | 'search' | 'towing';
  title: string;
  date: string;
  timestamp: string;
  status: string;
}

export default function MyAccount() {
  const { user, signOut, signOutAll, updateProfile, updatePassword } = useAuth()
  const navigate = useNavigate()
  
  // App States
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const { isDarkMode, toggleTheme } = useTheme()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Profile Data state
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    preferredLanguage: 'English (US)'
  })
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Activity State
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  // Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingPass, setIsUpdatingPass] = useState(false)
  const [loggingOutAll, setLoggingOutAll] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Password fields
  const [passFields, setPassFields] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchProfile()
    if (activeSection === 'activity') {
      fetchActivity()
    }
  }, [user, activeSection])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      setFeedback(null)
      
      const file = e.target.files?.[0]
      if (!file || !user) return
      
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      })

      setFeedback({ type: 'success', message: 'Profile photo updated successfully!' })
      // Auto-reload to refresh the auth context
      setTimeout(() => window.location.reload(), 1000)
      
    } catch (error: any) {
      console.error(error)
      setFeedback({ type: 'error', message: error.message || 'Failed to upload photo.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const fetchProfile = async () => {
    if (!user) return
    setLoadingProfile(true)
    
    // Check user metadata first
    const metadata = user.user_metadata
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && profile) {
      setProfileData({
        // @ts-ignore - Supabase type mismatch
        fullName: profile.full_name || metadata?.full_name || '',
        phoneNumber: metadata?.phone_number || '',
        preferredLanguage: metadata?.preferred_language || 'English (US)'
      })
    } else {
      setProfileData({
        fullName: metadata?.full_name || user.email?.split('@')[0] || 'User',
        phoneNumber: metadata?.phone_number || '',
        preferredLanguage: metadata?.preferred_language || 'English (US)'
      })
    }
    setLoadingProfile(false)
  }

  const fetchActivity = async () => {
    if (!user) return
    setLoadingActivity(true)
    
    try {
      // Fetch AI Chats (Diagnoses)
      const { data: chats } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch Mechanic Searches
      const { data: searches } = await supabase
        .from('mechanic_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch Towing Requests
      const { data: towing } = await supabase
        .from('towing_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Combine and filter results
      const merged: ActivityItem[] = []

      if (chats) {
        chats.forEach((chat: any) => merged.push({
          id: chat.id,
          type: 'diagnosis',
          title: `AI Diagnosis: ${chat.issue_name || 'Vehicle Issue'}`,
          date: new Date(chat.created_at).toLocaleDateString(),
          timestamp: chat.created_at,
          status: chat.urgency_level || 'Completed'
        }))
      }

      if (searches) {
        searches.forEach((search: any) => merged.push({
          id: search.id,
          type: 'search',
          title: `Searched for ${search.selected_mechanic_name || 'Mechanics'}`,
          date: new Date(search.created_at).toLocaleDateString(),
          timestamp: search.created_at,
          status: search.location_text || 'Nearby'
        }))
      }

      if (towing) {
        towing.forEach((req: any) => merged.push({
          id: req.id,
          type: 'towing',
          title: `Towing: ${req.provider_name || 'Request Sent'}`,
          date: new Date(req.created_at).toLocaleDateString(),
          timestamp: req.created_at,
          status: req.status || 'Sent'
        }))
      }

      // Sort by date desc
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setActivities(merged.slice(0, 10))
    } catch (err) {
      console.error('Error fetching activity:', err)
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFeedback(null)

    const { error } = await updateProfile(profileData as any)

    if (error) {
      setFeedback({ type: 'error', message: error.message })
    } else {
      setFeedback({ type: 'success', message: 'Profile updated successfully!' })
      setTimeout(() => setIsEditingProfile(false), 1500)
    }
    setFormLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passFields.newPassword !== passFields.confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' })
      return
    }
    if (passFields.newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' })
      return
    }

    setFormLoading(true)
    setFeedback(null)

    const { error } = await updatePassword(passFields.newPassword)

    if (error) {
      setFeedback({ type: 'error', message: error.message })
    } else {
      setFeedback({ type: 'success', message: 'Password updated successfully!' })
      setPassFields({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setIsUpdatingPass(false), 1500)
    }
    setFormLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const userInitial = profileData.fullName?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase() || 'U'
  const userName = profileData.fullName || user?.email?.split('@')[0] || 'User'

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'billing', label: 'Subscription', icon: CreditCard },
    { id: 'activity', label: 'Activity', icon: History },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ]

  const Sidebar = () => (
    <div className="w-full lg:w-72 flex-shrink-0">
      <div className="sticky top-24 space-y-2 lg:bg-[var(--color-surface)] lg:backdrop-blur-xl lg:p-3 lg:rounded-[32px] lg:border lg:border-[var(--color-overlay)] lg:shadow-xl group">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as Section)}
            className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all font-bold text-sm text-left group ${
              activeSection === item.id 
              ? 'bg-[#0070E0] text-white shadow-lg shadow-[#0070E0]/20 translate-x-1' 
              : 'text-slate-500 hover:bg-[var(--color-surface-high)] hover:text-[#0070E0]'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-white' : 'text-slate-400 group-hover:text-[#0070E0]'}`} />
            {item.label}
            {activeSection === item.id && <motion.div layoutId="activeDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />}
          </button>
        ))}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 lg:px-2">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )

  const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
      case 'diagnosis': return <ShieldAlert className="w-6 h-6 text-blue-500" />
      case 'search': return <Navigation className="w-6 h-6 text-emerald-500" />
      case 'towing': return <Wrench className="w-6 h-6 text-amber-500" />
      default: return <History className="w-6 h-6" />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-soft)] pb-24 selection:bg-[#0070E0]/10 transition-colors duration-300">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#5DB0EE]/10 to-transparent rounded-full -mr-32 -mt-32 blur-3xl opacity-50 dark:opacity-20" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#0E3882]/5 to-transparent rounded-full -ml-32 -mb-32 blur-3xl opacity-30 dark:opacity-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-20">
        <div className="flex flex-col lg:flex-row gap-10">
          
          <Sidebar />

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Profile Overview Card */}
                  <div className="bg-[var(--color-surface)] p-8 md:p-10 rounded-[48px] border border-[var(--color-overlay)] shadow-2xl overflow-hidden relative group transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0070E0]/5 to-transparent rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                      <div className="relative">
                        <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} />
                        <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-[#0E3882] to-[#0070E0] flex items-center justify-center text-white text-5xl font-display font-bold shadow-2xl shadow-[#0070E0]/30 ring-8 ring-[var(--color-soft)] border border-[#0070E0]/20 overflow-hidden relative">
                          {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
                          ) : (
                            userInitial
                          )}
                          {uploadingAvatar && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[var(--color-surface-high)] text-[#0070E0] shadow-xl flex items-center justify-center hover:scale-110 transition-transform border border-[var(--color-overlay)] z-20 cursor-pointer">
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                          <div>
                            <h2 className="text-3xl font-display font-black text-[var(--color-on-surface)] mb-1">{userName}</h2>
                            <p className="text-slate-400 font-medium tracking-wide flex items-center justify-center md:justify-start gap-2">
                              <Mail className="w-4 h-4" /> {user?.email}
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-black uppercase tracking-widest md:ml-2 h-fit self-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Member
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:gap-10">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Account Created</p>
                            <p className="text-sm font-bold text-[var(--color-on-surface)]">March 20, 2026</p>
                          </div>
                          <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Verified On</p>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#0070E0]" />
                              <p className="text-sm font-bold text-[var(--color-on-surface)]">Phone & Email</p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setIsEditingProfile(true)
                            setFeedback(null)
                          }}
                          className="mt-8 px-8 py-3.5 rounded-2xl bg-[#0070E0] text-white text-sm font-black uppercase tracking-[0.15em] shadow-[0_10px_30px_rgba(0,112,224,0.3)] hover:-translate-y-1 hover:shadow-xl transition-all"
                        >
                          Edit Profile Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Card */}
                  <div className="bg-[var(--color-surface)] p-8 md:p-10 rounded-[48px] border border-[var(--color-overlay)] shadow-xl transition-colors">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-low)] flex items-center justify-center text-[#0070E0] border border-[var(--color-overlay)] shadow-inner">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-[var(--color-on-surface)] italic">Personal Information</h3>
                    </div>
                    {loadingProfile ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#0070E0] animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                          { label: 'Full Name', value: profileData.fullName || 'Not set', icon: User },
                          { label: 'Email Address', value: user?.email, icon: Mail },
                          { label: 'Phone Number', value: profileData.phoneNumber || 'Not set', icon: Smartphone },
                          { label: 'Country / Region', value: 'France', icon: Globe },
                          { label: 'Preferred Language', value: profileData.preferredLanguage, icon: Globe },
                          { label: 'Job / Activity', value: 'Fleet Manager', icon: CheckCircle2 },
                        ].map((item, idx) => (
                          <div key={idx} className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 opacity-70 transition-colors">{item.label}</label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors">
                                <item.icon className="w-4.5 h-4.5" />
                              </div>
                              <div className="w-full bg-[var(--color-surface-low)] border border-[var(--color-overlay)] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[var(--color-on-surface)] whitespace-nowrap overflow-hidden text-ellipsis">
                                {item.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeSection === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-[var(--color-surface)] p-10 rounded-[48px] border border-[var(--color-overlay)] shadow-xl transition-colors">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                        <Shield className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">Security Settings</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-8 rounded-[32px] border border-[var(--color-overlay)] bg-[var(--color-surface-low)] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                            <ShieldAlert className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-1">Password</p>
                            <p className="text-sm text-slate-500 font-medium">Keep your account secure</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setIsUpdatingPass(true)
                            setFeedback(null)
                          }}
                          className="px-8 py-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-overlay)] text-[#0070E0] font-black text-sm uppercase tracking-widest hover:border-blue-500/30 hover:shadow-lg transition-all"
                        >
                          Update Password
                        </button>
                      </div>

                      <div className="p-8 rounded-[32px] border border-[var(--color-overlay)] bg-[var(--color-surface-low)] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                            <Monitor className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-xs mb-1">Active Sessions</p>
                            <p className="text-sm text-emerald-500 font-bold flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Currently active
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            setLoggingOutAll(true)
                            setFeedback(null)
                            try {
                              const { error } = await signOutAll()
                              if (error) throw error
                            } catch (error: any) {
                              console.error(error)
                              setFeedback({ type: 'error', message: error.message || 'Failed to sign out of all devices.' })
                              setLoggingOutAll(false)
                            }
                          }}
                          disabled={loggingOutAll}
                          className="px-8 py-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-overlay)] text-slate-600 dark:text-slate-400 font-black text-sm uppercase tracking-widest hover:border-red-500/30 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[220px]"
                        >
                          {loggingOutAll ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Out Everywhere'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-500/5 p-10 rounded-[48px] border border-red-500/10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-display font-black text-red-500 uppercase tracking-tight">Danger Zone</h3>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="font-bold text-red-500 mb-1">Delete Account</p>
                        <p className="text-red-500/50 text-sm font-medium">This will permanently remove all your diagnosis history and data.</p>
                      </div>
                      <button className="px-8 py-4 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 hover:brightness-110 transition-all whitespace-nowrap">
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'preferences' && (
                <motion.div key="preferences" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
                  <div className="bg-[var(--color-surface)] p-10 rounded-[48px] border border-[var(--color-overlay)] shadow-xl transition-colors">
                    <div className="flex items-center gap-4 mb-10 text-[var(--color-on-surface)]">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-display font-bold">App Preferences</h3>
                    </div>
                    <div className="space-y-10">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Appearance</p>
                        <div className="flex items-center justify-between bg-[var(--color-surface-low)] p-6 rounded-[32px] border border-[var(--color-overlay)]">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] shadow-sm flex items-center justify-center text-slate-400">
                                <Zap className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-[var(--color-on-surface)]">Dark Mode</p>
                                <p className="text-xs text-slate-500 font-medium">Toggle high-end night theme</p>
                              </div>
                           </div>
                           <button onClick={toggleTheme} className={`w-14 h-8 rounded-full relative transition-colors duration-300 flex items-center px-1 ${isDarkMode ? 'bg-[#0070E0]' : 'bg-slate-200'}`}>
                             <motion.div animate={{ x: isDarkMode ? 24 : 0 }} className="w-6 h-6 rounded-full bg-white shadow-lg" />
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'billing' && (
                <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-[#0E3882] p-10 rounded-[48px] shadow-2xl shadow-[#0E3882]/20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="text-center md:text-left text-white">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-black tracking-widest mb-6">Current Plan</div>
                        <h3 className="text-4xl font-display font-black italic mb-2">Carxai Pro</h3>
                        <p className="text-[#5DB0EE] font-bold text-lg mb-8">Premium Automotive Intelligence</p>
                      </div>
                      <button className="px-10 py-5 rounded-2xl bg-[#0070E0] text-white font-black text-sm uppercase tracking-widest shadow-xl hover:scale-102 transition-all">Upgrade to Premium</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'activity' && (
                <motion.div key="activity" className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                      <History className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">Recent Activity</h3>
                  </div>

                  {loadingActivity ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-10 h-10 text-[#0070E0] animate-spin" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating History...</p>
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((act) => (
                        <div key={act.id} className="bg-[var(--color-surface)] p-6 md:p-8 rounded-[36px] border border-[var(--color-overlay)] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 group transition-all hover:border-[#0070E0]/30">
                           <div className="flex items-center gap-6 w-full">
                             <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-low)] flex items-center justify-center shadow-inner">
                               <ActivityIcon type={act.type} />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-[var(--color-on-surface)] truncate">{act.title}</h4>
                               <div className="flex items-center gap-3 mt-1">
                                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{act.date}</p>
                                 <span className="w-1 h-1 rounded-full bg-slate-300" />
                                 <p className="text-[10px] text-[#0070E0] font-black uppercase tracking-widest truncate">{act.status}</p>
                               </div>
                             </div>
                           </div>
                           <button className="w-full md:w-auto px-6 py-3 rounded-xl bg-[var(--color-surface-low)] text-[var(--color-on-surface)] text-[10px] font-black uppercase tracking-widest border border-[var(--color-overlay)] hover:bg-[#0070E0] hover:text-white hover:border-[#0070E0] transition-all">
                             View Details
                           </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[var(--color-surface)] p-20 rounded-[48px] border border-dashed border-[var(--color-overlay)] text-center flex flex-col items-center gap-4">
                       <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <History className="w-8 h-8 opacity-20" />
                       </div>
                       <div>
                          <p className="text-[var(--color-on-surface)] font-bold text-lg mb-1">No activity yet</p>
                          <p className="text-slate-400 text-sm font-medium">Your diagnoses and searches will appear here.</p>
                       </div>
                       <button 
                         onClick={() => navigate('/dashboard')}
                         className="mt-4 px-8 py-3 rounded-2xl bg-[#0070E0]/10 text-[#0070E0] text-[10px] font-black uppercase tracking-widest border border-[#0070E0]/20 hover:bg-[#0070E0] hover:text-white transition-all"
                       >
                         Start New Diagnosis
                       </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSection === 'support' && (
                <motion.div key="support" className="text-center bg-[var(--color-surface)] p-10 rounded-[48px] shadow-xl transition-colors border border-[var(--color-overlay)]">
                  <h3 className="text-3xl font-display font-black text-[#0070E0] italic mb-4">How can we help?</h3>
                  <p className="text-slate-500 font-medium mb-8">Our AI and human mechanic support are here for you 24/7.</p>
                  <button className="px-10 py-5 rounded-2xl bg-[#0070E0] text-white font-black text-sm uppercase tracking-widest shadow-xl">Contact Support</button>
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingProfile(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[var(--color-surface)] w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-[var(--color-overlay)]">
               <div className="p-6 md:p-8 border-b border-[var(--color-overlay)] flex items-center justify-between sticky top-0 bg-[var(--color-surface)] z-10 backdrop-blur-xl">
                  <h2 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">Edit Profile</h2>
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      form="profile-form"
                      type="submit"
                      disabled={formLoading}
                      className="px-5 py-2.5 rounded-xl bg-[#0070E0] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#0070E0]/30 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {formLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-[var(--color-surface-low)] rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
               </div>
               <form id="profile-form" onSubmit={handleUpdateProfile} className="p-6 md:p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                      <input 
                        required 
                        type="text" 
                        value={profileData.fullName} 
                        onChange={e => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full bg-[var(--color-surface-low)] border border-[var(--color-overlay)] rounded-2xl py-4 px-6 text-sm font-bold text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileData.phoneNumber} 
                        onChange={e => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full bg-[var(--color-surface-low)] border border-[var(--color-overlay)] rounded-2xl py-4 px-6 text-sm font-bold text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preferred Language</label>
                      <select 
                        value={profileData.preferredLanguage} 
                        onChange={e => setProfileData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                        className="w-full bg-[var(--color-surface-low)] border border-[var(--color-overlay)] rounded-2xl py-4 px-6 text-sm font-bold text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all appearance-none"
                      >
                         <option>English (US)</option>
                         <option>French</option>
                         <option>Spanish</option>
                      </select>
                    </div>
                  </div>

                  {feedback && (
                    <div className={`p-4 rounded-2xl text-sm font-bold ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {feedback.message}
                    </div>
                  )}

               </form>
            </motion.div>
          </div>
        )}

        {isUpdatingPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUpdatingPass(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[var(--color-surface)] w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-[var(--color-overlay)]">
               <div className="p-8 border-b border-[var(--color-overlay)] flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold text-[var(--color-on-surface)]">Update Password</h2>
                  <button onClick={() => setIsUpdatingPass(false)} className="p-2 hover:bg-[var(--color-surface-low)] rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
               </div>
               <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                       <Shield className="w-5 h-5 text-[#0070E0] mt-0.5" />
                       <p className="text-xs text-blue-500 font-medium leading-relaxed">For your security, we recommend a password that is at least 6 characters long and includes numbers.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                      <input 
                        required 
                        type="password" 
                        value={passFields.newPassword} 
                        onChange={e => setPassFields(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full bg-[var(--color-surface-low)] border border-[var(--color-overlay)] rounded-2xl py-4 px-6 text-sm font-bold text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                      <input 
                        required 
                        type="password" 
                        value={passFields.confirmPassword} 
                        onChange={e => setPassFields(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full bg-[var(--color-surface-low)] border border-[var(--color-overlay)] rounded-2xl py-4 px-6 text-sm font-bold text-[var(--color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
                      />
                    </div>
                  </div>

                  {feedback && (
                    <div className={`p-4 rounded-2xl text-sm font-bold ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {feedback.message}
                    </div>
                  )}

                  <button 
                    disabled={formLoading}
                    type="submit" 
                    className="w-full py-5 rounded-2xl bg-[#0070E0] text-white font-black uppercase tracking-widest shadow-xl shadow-[#0070E0]/20 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {formLoading ? 'Updating...' : 'Update Password'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
