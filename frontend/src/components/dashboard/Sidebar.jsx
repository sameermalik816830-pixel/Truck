import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Truck,
  LayoutDashboard,
  Users,
  Wrench,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../Avatar.jsx'

const garageNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/owners', label: 'Owners', icon: Users },
  { to: '/trucks', label: 'Trucks', icon: Truck },
  { to: '/repair-records', label: 'Repair Records', icon: Wrench },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

const ownerNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trucks', label: 'My Trucks', icon: Truck },
  { to: '/repair-records', label: 'Repair Records', icon: Wrench },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const { user, isGarage, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = isGarage ? garageNav : ownerNav

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="dash-sidebar">
      <div className="dash-brand">
        <span className="dash-brand-icon">
          <Truck size={20} strokeWidth={2.2} />
        </span>
        <div>
          <div className="dash-brand-name">Truck Garage</div>
          <div className="dash-brand-tagline">Repair • Maintain • Keep Moving</div>
        </div>
      </div>

      <nav className="dash-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="dash-profile-wrap">
        {menuOpen && (
          <div className="dash-profile-menu">
            <button type="button" onClick={handleLogout}>
              <LogOut size={16} /> <span>Log out</span>
            </button>
          </div>
        )}
        <button type="button" className="dash-profile" onClick={() => setMenuOpen((o) => !o)}>
          <span className="dash-profile-icon">
            <Avatar src={user?.avatar} name={user?.name} size={32} />
          </span>
          <span className="dash-profile-text">
            <span className="dash-profile-name">{user?.name}</span>
            <span className="dash-profile-role">{isGarage ? 'Garage Owner' : 'Truck Owner'}</span>
          </span>
          <ChevronDown size={16} className="dash-profile-chevron" />
        </button>
      </div>
    </aside>
  )
}
