import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import { trackPageView, setUserId, setUserProperties } from './lib/analytics'
import { useAuth } from './contexts/AuthContext'
import { useSubscription } from './hooks/useSubscription'

// ── SPA Path Persistence ───────────────────────────────────────────────────
function PathTracker() {
  const location = useLocation()
  
  useEffect(() => {
    // Only persist paths that belong to the app experience
    const isInApp = location.pathname.startsWith('/dashboard') || 
                    location.pathname.startsWith('/my-account') ||
                    location.pathname.startsWith('/admin') ||
                    location.pathname === '/choose-plan'
    
    if (isInApp) {
      localStorage.setItem('car safety.last_path', location.pathname + location.search)
    }
  }, [location])

  return null
}

// ── SPA GA4 Tracking ────────────────────────────────────────────────────────
function GA4Tracker() {
  const location = useLocation()
  
  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

// ── User Identity Tracking ──────────────────────────────────────────────────
function UserIdentityTracker() {
  const { user } = useAuth()
  const { subscription } = useSubscription()

  useEffect(() => {
    if (user) {
      setUserId(user.id)
      setUserProperties({
        plan: subscription?.planType || 'Free',
        email: user.email
      })
    }
  }, [user, subscription])

  return null
}

const SharedReport = lazy(() => import('./pages/SharedReport'))
const Landing = lazy(() => import('./pages/Landing'))
const Auth = lazy(() => import('./pages/Auth'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AIMechanic = lazy(() => import('./pages/AIMechanic'))
const HumanMechanic = lazy(() => import('./pages/HumanMechanic'))
const Towing = lazy(() => import('./pages/Towing'))
const NearbyMap = lazy(() => import('./pages/NearbyMap'))
const MyAccount = lazy(() => import('./pages/MyAccount'))
const Vehicles = lazy(() => import('./pages/Vehicles'))
const ChoosePlan = lazy(() => import('./pages/ChoosePlan'))
const LocationOnboarding = lazy(() => import('./pages/LocationOnboarding'))
const GuidesIndex = lazy(() => import('./pages/GuidesIndex'))
const GuideDetail = lazy(() => import('./pages/GuideDetail'))
const DiagnosticGuideDetail = lazy(() => import('./pages/DiagnosticGuideDetail'))
const AbsLightGuide = lazy(() => import('./pages/AbsLightGuide'))
const AvoidOverpaying = lazy(() => import('./pages/AvoidOverpaying'))

// Admin
import { AdminRoute } from './components/AdminRoute'
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'))
const AdminAddProvider = lazy(() => import('./pages/admin/AdminAddProvider'))
const AdminImportProviders = lazy(() => import('./pages/admin/AdminImportProviders'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-[3px] border-slate-100 border-t-navy rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Initializing Engine</span>
    </div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <PathTracker />
          <GA4Tracker />
          <UserIdentityTracker />

          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/report/:shareId" element={<SharedReport />} />
              <Route path="/shared-report/:token" element={<SharedReport />} />
              
              {/* Guides SEO Section */}
              <Route path="/guides" element={<GuidesIndex />} />
              <Route path="/guides/:category/car-shakes-when-braking" element={<DiagnosticGuideDetail />} />
              <Route path="/guides/car-shakes-when-braking" element={<DiagnosticGuideDetail />} />
              <Route path="/guides/warning-lights/abs-light" element={<AbsLightGuide />} />
              <Route path="/guides/:category/:slug" element={<GuideDetail />} />
              <Route path="/guides/:slug" element={<GuideDetail />} />
  
              {/* Protected app routes */}
              <Route path="/choose-plan" element={
                <ProtectedRoute>
                  <ChoosePlan />
                </ProtectedRoute>
              } />
              <Route path="/onboarding-location" element={
                <ProtectedRoute>
                  <LocationOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/ai-mechanic" element={
                <ProtectedRoute>
                  <AppLayout>
                    <AIMechanic />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/vehicles" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Vehicles />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/avoid-overpaying" element={
                <ProtectedRoute>
                  <AppLayout>
                    <AvoidOverpaying />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/mechanic" element={
                <ProtectedRoute>
                  <AppLayout>
                    <HumanMechanic />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/towing" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Towing />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/map" element={
                <ProtectedRoute>
                  <AppLayout>
                    <NearbyMap />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/my-account" element={
                <ProtectedRoute>
                  <AppLayout>
                    <MyAccount />
                  </AppLayout>
                </ProtectedRoute>
              } />
  
              {/* Admin routes — role-protected */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="providers" element={<AdminProviders />} />
                <Route path="providers/add" element={<AdminAddProvider />} />
                <Route path="providers/import" element={<AdminImportProviders />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
  
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
