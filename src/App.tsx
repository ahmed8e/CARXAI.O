import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import AIMechanic from './pages/AIMechanic'
import HumanMechanic from './pages/HumanMechanic'
import Towing from './pages/Towing'
import NearbyMap from './pages/NearbyMap'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
