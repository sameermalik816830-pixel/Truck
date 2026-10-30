import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useAppData } from '../../context/AppDataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import WorkItems from '../../components/WorkItems.jsx'
import usePayBill from '../../hooks/usePayBill.js'
import { formatDate, formatINR, sum, todayISO } from '../../utils/format.js'

const BillSchema = Yup.object().shape({
  ownerId: Yup.string().required('Please select an owner'),
  billDate: Yup.date().typeError('Enter a valid date').required('Bill date is required'),
  repairIds: Yup.array().min(1, 'Select at least one repair record'),
})

function BillGenerator() {
  const { owners, repairs, getUnbilledRepairs, billDraft, setBillDraft } = useAppData()
  const navigate = useNavigate()

  const firstWithWork = owners.find((o) => getUnbilledRepairs(o.id).length > 0)
  const initialValues = billDraft ?? {
    ownerId: firstWithWork?.id ?? '',
    billDate: todayISO(),
    repairIds: firstWithWork ? getUnbilledRepairs(firstWithWork.id).map((r) => r.id) : [],
  }

  const handlePreview = (values) => {
    setBillDraft(values)
    navigate('/bills/preview')
  }

  return (
    <div className="panel-card form-panel-card mb-4">
      <h2 className="panel-card-title mb-3">Generate Bill</h2>
      <Formik initialValues={initialValues} validationSchema={BillSchema} onSubmit={handlePreview}>
        {({ values, setFieldValue }) => {
          const unbilled = getUnbilledRepairs(values.ownerId).sort((a, b) =>
            a.truckNo === b.truckNo ? new Date(a.date) - new Date(b.date) : a.truckNo.localeCompare(b.truckNo)
          )
          const selectedTotal = sum(
            repairs.filter((r) => values.repairIds.includes(r.id)),
            (r) => r.cost
          )

          return (
            <Form noValidate>
              <div className="form-grid-2">
                <div className="form-group-custom">
                  <label htmlFor="ownerId" className="form-label-custom">Select Owner *</label>
                  <Field
                    as="select"
                    id="ownerId"
                    name="ownerId"
                    className="form-select"
                    onChange={(e) => {
                      setFieldValue('ownerId', e.target.value)
                      setFieldValue('repairIds', getUnbilledRepairs(e.target.value).map((r) => r.id))
                    }}
                  >
                    <option value="">Choose an owner</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="ownerId" component="div" className="field-error" />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="billDate" className="form-label-custom">Bill Date *</label>
                  <Field type="date" id="billDate" name="billDate" className="form-control" />
                  <ErrorMessage name="billDate" component="div" className="field-error" />
                </div>
              </div>

              <div className="form-group-custom">
                <div className="select-head">
                  <span className="form-label-custom mb-0">
                    Unbilled Repair Records <span className="optional-tag">(tick the ones to include)</span>
                  </span>
                  {unbilled.length > 0 && (
                    <span className="select-head-actions">
                      <button type="button" className="link-accent small" onClick={() => setFieldValue('repairIds', unbilled.map((r) => r.id))}>Select all</button>
                      <button type="button" className="link-accent small" onClick={() => setFieldValue('repairIds', [])}>Clear</button>
                    </span>
                  )}
                </div>

                <div className="truck-checkbox-list">
                  {!values.ownerId && <div className="empty-row">Choose an owner to see their unbilled work.</div>}
                  {values.ownerId && unbilled.length === 0 && (
                    <div className="empty-row">Nothing to bill. All records for this owner are already on a bill.</div>
                  )}
                  {unbilled.map((r) => (
                    <label key={r.id} className="truck-checkbox repair-check">
                      <Field type="checkbox" name="repairIds" value={r.id} />
                      <span className="rc-truck">{r.truckNo}</span>
                      <span className="rc-date">{formatDate(r.date)}</span>
                      <span className="rc-work"><WorkItems items={r.items} /></span>
                      <span className="rc-amount">{formatINR(r.cost)}</span>
                    </label>
                  ))}
                </div>
                <ErrorMessage name="repairIds" component="div" className="field-error" />
              </div>

              <div className="form-actions align-center">
                <span className="selected-total">Selected total: <strong>{formatINR(selectedTotal)}</strong></span>
                <button type="submit" className="btn-primary-sm">Preview Bill</button>
              </div>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}

export default function Bills() {
  const { isGarage } = useAuth()
  const { bills, owners, updateBill, deleteBill } = useAppData()
  const navigate = useNavigate()
  const { pay, payingId, notice } = usePayBill()

  const ownerName = (b) => owners.find((o) => o.id === b.ownerId)?.name ?? b.owner?.name ?? '—'

  const toggleStatus = async (b) => {
    try {
      await updateBill(b.id, { status: b.status === 'Paid' ? 'Unpaid' : 'Paid' })
    } catch (e) {
      window.alert(e.message)
    }
  }

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete bill ${b.billNo}? Its repair records will become unbilled again.`)) return
    try {
      await deleteBill(b.id)
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Bills"
        subtitle={isGarage ? 'Create a bill for an owner covering all their truck repairs' : 'Bills raised for your trucks'}
      />

      {notice && <div className={notice.type === 'success' ? 'form-success' : 'form-alert'}>{notice.text}</div>}

      {isGarage && <BillGenerator />}

      <div className="panel-card">
        <div className="panel-card-header">
          <h2 className="panel-card-title">{isGarage ? 'Previous Bills' : 'Your Bills'}</h2>
        </div>
        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Bill No.</th>
                {isGarage && <th>Owner</th>}
                <th>Date</th>
                <th>Work Items</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id}>
                  <td>{b.billNo}</td>
                  {isGarage && <td>{ownerName(b)}</td>}
                  <td>{formatDate(b.billDate)}</td>
                  <td>{b.items.length}</td>
                  <td>{b.totalAmount.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="link-accent small" onClick={() => navigate(`/bills/${b.id}`)}>View</button>
                      {!isGarage && b.status === 'Unpaid' && (
                        <button type="button" className="btn-primary-sm" disabled={payingId === b.id} onClick={() => pay(b)}>
                          {payingId === b.id ? 'Opening…' : `Pay ${formatINR(b.totalAmount)}`}
                        </button>
                      )}
                      {isGarage && (
                        <>
                          <button type="button" className="link-accent small" onClick={() => toggleStatus(b)}>
                            {b.status === 'Paid' ? 'Mark unpaid' : 'Mark paid'}
                          </button>
                          <button type="button" className="link-danger small" onClick={() => handleDelete(b)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={isGarage ? 7 : 6} className="empty-row">No bills yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
