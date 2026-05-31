import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Home() {
  const { user } = useAuth()
  return <p>Logged in as {user.username}</p>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}