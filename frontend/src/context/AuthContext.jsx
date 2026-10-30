import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (identifier, password, captcha) => {
    const d = await api.post('/login', { identifier, password, ...captcha })
    setUser(d.user)
    return d.user
  }

  const signup = async (role, payload) => {
    const d = await api.post(role === 'garage' ? '/signup-garage-owner' : '/signup', payload)
    setUser(d.user)
    return d.user
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch {
    }
    setUser(null)
  }

  const updateProfile = async (values) => {
    const d = await api.put('/me', values)
    setUser(d.user)
    return d.user
  }

  const changePassword = (currentPassword, newPassword) =>
    api.put('/me/password', { currentPassword, newPassword })

  const uploadAvatar = async (file) => {
    const form = new FormData()
    form.append('avatar', file)
    const d = await api.putForm('/me/avatar', form)
    setUser(d.user)
    return d.user
  }

  const removeAvatar = async () => {
    const d = await api.del('/me/avatar')
    setUser(d.user)
    return d.user
  }

  const forgotPassword = (email, captcha) => api.post('/forgot-password', { email, ...captcha })
  const resetPassword = (email, otp, password) => api.post('/reset-password', { email, otp, password })

  const value = {
    user,
    loading,
    isGarage: user?.role === 'garageOwner',
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    uploadAvatar,
    removeAvatar,
    forgotPassword,
    resetPassword,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
