import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  User, Mail, Shield, 
  ShieldAlert, LogOut,
  Globe, 
  HelpCircle, Camera,
  History, X, Loader2, ChevronRight,
  CreditCard, Info, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useSubscription } from '../hooks/useSubscription'
import { PasswordRequirement } from '../components/ui/PasswordRequirement'


type Section = 'profile' | 'security' | 'preferences' | 'billing' | 'activity' | 'support'

interface ActivityItem {
  id: string;
  type: 'diagnosis';
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
  isLocked = false,
  t
}: { 
  icon: any, 
  title: string, 
  subtitle: string, 
  onClick?: () => void,
  isLocked?: boolean,
  t: any
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
            <CreditCard className="w-3 h-3" /> {t('settings.coming_soon')}
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
  const { t, i18n } = useTranslation()
  const { subscription, loading: loadingSub } = useSubscription()
  const navigate = useNavigate()
  
  // App States
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Profile Data state
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    preferredLanguage: i18n.language
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
      
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload?type=avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload photo');
      }

      const { url } = await response.json();
      
      await supabase.auth.updateUser({
        data: { avatar_url: url }
      })

      setFeedback({ type: 'success', message: t('settings.photo_success') })
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
    
    // Check user metadata first for fallback
    const metadata = user.user_metadata
    
    // Fetch profile (the new canonical source for all fields)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfileData({
      fullName: (profile as any)?.full_name || metadata?.full_name || user.email?.split('@')[0] || 'User',
      phoneNumber: (profile as any)?.phone_number || metadata?.phone_number || '',
      preferredLanguage: (profile as any)?.preferred_language || metadata?.preferred_language || i18n.language
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
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          phoneNumber: profileData.phoneNumber,
          preferredLanguage: profileData.preferredLanguage
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }

      setFeedback({ type: 'success', message: t('settings.profile_success') })
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
      setFeedback({ type: 'error', message: t('settings.passwords_mismatch') })
      return
    }
    if (passFields.newPassword.length < 8) {
      setFeedback({ type: 'error', message: t('settings.password_too_short') })
      return
    }

    setFormLoading(true)
    setFeedback(null)

    const { error } = await updatePassword(passFields.newPassword)

    if (error) {
      setFeedback({ type: 'error', message: error.message })
    } else {
      setFeedback({ type: 'success', message: t('settings.password_success') })
      setPassFields({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setIsUpdatingPass(false), 1500)
    }
    setFormLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const userInitial = profileData.fullName?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase() || 'U'
  const userName = profileData.fullName || user?.email?.split('@')[0] || 'User'

  const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
      case 'diagnosis': return <ShieldAlert className="w-6 h-6 text-blue-500" />
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
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('settings.title')}</h1>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('settings.subtitle')}</p>
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
                </div>
                <p className="text-slate-500 font-medium text-base flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4 text-slate-300" /> {user?.email}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                 <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                   {t('settings.join_date')} <span className="text-slate-900 ml-1">{new Date(user?.created_at || Date.now()).getFullYear()}</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-10">
            {/* 2. Account Settings Group */}
             <div className="space-y-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">{t('settings.account_management')}</h3>
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <SettingsRow 
                  icon={User} 
                  title={t('settings.profile_details')} 
                  subtitle={t('settings.profile_details_sub')} 
                  onClick={() => setIsEditingProfile(true)}
                  t={t}
                />
                <SettingsRow 
                  icon={Shield} 
                  title={t('settings.security')} 
                  subtitle={t('settings.security_sub')} 
                  onClick={() => setIsUpdatingPass(true)}
                  t={t}
                />
                <SettingsRow 
                  icon={CreditCard} 
                  title={t('settings.billing')} 
                  subtitle={t('settings.billing_sub')} 
                  onClick={() => setActiveSection('billing')}
                  t={t}
                />
              </div>
            </div>

            {/* 3. System Preferences Group */}
            <div className="space-y-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">{t('settings.app_settings')}</h3>
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <SettingsRow 
                  icon={Globe} 
                  title={t('settings.language')} 
                  subtitle={`${t('settings.set_to')} ${profileData.preferredLanguage === 'ar' ? 'العربية' : profileData.preferredLanguage === 'fr' ? 'Français' : 'English'}`} 
                  onClick={() => setIsEditingProfile(true)}
                  t={t}
                />
                <SettingsRow 
                   icon={History} 
                   title={t('settings.activity')} 
                   subtitle={t('settings.activity_sub')} 
                   onClick={() => setActiveSection('activity')}
                   t={t}
                />
              </div>
            </div>

            {/* 4. Support & Info Group */}
            <div className="space-y-6">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400 ml-6">{t('settings.resources')}</h3>
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <SettingsRow 
                  icon={HelpCircle} 
                  title={t('settings.support')} 
                  subtitle={t('settings.support_sub')} 
                  onClick={() => setActiveSection('support')}
                  t={t}
                />
                <SettingsRow 
                  icon={Info} 
                  title={t('settings.about')} 
                  subtitle="Version 2.4.0 (Official Build)" 
                  t={t}
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
                    <p className="font-bold text-red-600 transition-colors">{t('settings.sign_out')}</p>
                    <p className="text-[11px] font-medium text-red-500/50 uppercase tracking-widest">{t('settings.end_session')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Render Activity or Support as Sheets if active */}
          <AnimatePresence>
            {activeSection === 'activity' && (
              <ContentSheet title={t('settings.history_title')} icon={History} onClose={() => setActiveSection('profile')}>
                {loadingActivity ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-navy animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('settings.updating_history')}</p>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((act) => (
                      <div key={act.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-6">
                         <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                           <ActivityIcon type={act.type} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-slate-900 truncate text-sm">{act.title}</h4>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{act.date} • {act.status}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">{t('settings.no_activity')}</div>
                )}
              </ContentSheet>
            )}

            {activeSection === 'support' && (
              <ContentSheet title={t('settings.support_title')} icon={HelpCircle} onClose={() => setActiveSection('profile')}>
                 <div className="bg-blue-50 p-8 rounded-[40px] text-center space-y-6">
                    <h3 className="text-2xl font-display font-black text-navy italic">{t('settings.need_help')}</h3>
                    <p className="text-sm text-slate-600 font-medium">{t('settings.support_desc')}</p>
                    <button className="w-full py-4 rounded-2xl bg-navy text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-navy/30">{t('settings.contact_support')}</button>
                 </div>
              </ContentSheet>
            )}
            {activeSection === 'billing' && (
              <ContentSheet title={t('settings.billing')} icon={Zap} onClose={() => setActiveSection('profile')}>
                <div className="space-y-8">
                  {/* Premium Plan Header */}
                  <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                      <Zap className="w-32 h-32 -mr-10 -mt-10" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">{t('settings.current_plan')}</p>
                    <h3 className="text-5xl font-display font-black text-slate-900 tracking-tighter uppercase italic relative z-10">
                      {loadingSub ? '...' : (subscription?.planType || 'Free')}
                    </h3>
                    
                    <div className="relative z-10">
                      {!loadingSub && subscription?.status === 'active' ? (
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t('settings.active_sub_label')}
                        </div>
                      ) : !loadingSub && subscription?.status === 'trialing' ? (
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          {t('settings.trial_period')}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black uppercase tracking-widest">
                          {subscription?.status === 'expired' ? t('settings.expired') : t('settings.standard_access')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-6 px-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('settings.status')}</p>
                      <p className="text-base font-bold text-slate-900 capitalize">{loadingSub ? '...' : (subscription?.status || 'None')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('settings.billing_cycle')}</p>
                      <p className="text-base font-bold text-slate-900 capitalize">{loadingSub ? '...' : (subscription?.billingCycle || 'One-time')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('settings.started_on')}</p>
                      <p className="text-base font-bold text-slate-900">
                        {loadingSub ? '...' : (subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {subscription?.status === 'cancelled' ? t('settings.ends_on') : t('settings.renewal_date')}
                      </p>
                      <p className="text-base font-bold text-slate-900 font-display">
                        {loadingSub ? '...' : (subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Never')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4">
                    <button 
                      onClick={() => navigate('/choose-plan', { state: { intent: 'upgrade' } })}
                      className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 hover:scale-[1.02] hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                    >
                      <Zap className="w-4 h-4" fill="currentColor" />
                      {t('settings.upgrade_plan')}
                    </button>
                    <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Managed via Car Safety Support
                    </p>
                  </div>
                </div>
              </ContentSheet>
            )}
          </AnimatePresence>
        </div>

        {/* MODALS */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingProfile(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative bg-white w-full max-w-xl rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden border-t sm:border border-slate-200">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                  <h2 className="text-2xl font-display font-black text-slate-900 italic tracking-tight">{t('settings.edit_profile')}</h2>
                  <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
               </div>
               <form id="profile-form" onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('settings.full_name')}</label>
                      <input 
                        required 
                        type="text" 
                        value={profileData.fullName} 
                        onChange={e => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('settings.phone')}</label>
                      <input 
                        type="tel" 
                        value={profileData.phoneNumber} 
                        onChange={e => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('settings.pref_lang')}</label>
                      <select 
                        value={profileData.preferredLanguage} 
                        onChange={e => {
                          const newLang = e.target.value;
                          setProfileData(prev => ({ ...prev, preferredLanguage: newLang }));
                          i18n.changeLanguage(newLang);
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all appearance-none"
                      >
                         <option value="en">English</option>
                         <option value="fr">Français</option>
                         <option value="ar">العربية</option>
                      </select>
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
                    className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 hover:scale-[1.02] hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                  >
                    {formLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {formLoading ? t('settings.saving') : t('settings.save_changes')}
                  </button>
               </form>
            </motion.div>
          </div>
        )}

        {isUpdatingPass && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUpdatingPass(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative bg-white w-full max-w-xl rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden border-t sm:border border-slate-200">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                  <h2 className="text-2xl font-display font-black text-slate-900 italic tracking-tight">{t('settings.security')}</h2>
                  <button onClick={() => setIsUpdatingPass(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
               </div>
               <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-4">
                       <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-blue-100 flex-shrink-0">
                          <Shield className="w-4 h-4 text-blue-600" />
                       </div>
                       <div className="flex-1">
                          <p className="text-[11px] text-blue-600 font-bold leading-relaxed mb-3 pt-1">{t('settings.password_security_hint')}</p>
                          <PasswordRequirement password={passFields.newPassword} />
                       </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('settings.new_password')}</label>
                      <input 
                        required 
                        type="password" 
                        value={passFields.newPassword} 
                        onChange={e => setPassFields(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('settings.confirm_password')}</label>
                      <input 
                        required 
                        type="password" 
                        value={passFields.confirmPassword} 
                        onChange={e => setPassFields(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
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
                    className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 hover:scale-[1.02] hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                  >
                    {formLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {formLoading ? t('settings.updating') : t('settings.update_password')}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
