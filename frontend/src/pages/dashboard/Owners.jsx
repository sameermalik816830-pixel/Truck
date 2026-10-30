import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Plus } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext.jsx'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import Modal from '../../components/dashboard/Modal.jsx'
import Avatar from '../../components/Avatar.jsx'
import { formatDate } from '../../utils/format.js'

const OwnerSchema = Yup.object().shape({
  name: Yup.string().trim().min(2, 'Enter at least 2 characters').required('Name is required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .required('Mobile number is required'),
  email: Yup.string().email('Enter a valid email address'),
  address: Yup.string(),
})

function OwnerForm({ owner, onClose }) {
  const { addOwner, updateOwner } = useAppData()
  const isEdit = Boolean(owner)

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus('')
    try {
      const payload = { ...values, name: values.name.trim(), email: values.email.trim(), address: values.address.trim() }
      if (isEdit) await updateOwner(owner.id, payload)
      else await addOwner(payload)
      onClose()
    } catch (e) {
      setStatus(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Owner' : 'Add Owner'} onClose={onClose}>
      <Formik
        initialValues={{
          name: owner?.name ?? '',
          phone: owner?.phone ?? '',
          email: owner?.email ?? '',
          address: owner?.address ?? '',
        }}
        validationSchema={OwnerSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status }) => (
          <Form noValidate>
            <div className="form-group-custom">
              <label htmlFor="name" className="form-label-custom">Owner Name *</label>
              <Field id="name" name="name" className="form-control" placeholder="e.g. Rajesh Transport" />
              <ErrorMessage name="name" component="div" className="field-error" />
            </div>
            <div className="form-group-custom">
              <label htmlFor="phone" className="form-label-custom">Mobile Number *</label>
              <Field id="phone" name="phone" className="form-control" placeholder="10-digit mobile number" />
              <ErrorMessage name="phone" component="div" className="field-error" />
            </div>
            <div className="form-group-custom">
              <label htmlFor="email" className="form-label-custom">
                Email <span className="optional-tag">(optional)</span>
              </label>
              <Field id="email" name="email" type="email" className="form-control" placeholder="owner@example.com" />
              <ErrorMessage name="email" component="div" className="field-error" />
            </div>
            <div className="form-group-custom">
              <label htmlFor="address" className="form-label-custom">
                Address <span className="optional-tag">(shown on bills)</span>
              </label>
              <Field id="address" name="address" className="form-control" placeholder="Town / city" />
            </div>

            {status && <div className="form-alert">{status}</div>}

            <div className="form-actions">
              <button type="button" className="btn-outline-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary-sm" disabled={isSubmitting}>
                {isEdit ? 'Save Changes' : 'Add Owner'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  )
}

export default function Owners() {
  const { owners, trucks, deleteOwner, getTrucksByOwner } = useAppData()
  const [selectedOwnerId, setSelectedOwnerId] = useState(owners[0]?.id)
  const [modal, setModal] = useState(null)

  const selectedOwner = owners.find((o) => o.id === selectedOwnerId) ?? owners[0]
  const ownerTrucks = selectedOwner ? getTrucksByOwner(selectedOwner.id) : []

  const handleDelete = async (owner) => {
    if (!window.confirm(`Delete ${owner.name}? This cannot be undone.`)) return
    try {
      await deleteOwner(owner.id)
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Owners"
        subtitle="Manage truck owners and their vehicles"
        right={
          <button type="button" className="btn-primary-sm" onClick={() => setModal({})}>
            <Plus size={16} /> Add Owner
          </button>
        }
      />

      {owners.length === 0 ? (
        <div className="panel-card empty-state">
          <p className="empty-state-text">No owners yet. Add your first truck owner to start recording repairs.</p>
        </div>
      ) : (
        <div className="owner-card-grid">
          {owners.map((owner) => {
            const count = trucks.filter((t) => t.ownerId === owner.id).length
            return (
              <div key={owner.id} className={`owner-card ${owner.id === selectedOwner?.id ? 'active' : ''}`}>
                <div className="owner-card-top">
                  <span className="owner-avatar">
                    <Avatar src={owner.avatar} name={owner.name} size={42} />
                  </span>
                  <div>
                    <div className="owner-name">{owner.name}</div>
                    <div className="owner-truck-count">
                      {owner.phone} · Total Trucks: {count}
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-primary-sm full" onClick={() => setSelectedOwnerId(owner.id)}>
                  View Trucks
                </button>
                <div className="owner-card-actions">
                  <button type="button" className="link-accent small" onClick={() => setModal({ owner })}>Edit</button>
                  <button type="button" className="link-danger small" onClick={() => handleDelete(owner)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedOwner && (
        <div className="panel-card">
          <div className="panel-card-header">
            <h2 className="panel-card-title">Trucks under {selectedOwner.name}</h2>
            <Link to="/trucks" className="link-accent small">View All Trucks →</Link>
          </div>

          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Truck No.</th>
                  <th>Model</th>
                  <th>Last Service Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ownerTrucks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.truckNo}</td>
                    <td>{t.model || '—'}</td>
                    <td>{formatDate(t.lastServiceDate)}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
                {ownerTrucks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-row">No trucks added for this owner yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && <OwnerForm owner={modal.owner} onClose={() => setModal(null)} />}
    </>
  )
}
