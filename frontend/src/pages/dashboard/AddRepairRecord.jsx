import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Formik, Form, Field, FieldArray, ErrorMessage, getIn } from 'formik'
import * as Yup from 'yup'
import { UploadCloud, Plus, Trash2 } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext.jsx'
import { FILE_BASE } from '../../api/client.js'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import { formatINR, sum, todayISO } from '../../utils/format.js'

const RepairSchema = Yup.object().shape({
  ownerId: Yup.string().required('Please select an owner'),
  truckNo: Yup.string().required('Please select a truck'),
  date: Yup.date().typeError('Enter a valid date').required('Date is required'),
  items: Yup.array()
    .of(
      Yup.object().shape({
        description: Yup.string().trim().required('Describe the work'),
        amount: Yup.number().typeError('Enter a valid price').min(0, 'Price cannot be negative').required('Enter a price'),
      })
    )
    .min(1, 'Add at least one work item'),
})

const emptyItem = () => ({ description: '', amount: '' })

export default function AddRepairRecord() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { owners, trucks, repairs, addRepair, updateRepair } = useAppData()
  const [photoFiles, setPhotoFiles] = useState([])

  const existing = isEdit ? repairs.find((r) => r.id === id) : null

  const initialValues = useMemo(
    () => ({
      ownerId: existing?.ownerId ?? '',
      truckNo: existing?.truckNo ?? '',
      date: existing?.date ?? todayISO(),
      items: existing?.items?.length ? existing.items.map((i) => ({ description: i.description, amount: i.amount })) : [emptyItem()],
    }),
    [existing]
  )

  if (isEdit && !existing) return <Navigate to="/repair-records" replace />
  if (existing?.billed) return <Navigate to="/repair-records" replace />

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus('')
    const form = new FormData()
    form.append('owner', values.ownerId)
    form.append('truckNo', values.truckNo)
    form.append('date', values.date)
    form.append(
      'items',
      JSON.stringify(values.items.map((i) => ({ description: i.description.trim(), amount: Number(i.amount) })))
    )
    photoFiles.forEach((f) => form.append('photos', f))

    try {
      if (isEdit) await updateRepair(id, form)
      else await addRepair(form)
      navigate('/repair-records')
    } catch (e) {
      setStatus(e.message)
      setSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 5) {
      window.alert('You can upload up to 5 photos at a time.')
    }
    setPhotoFiles(files.slice(0, 5))
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Repair Record' : 'Add Repair Record'}
        onBack={() => navigate('/repair-records')}
      />

      <div className="panel-card form-panel-card">
        <h2 className="panel-card-title mb-3">Repair Record Details</h2>

        <Formik enableReinitialize initialValues={initialValues} validationSchema={RepairSchema} onSubmit={handleSubmit}>
          {({ values, isSubmitting, resetForm, setFieldValue, status, errors, touched }) => {
            const ownerTrucks = trucks.filter((t) => t.ownerId === values.ownerId)
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
                        setFieldValue('truckNo', '')
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
                    <label htmlFor="truckNo" className="form-label-custom">Truck Number *</label>
                    <Field as="select" id="truckNo" name="truckNo" className="form-select" disabled={!values.ownerId}>
                      <option value="">{values.ownerId ? 'Choose a truck' : 'Select an owner first'}</option>
                      {ownerTrucks.map((t) => (
                        <option key={t.id} value={t.truckNo}>{t.truckNo}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="truckNo" component="div" className="field-error" />
                    {values.ownerId && ownerTrucks.length === 0 && (
                      <div className="field-hint">This owner has no trucks yet. Add one from the Trucks page.</div>
                    )}
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">Add Photos (Optional)</label>
                    <label className="dropzone">
                      <UploadCloud size={22} />
                      <span className="dropzone-title">Click to upload or drag and drop</span>
                      <span className="dropzone-sub">
                        {photoFiles.length > 0 ? photoFiles.map((f) => f.name).join(', ') : '(images of work done, up to 5)'}
                      </span>
                      <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
                    </label>
                    {existing?.photos?.length > 0 && (
                      <div className="field-hint">
                        Already attached:{' '}
                        {existing.photos.map((p, i) => (
                          <a key={p} className="link-accent small photo-link" href={`${FILE_BASE}${p}`} target="_blank" rel="noreferrer">
                            {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group-custom">
                    <label htmlFor="date" className="form-label-custom">Date *</label>
                    <Field type="date" id="date" name="date" className="form-control" />
                    <ErrorMessage name="date" component="div" className="field-error" />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label className="form-label-custom">Work Done &amp; Price *</label>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div className="work-entry">
                        <div className="work-entry-head">
                          <span>Work</span>
                          <span>Price (₹)</span>
                          <span />
                        </div>
                        {values.items.map((_, index) => (
                          <div key={index} className="work-entry-row">
                            <div>
                              <Field
                                name={`items.${index}.description`}
                                placeholder="e.g. Chakka repair"
                                className="form-control"
                                aria-label={`Work ${index + 1}`}
                              />
                              {getIn(touched, `items.${index}.description`) && getIn(errors, `items.${index}.description`) && (
                                <div className="field-error">{getIn(errors, `items.${index}.description`)}</div>
                              )}
                            </div>
                            <div>
                              <Field
                                type="number"
                                min="0"
                                name={`items.${index}.amount`}
                                placeholder="e.g. 1500"
                                className="form-control"
                                aria-label={`Price ${index + 1}`}
                              />
                              {getIn(touched, `items.${index}.amount`) && getIn(errors, `items.${index}.amount`) && (
                                <div className="field-error">{getIn(errors, `items.${index}.amount`)}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="work-entry-remove"
                              onClick={() => remove(index)}
                              disabled={values.items.length === 1}
                              aria-label={`Remove work ${index + 1}`}
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <div className="work-entry-foot">
                          <button type="button" className="btn-outline-sm" onClick={() => push(emptyItem())}>
                            <Plus size={15} /> Add another work
                          </button>
                          <span className="selected-total">
                            Total: <strong>{formatINR(sum(values.items, (i) => Number(i.amount) || 0))}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </FieldArray>
                  {typeof errors.items === 'string' && <div className="field-error">{errors.items}</div>}
                </div>

                {status && <div className="form-alert">{status}</div>}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-outline-sm"
                    onClick={() => {
                      resetForm()
                      setPhotoFiles([])
                    }}
                  >
                    Reset
                  </button>
                  <button type="submit" className="btn-primary-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Record'}
                  </button>
                </div>
              </Form>
            )
          }}
        </Formik>
      </div>
    </>
  )
}
