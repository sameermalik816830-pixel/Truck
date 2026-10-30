import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useAppData } from '../../context/AppDataContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import Modal from '../../components/dashboard/Modal.jsx'
import { formatDate } from '../../utils/format.js'

const TruckSchema = Yup.object().shape({
  ownerId: Yup.string().required('Please select an owner'),
  truckNo: Yup.string().trim().min(4, 'Enter the full truck number').required('Truck number is required'),
  model: Yup.string(),
  status: Yup.string().oneOf(['Active', 'Inactive']).required(),
})

function TruckForm({ truck, onClose }) {
  const { owners, addTruck, updateTruck } = useAppData()
  const isEdit = Boolean(truck)

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus('')
    const payload = {
      owner: values.ownerId,
      truckNo: values.truckNo.trim().toUpperCase(),
      model: values.model.trim(),
      status: values.status,
    }
    try {
      if (isEdit) await updateTruck(truck.id, payload)
      else await addTruck(payload)
      onClose()
    } catch (e) {
      setStatus(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Truck' : 'Add Truck'} onClose={onClose}>
      <Formik
        initialValues={{
          ownerId: truck?.ownerId ?? '',
          truckNo: truck?.truckNo ?? '',
          model: truck?.model ?? '',
          status: truck?.status ?? 'Active',
        }}
        validationSchema={TruckSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status }) => (
          <Form noValidate>
            <div className="form-group-custom">
              <label htmlFor="ownerId" className="form-label-custom">Owner *</label>
              <Field as="select" id="ownerId" name="ownerId" className="form-select">
                <option value="">{owners.length ? 'Choose an owner' : 'Add an owner first'}</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Field>
              <ErrorMessage name="ownerId" component="div" className="field-error" />
            </div>
            <div className="form-group-custom">
              <label htmlFor="truckNo" className="form-label-custom">Truck Number *</label>
              <Field id="truckNo" name="truckNo" className="form-control" placeholder="e.g. HR 58 B 1234" />
              <ErrorMessage name="truckNo" component="div" className="field-error" />
            </div>
            <div className="form-group-custom">
              <label htmlFor="model" className="form-label-custom">Model</label>
              <Field id="model" name="model" className="form-control" placeholder="e.g. Tata 1613" />
            </div>
            <div className="form-group-custom">
              <label htmlFor="status" className="form-label-custom">Status</label>
              <Field as="select" id="status" name="status" className="form-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Field>
            </div>

            {status && <div className="form-alert">{status}</div>}

            <div className="form-actions">
              <button type="button" className="btn-outline-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary-sm" disabled={isSubmitting}>
                {isEdit ? 'Save Changes' : 'Add Truck'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  )
}

export default function Trucks() {
  const { isGarage } = useAuth()
  const { trucks, owners, deleteTruck } = useAppData()
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const ownerName = (ownerId) => owners.find((o) => o.id === ownerId)?.name ?? '—'

  const filtered = useMemo(
    () => (ownerFilter === 'all' ? trucks : trucks.filter((t) => t.ownerId === ownerFilter)),
    [trucks, ownerFilter]
  )

  const handleDelete = async (truck) => {
    if (!window.confirm(`Delete truck ${truck.truckNo}?`)) return
    try {
      await deleteTruck(truck.id)
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title={isGarage ? 'Trucks' : 'My Trucks'}
        subtitle={isGarage ? 'All trucks registered across your owners' : 'Trucks registered under your name'}
        right={
          isGarage && (
            <button type="button" className="btn-primary-sm" onClick={() => setModal({})}>
              <Plus size={16} /> Add Truck
            </button>
          )
        }
      />

      <div className="panel-card">
        <div className="panel-card-header">
          <h2 className="panel-card-title">{isGarage ? 'All Trucks' : 'Trucks'}</h2>
          {isGarage && (
            <select className="form-select filter-select" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
              <option value="all">All Owners</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Truck No.</th>
                <th>Model</th>
                {isGarage && <th>Owner</th>}
                <th>Last Service Date</th>
                <th>Status</th>
                {isGarage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.truckNo}</td>
                  <td>{t.model || '—'}</td>
                  {isGarage && <td>{ownerName(t.ownerId)}</td>}
                  <td>{formatDate(t.lastServiceDate)}</td>
                  <td><StatusBadge status={t.status} /></td>
                  {isGarage && (
                    <td>
                      <div className="row-actions">
                        <button type="button" className="link-accent small" onClick={() => setModal({ truck: t })}>Edit</button>
                        <button type="button" className="link-danger small" onClick={() => handleDelete(t)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isGarage ? 6 : 4} className="empty-row">No trucks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <TruckForm truck={modal.truck} onClose={() => setModal(null)} />}
    </>
  )
}
