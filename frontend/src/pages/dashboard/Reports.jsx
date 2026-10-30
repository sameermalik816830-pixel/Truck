import { useMemo } from 'react'
import { IndianRupee, Wallet, Clock, CheckCircle2 } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext.jsx'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import { formatINR, sum } from '../../utils/format.js'

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default function Reports() {
  const { owners, trucks, repairs, bills } = useAppData()

  const totals = useMemo(() => {
    const unpaid = bills.filter((b) => b.status !== 'Paid')
    const paid = bills.filter((b) => b.status === 'Paid')
    return {
      work: sum(repairs, (r) => r.cost),
      unbilled: sum(repairs.filter((r) => !r.billed), (r) => r.cost),
      outstanding: sum(unpaid, (b) => b.totalAmount),
      collected: sum(paid, (b) => b.totalAmount),
    }
  }, [repairs, bills])

  const byOwner = useMemo(
    () =>
      owners.map((o) => {
        const rs = repairs.filter((r) => r.ownerId === o.id)
        return {
          id: o.id,
          name: o.name,
          trucks: trucks.filter((t) => t.ownerId === o.id).length,
          records: rs.length,
          total: sum(rs, (r) => r.cost),
          unbilled: sum(rs.filter((r) => !r.billed), (r) => r.cost),
          outstanding: sum(bills.filter((b) => b.ownerId === o.id && b.status !== 'Paid'), (b) => b.totalAmount),
        }
      }),
    [owners, trucks, repairs, bills]
  )

  const monthly = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = monthKey(d)
      months.push({
        key,
        label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        value: sum(repairs.filter((r) => r.date.slice(0, 7) === key), (r) => r.cost),
      })
    }
    return months
  }, [repairs])
  const maxMonth = Math.max(1, ...monthly.map((m) => m.value))

  const topTrucks = useMemo(() => {
    const map = new Map()
    repairs.forEach((r) => {
      const cur = map.get(r.truckNo) ?? { truckNo: r.truckNo, records: 0, total: 0 }
      cur.records += 1
      cur.total += r.cost
      map.set(r.truckNo, cur)
    })
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5)
  }, [repairs])

  return (
    <>
      <PageHeader title="Reports" subtitle="Summary of activity across your garage" />

      <div className="stat-row four">
        <StatCard icon={<IndianRupee size={20} />} label="Total Work Value" value={formatINR(totals.work)} tone="blue" />
        <StatCard icon={<Clock size={20} />} label="Not Yet Billed" value={formatINR(totals.unbilled)} tone="orange" />
        <StatCard icon={<Wallet size={20} />} label="Outstanding (Unpaid Bills)" value={formatINR(totals.outstanding)} tone="orange" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Collected (Paid Bills)" value={formatINR(totals.collected)} tone="green" />
      </div>

      <div className="dash-two-col mb-4">
        <div className="panel-card">
          <h2 className="panel-card-title mb-3">Work Value by Owner</h2>
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Trucks</th>
                  <th>Records</th>
                  <th>Total (₹)</th>
                  <th>Not Billed (₹)</th>
                  <th>Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody>
                {byOwner.map((o) => (
                  <tr key={o.id}>
                    <td>{o.name}</td>
                    <td>{o.trucks}</td>
                    <td>{o.records}</td>
                    <td>{o.total.toLocaleString('en-IN')}</td>
                    <td>{o.unbilled.toLocaleString('en-IN')}</td>
                    <td>{o.outstanding.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {byOwner.length === 0 && (
                  <tr><td colSpan={6} className="empty-row">No owners yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <h2 className="panel-card-title mb-3">Last 6 Months</h2>
          <div className="bar-chart" role="img" aria-label="Work value for each of the last six months">
            {monthly.map((m) => (
              <div key={m.key} className="bar-col">
                <span className="bar-value">{m.value ? formatINR(m.value) : ''}</span>
                <div className="bar" style={{ height: `${(m.value / maxMonth) * 100}%` }} />
                <span className="bar-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-card">
        <h2 className="panel-card-title mb-3">Top Trucks by Repair Spend</h2>
        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr><th>Truck No.</th><th>Records</th><th>Total (₹)</th></tr>
            </thead>
            <tbody>
              {topTrucks.map((t) => (
                <tr key={t.truckNo}>
                  <td>{t.truckNo}</td>
                  <td>{t.records}</td>
                  <td>{t.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {topTrucks.length === 0 && (
                <tr><td colSpan={3} className="empty-row">No repair records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
