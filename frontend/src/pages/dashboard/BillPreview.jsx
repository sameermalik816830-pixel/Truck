import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Truck, Printer, Save, CreditCard } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import usePayBill from '../../hooks/usePayBill.js'
import { formatDate, formatINR, sum } from '../../utils/format.js'

export default function BillPreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isGarage } = useAuth()
  const { billDraft, setBillDraft, owners, repairs, bills, createBill, updateBill } = useAppData()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { pay, payingId, notice } = usePayBill()

  const saved = id ? bills.find((b) => b.id === id) : null

  const view = useMemo(() => {
    if (saved) {
      return {
        billNo: saved.billNo,
        billDate: saved.billDate,
        ownerId: saved.ownerId,
        ownerObj: typeof saved.owner === 'object' ? saved.owner : null,
        status: saved.status,
        paidAt: saved.paidAt,
        paymentMethod: saved.paymentMethod,
        paymentId: saved.paymentId,
        items: saved.items,
      }
    }
    if (!id && billDraft) {
      const items = repairs
        .filter((r) => billDraft.repairIds.includes(r.id))
        .sort((a, b) => (a.truckNo === b.truckNo ? new Date(a.date) - new Date(b.date) : a.truckNo.localeCompare(b.truckNo)))
        .flatMap((r) => r.items.map((i) => ({ truckNo: r.truckNo, date: r.date, workDone: i.description, amount: i.amount })))
      return { billNo: null, billDate: billDraft.billDate, ownerId: billDraft.ownerId, ownerObj: null, status: null, items }
    }
    return null
  }, [saved, id, billDraft, repairs])

  if (!view || view.items.length === 0) return <Navigate to="/bills" replace />

  const owner = owners.find((o) => o.id === view.ownerId) ?? view.ownerObj
  if (!owner) return <Navigate to="/bills" replace />

  const total = sum(view.items, (i) => i.amount)
  const isDraft = !saved

  const handleSave = async () => {
    setBusy(true)
    setError('')
    try {
      const bill = await createBill({
        owner: billDraft.ownerId,
        billDate: billDraft.billDate,
        repairIds: billDraft.repairIds,
      })
      navigate(`/bills/${bill.id}`, { replace: true })
      setBillDraft(null)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const toggleStatus = async () => {
    setBusy(true)
    try {
      await updateBill(saved.id, { status: saved.status === 'Paid' ? 'Unpaid' : 'Paid' })
    } catch (e) {
      setError(e.message)
    }
    setBusy(false)
  }

  return (
    <>
      <div className="page-header no-print">
        <div className="page-header-left">
          <button type="button" className="back-btn" onClick={() => navigate('/bills')} aria-label="Back to bills">←</button>
          <div>
            <h1 className="page-title">{isDraft ? 'Bill Preview' : `Bill ${view.billNo}`}</h1>
            <p className="page-subtitle">
              {isDraft ? 'Review the bill, then save it to record it against these repairs' : 'Print it or save it as a PDF from the print dialog'}
            </p>
          </div>
        </div>
        <div className="page-header-right">
          <button type="button" className="btn-outline-sm" onClick={() => window.print()}>
            <Printer size={16} /> Print / Save PDF
          </button>
          {isDraft && (
            <button type="button" className="btn-primary-sm" onClick={handleSave} disabled={busy}>
              <Save size={16} /> {busy ? 'Saving…' : 'Save Bill'}
            </button>
          )}
          {!isDraft && !isGarage && saved.status === 'Unpaid' && (
            <button type="button" className="btn-primary-sm" onClick={() => pay(saved)} disabled={payingId === saved.id}>
              <CreditCard size={16} /> {payingId === saved.id ? 'Opening…' : `Pay ${formatINR(saved.totalAmount)} Online`}
            </button>
          )}
          {!isDraft && isGarage && (
            <button type="button" className="btn-primary-sm" onClick={toggleStatus} disabled={busy}>
              {saved.status === 'Paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="form-alert no-print">{error}</div>}
      {notice && <div className={`${notice.type === 'success' ? 'form-success' : 'form-alert'} no-print`}>{notice.text}</div>}

      <div className="bill-sheet">
        <div className="bill-sheet-header">
          <div className="bill-brand">
            <span className="bill-brand-icon"><Truck size={22} /></span>
            <div>
              <div className="bill-brand-name">Truck Garage</div>
              <div className="bill-brand-tagline">Repair • Maintain • Keep Moving</div>
            </div>
          </div>
          <div className="bill-meta">
            <div><strong>Bill No:</strong> {view.billNo ?? 'Draft'}</div>
            <div><strong>Date:</strong> {formatDate(view.billDate)}</div>
            {view.status && (
              <div className="no-print"><StatusBadge status={view.status} /></div>
            )}
          </div>
        </div>

        <h2 className="bill-heading">SERVICE BILL</h2>

        <div className="bill-to">
          <div className="bill-to-label">To,</div>
          <div className="bill-to-name">{owner.name}</div>
          {owner.address && <div className="bill-to-line">{owner.address}</div>}
          {owner.phone && <div className="bill-to-line">Mobile: {owner.phone}</div>}
        </div>

        <table className="bill-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Truck No.</th>
              <th>Date</th>
              <th>Work Done</th>
              <th className="text-end">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {view.items.map((item, idx) => (
              <tr key={`${item.truckNo}-${idx}`}>
                <td>{idx + 1}</td>
                <td>{item.truckNo}</td>
                <td>{formatDate(item.date)}</td>
                <td>{item.workDone}</td>
                <td className="text-end">{item.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-end total-label">Total Amount</td>
              <td className="text-end total-value">{total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        {view.status === 'Paid' && (
          <div className="bill-paid-note">
            PAID{view.paidAt ? ` on ${formatDate(view.paidAt)}` : ''}
            {view.paymentMethod === 'Online' ? ' · Online (Razorpay)' : view.paymentMethod === 'Manual' ? ' · Paid at garage' : ''}
            {view.paymentId ? ` · Ref: ${view.paymentId}` : ''}
          </div>
        )}

        <div className="bill-footer">
          <span>Thank you for your business!</span>
          <span className="bill-signature">Truck Garage</span>
        </div>
      </div>
    </>
  )
}
