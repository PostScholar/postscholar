import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ThemePicker from './components/ThemePicker'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Discussion from './pages/Discussion'
import Start from './pages/Start'
import Verify from './pages/Verify'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OrcidCallback from './pages/OrcidCallback'

/*
 * ProtectedRoute — redirects to /login if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/d/:id" element={<Discussion />} />
      {/* Routes added in E4–E7 */}
      <Route path="/verify" element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/orcid/callback" element={<OrcidCallback />} />
      {/*<Route path="/u/:username" element={<Profile />} /> */}
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        {/* ThemePicker — remove before launch */}
        <ThemePicker />
      </BrowserRouter>
    </AuthProvider>
  )
}
