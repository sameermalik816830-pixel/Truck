import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { ProtectedRoute, GuestRoute, GarageRoute } from './components/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import Owners from './pages/dashboard/Owners.jsx'
import Trucks from './pages/dashboard/Trucks.jsx'
import RepairRecords from './pages/dashboard/RepairRecords.jsx'
import AddRepairRecord from './pages/dashboard/AddRepairRecord.jsx'
import Bills from './pages/dashboard/Bills.jsx'
import BillPreview from './pages/dashboard/BillPreview.jsx'
import Reports from './pages/dashboard/Reports.jsx'
import Settings from './pages/dashboard/Settings.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <AppDataProvider>
                  <DashboardLayout />
                </AppDataProvider>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trucks" element={<Trucks />} />
              <Route path="/repair-records" element={<RepairRecords />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/bills/:id" element={<BillPreview />} />
              <Route path="/settings" element={<Settings />} />

              <Route element={<GarageRoute />}>
                <Route path="/owners" element={<Owners />} />
                <Route path="/repair-records/add" element={<AddRepairRecord />} />
                <Route path="/repair-records/edit/:id" element={<AddRepairRecord />} />
                <Route path="/bills/preview" element={<BillPreview />} />
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
