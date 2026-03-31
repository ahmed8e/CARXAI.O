import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ForgotPassword from './pages/ForgotPassword'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Dashboard from './pages/Dashboard'
import AIMechanic from './pages/AIMechanic'
import HumanMechanic from './pages/HumanMechanic'
import Towing from './pages/Towing'
import NearbyMap from './pages/NearbyMap'
import MyAccount from './pages/MyAccount'
import Vehicles from './pages/Vehicles'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
            <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Protected app routes */}
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

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
