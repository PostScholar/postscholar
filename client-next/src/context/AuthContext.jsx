'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { api, logout as apiLogout } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    const me = await api.get('/auth/me')
    setUser(me)
    return data
  }

  async function logout() {
    try {
      await apiLogout()
    } catch {
      // Clear local state even if the server call fails
    }
    setUser(null)
  }

  async function refreshUser() {
    try {
      const data = await api.get('/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}