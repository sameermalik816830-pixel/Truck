import { Outlet } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

export default function DashboardLayout() {
  const { loading, loaded, error, refresh } = useAppData()

  return (
    <div className="dash-shell">
      <Sidebar />
      <main className="dash-main">
        <div className="dash-main-inner">
          {loading && !loaded ? (
            <div className="app-loading">Loading your data…</div>
          ) : !loaded ? (
            <div className="panel-card empty-state">
              <p className="empty-state-text">{error || 'Could not load data.'}</p>
              <button type="button" className="btn-primary-sm mt-3" onClick={refresh}>
                Try again
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  )
}
