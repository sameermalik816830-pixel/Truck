import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const Spinner = () => <div className="app-loading">Loading…</div>

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export function GarageRoute() {
  const { isGarage } = useAuth()
  return isGarage ? <Outlet /> : <Navigate to="/dashboard" replace />
}
