import { Link } from 'react-router-dom'
import { Users, TruckIcon, Wrench, Calendar, IndianRupee } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import { formatDate, formatINR, sum } from '../../utils/format.js'

export default function Dashboard() {
  const { isGarage } = useAuth()
  const { owners, trucks, repairs, bills } = useAppData()

  const recent = [...repairs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  const ownerName = (ownerId) => owners.find((o) => o.id === ownerId)?.name ?? '—'

  const unbilledAmount = sum(
    repairs.filter((r) => !r.billed),
    (r) => r.cost
  )
  const unpaidAmount = sum(
    bills.filter((b) => b.status !== 'Paid'),
    (b) => b.totalAmount
  )

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome to Truck Garage</p>
          </div>
        </div>
        <div className="page-header-right dash-date">
          <Calendar size={16} />
          <span>{today}</span>
        </div>
      </div>

      <div className={`stat-row ${isGarage ? 'four' : ''}`}>
        {isGarage && <StatCard icon={<Users size={20} />} label="Total Owners" value={owners.length} tone="blue" />}
        <StatCard icon={<TruckIcon size={20} />} label={isGarage ? 'Total Trucks' : 'My Trucks'} value={trucks.length} tone="green" />
        <StatCard icon={<Wrench size={20} />} label="Total Repair Records" value={repairs.length} tone="orange" />
        <StatCard
          icon={<IndianRupee size={20} />}
          label={isGarage ? 'Not Yet Billed' : 'Unpaid Bills'}
          value={formatINR(isGarage ? unbilledAmount : unpaidAmount)}
          tone="blue"
        />
      </div>

      <div className="dash-two-col">
        <div className="panel-card">
          <div className="panel-card-header">
            <h2 className="panel-card-title">Recent Repair Records</h2>
            <Link to="/repair-records" className="link-accent small">
              View All →
            </Link>
          </div>

          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {isGarage && <th>Owner</th>}
                  <th>Truck No.</th>
                  <th>Work Done</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    {isGarage && <td>{ownerName(r.ownerId)}</td>}
                    <td>{r.truckNo}</td>
                    <td className="cell-work" title={r.workDone}>
                      {r.workDone}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-row">
                      No repair records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="promo-card">
          <div className="promo-card-image" />
          <div className="promo-card-body">
            <h3>Keep Your Trucks On The Road</h3>
            <p>Reliable repair. Better performance. Happier customers.</p>
          </div>
        </div>
      </div>
    </>
  )
}
