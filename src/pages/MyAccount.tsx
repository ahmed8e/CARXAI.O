import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  User, Mail, Shield, 
  ShieldAlert, LogOut,
  CheckCircle2, Globe, 
  HelpCircle, Camera,
  History, X, Loader2, Navigation, Wrench, ChevronRight,
  CreditCard, Info
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

function SettingsRow({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick, 
  isLocked = false 
}: { 
  icon: any, 
  title: string, 
  subtitle: string, 
  onClick?: () => void,
  isLocked?: boolean
}) {
  return (
    <button 
      onClick={onClick}
      disabled={isLocked}
      className={`w-full group flex items-center justify-between p-6 transition-all border-b border-slate-100 last:border-0 ${isLocked ? 'cursor-not-allowed' : 'hover:bg-slate-50'}`}
    >
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isLocked ? 'bg-slate-50 text-slate-300' : 'bg-slate-50 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-600/10 group-hover:scale-105'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-left">
          <p className={`text-lg font-bold tracking-tight transition-colors ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>{title}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isLocked ? (
          <div className="px-3 py-1 rounded-lg bg-blue-50 text-[9px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 flex items-center gap-1.5 shadow-sm shadow-blue-500/5">
            <CreditCard className="w-3 h-3" /> Coming Soon
          </div>
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        )}
      </div>
    </button>
  )
}

function ContentSheet({ title, icon: Icon, children, onClose }: { title: string, icon: any, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[85vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/5 text-blue-600 flex items-center justify-center border border-blue-500/10">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export default function MyAccount() {
  const { user, signOut, updatePassword } = useAuth()
  const navigate = useNavigate()
  
  // App States
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Profile Data state
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    preferredLanguage: 'English (US)'
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  // Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingPass, setIsUpdatingPass] = useState(false)
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
    
    // Check user metadata first
    const metadata = user.user_metadata
    
    // Fetch profile (for full_name)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch user_settings (for phone_number, preferred_language)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setProfileData({
      fullName: (profile as any)?.full_name || metadata?.full_name || user.email?.split('@')[0] || 'User',
      phoneNumber: (settings as any)?.phone_number || metadata?.phone_number || '',
      preferredLanguage: (settings as any)?.preferred_language || metadata?.preferred_language || 'English (US)'
    })
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

    if (!user?.id) return

    try {
      // 1. Update profiles table (full_name)
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({ full_name: profileData.fullName })
        .eq('id', user.id)
      
      if (profileError) throw profileError

      // 2. Update user_settings table (phone_number, preferred_language)
      // Note: We use upsert because the row might not exist yet
      const { error: settingsError } = await (supabase as any)
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          phone_number: profileData.phoneNumber,
          preferred_language: profileData.preferredLanguage
        })

      if (settingsError) throw settingsError

      // 3. Optional: Sync to auth metadata so Navbar/Sidebar updates immediately
      await supabase.auth.updateUser({
        data: { full_name: profileData.fullName }
      })

      setFeedback({ type: 'success', message: 'Profile updated successfully!' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      console.error('Update error:', err)
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' })
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

  const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
      case 'diagnosis': return <ShieldAlert className="w-6 h-6 text-blue-500" />
      case 'search': return <Navigation className="w-6 h-6 text-emerald-500" />
      case 'towing': return <Wrench className="w-6 h-6 text-amber-500" />
      default: return <History className="w-6 h-6" />
    }
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-6 md:px-10 overflow-x-hidden relative">
      {/* Premium Atmospheric Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-12 py-2">
           <div className="space-y-1">
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Information & Preferences</p>
           </div>
           <button 
             onClick={() => navigate('/dashboard')}
             className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all group"
           >
             <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
           </button>
        </header>

        {/* 1. Profile Hero (Refined & Elegant) */}
        <section className="relative mb-12 p-8 rounded-[40px] bg-white border border-slate-100 overflow-hidden shadow-sm shadow-slate-200/40">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <User className="w-48 h-48 -mr-16 -mt-16" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            <div className="relative group">
              <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} />
               <div className="w-36 h-36 md:w-44 md:h-44 rounded-[54px] bg-slate-200 flex items-center justify-center text-slate-500 text-6xl md:text-7xl font-display font-bold shadow-sm ring-4 ring-white border-2 border-slate-100 overflow-hidden relative">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadingAvatar} 
                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-20 cursor-pointer"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">{userName}</h2>
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Verified Profile
                  </div>
                </div>
                <p className="text-slate-500 font-medium text-base flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4 text-slate-300" /> {user?.email}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                 <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                   Join Date <span className="text-slate-900 ml-1">{new Date(user?.created_at || Date.now()).getFullYear()}</span>
                 </div>
                 <div className="px-4 py-2 rounded-xl bg-white border-2 border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 shadow-sm shadow-blue-500/5">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                   Membership <span className="italic font-display font-black tracking-tight">Unlimited Access</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-10">
            {/* 2. Account Settings Group */}
            <div className="space-y-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Account Management</h3>
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <SettingsRow 
                  icon={User} 
                  title="Profile Details" 
                  subtitle="Update your personal information" 
                  onClick={() => setIsEditingProfile(true)}
                />
                <SettingsRow 
                  icon={Shield} 
                  title="Security & Password" 
                  subtitle="Manage your account protection" 
                  onClick={() => setIsUpdatingPass(true)}
                />
                <SettingsRow 
                  icon={CreditCard} 
                  title="Billing & Subscription" 
                  subtitle="Manage your premium access" 
                  isLocked
                />
              </div>
            </div>

            {/* 3. System Preferences Group */}
            <div className="space-y-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">App Settings</h3>
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <SettingsRow 
                  icon={Globe} 
                  title="Language" 
                  subtitle={`Set to ${profileData.preferredLanguage}`} 
                  onClick={() => setIsEditingProfile(true)}
                />
                <SettingsRow 
                   icon={History} 
                   title="Activity History" 
                   subtitle="Your diagnoses and search history" 
                   onClick={() => setActiveSection('activity')}
                />
              </div>
            </div>

            {/* 4. Support & Info Group */}
            <div className="space-y-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">Resources</h3>
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <SettingsRow 
                  icon={HelpCircle} 
                  title="Help & Support" 
                  subtitle="Get assistance from our team" 
                  onClick={() => setActiveSection('support')}
                />
                <SettingsRow 
                  icon={Info} 
                  title="About Carxai" 
                  subtitle="Version 2.4.0 (Official Build)" 
                />
              </div>
            </div>

            {/* 5. Danger Zone */}
            <div className="pt-8">
              <button 
                onClick={handleSignOut}
                className="w-full group flex items-center justify-between p-8 rounded-[40px] bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-red-600 transition-colors">Sign Out</p>
                    <p className="text-[11px] font-medium text-red-500/50 uppercase tracking-widest">End Session</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Render Activity or Support as Sheets if active */}
          <AnimatePresence>
            {activeSection === 'activity' && (
              <ContentSheet title="Activity History" icon={History} onClose={() => setActiveSection('profile')}>
                {loadingActivity ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-navy animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Updating History...</p>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((act) => (
                      <div key={act.id} className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-6">
                         <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                           <ActivityIcon type={act.type} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">{act.title}</h4>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{act.date} • {act.status}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">No activity found</div>
                )}
              </ContentSheet>
            )}

            {activeSection === 'support' && (
              <ContentSheet title="Support" icon={HelpCircle} onClose={() => setActiveSection('profile')}>
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[40px] text-center space-y-6">
                    <h3 className="text-2xl font-display font-black text-navy italic">Need assistance?</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Our expert team and AI diagnostics are available 24/7 to help with any vehicle or app issues.</p>
                    <button className="w-full py-4 rounded-2xl bg-navy text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-navy/30">Contact Support Team</button>
                 </div>
              </ContentSheet>
            )}
          </AnimatePresence>
        </div>

        {/* MODALS */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingProfile(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">
               <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 backdrop-blur-xl">
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Edit Profile</h2>
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      form="profile-form"
                      type="submit"
                      disabled={formLoading}
                      className="px-5 py-2.5 rounded-xl bg-[#0070E0] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#0070E0]/30 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {formLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
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
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileData.phoneNumber} 
                        onChange={e => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preferred Language</label>
                      <select 
                        value={profileData.preferredLanguage} 
                        onChange={e => setProfileData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all appearance-none"
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUpdatingPass(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">
               <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 backdrop-blur-xl">
                  <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Update Password</h2>
                  <button onClick={() => setIsUpdatingPass(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
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
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                      <input 
                        required 
                        type="password" 
                        value={passFields.confirmPassword} 
                        onChange={e => setPassFields(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070E0]/10 focus:border-[#0070E0]/30 transition-all"
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
