import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ThemePicker from './components/ThemePicker'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'

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
      {/* Routes added in E4–E7 */}
      {/* <Route path="/start" element={<Start />} /> */}
      {/* <Route path="/d/:id" element={<Discussion />} /> */}
      {/* <Route path="/verify" element={<Verify />} /> */}
      {/* <Route path="/u/:username" element={<Profile />} /> */}
      {/* <Route path="/orcid/callback" element={<OrcidCallback />} /> */}
      {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
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
