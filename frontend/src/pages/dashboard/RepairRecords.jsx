import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { FILE_BASE } from '../../api/client.js'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import WorkItems from '../../components/WorkItems.jsx'
import { formatDate } from '../../utils/format.js'

const PAGE_SIZE = 6

export default function RepairRecords() {
  const { isGarage } = useAuth()
  const { repairs, owners, deleteRepair } = useAppData()
  const navigate = useNavigate()

  const [ownerFilter, setOwnerFilter] = useState('all')
  const [billFilter, setBillFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const ownerName = (ownerId) => owners.find((o) => o.id === ownerId)?.name ?? '—'

  const filtered = useMemo(() => {
    let list = [...repairs].sort((a, b) => new Date(b.date) - new Date(a.date))
    if (ownerFilter !== 'all') list = list.filter((r) => r.ownerId === ownerFilter)
    if (billFilter === 'billed') list = list.filter((r) => r.billed)
    if (billFilter === 'unbilled') list = list.filter((r) => !r.billed)
    if (fromDate) list = list.filter((r) => r.date >= fromDate)
    if (toDate) list = list.filter((r) => r.date <= toDate)
    return list
  }, [repairs, ownerFilter, billFilter, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const colCount = isGarage ? 8 : 6

  const resetPageThen = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this repair record? This cannot be undone.')) return
    try {
      await deleteRepair(id)
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Repair Records"
        subtitle={isGarage ? 'View and manage all truck repair records' : 'Work done on your trucks'}
        right={
          isGarage && (
            <button type="button" className="btn-primary-sm" onClick={() => navigate('/repair-records/add')}>
              <Plus size={16} /> Add Record
            </button>
          )
        }
      />

      <div className="panel-card">
        <div className="table-filters">
          <div className="filter-group">
            {isGarage && (
              <select className="form-select filter-select" value={ownerFilter} onChange={resetPageThen(setOwnerFilter)}>
                <option value="all">All Owners</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
            <select className="form-select filter-select" value={billFilter} onChange={resetPageThen(setBillFilter)}>
              <option value="all">Billed &amp; Unbilled</option>
              <option value="unbilled">Unbilled only</option>
              <option value="billed">Billed only</option>
            </select>
          </div>

          <div className="date-range-filter">
            <Calendar size={15} />
            <input type="date" className="form-control date-input" value={fromDate} onChange={resetPageThen(setFromDate)} />
            <span>to</span>
            <input type="date" className="form-control date-input" value={toDate} onChange={resetPageThen(setToDate)} />
          </div>
        </div>

        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Date</th>
                {isGarage && <th>Owner</th>}
                <th>Truck No.</th>
                <th>Work Done</th>
                <th>Total (₹)</th>
                <th>Billing</th>
                <th>Photos</th>
                {isGarage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  {isGarage && <td>{ownerName(r.ownerId)}</td>}
                  <td>{r.truckNo}</td>
                  <td className="cell-work-items"><WorkItems items={r.items} /></td>
                  <td>{r.cost.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={r.billed ? 'Billed' : 'Unbilled'} /></td>
                  <td>
                    {r.photos.length === 0
                      ? '—'
                      : r.photos.map((p, i) => (
                          <a key={p} className="link-accent small photo-link" href={`${FILE_BASE}${p}`} target="_blank" rel="noreferrer">
                            {i + 1}
                          </a>
                        ))}
                  </td>
                  {isGarage && (
                    <td>
                      {r.billed ? (
                        <span className="locked-note" title="Delete the bill to edit this record">On a bill</span>
                      ) : (
                        <div className="row-actions">
                          <button type="button" className="link-accent small" onClick={() => navigate(`/repair-records/edit/${r.id}`)}>Edit</button>
                          <button type="button" className="link-danger small" onClick={() => handleDelete(r.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={colCount + 1} className="empty-row">No repair records match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-summary">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} records
          </span>
          <div className="pagination-controls">
            <button type="button" className="page-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className={`page-btn ${n === currentPage ? 'active' : ''}`} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
            <button type="button" className="page-btn" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page">›</button>
          </div>
        </div>
      </div>
    </>
  )
}
