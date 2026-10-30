import { useRef, useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Avatar from '../../components/Avatar.jsx'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const ProfileSchema = Yup.object().shape({
  name: Yup.string().trim().min(2, 'Enter at least 2 characters').required('Name is required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .required('Mobile number is required'),
  email: Yup.string().email('Enter a valid email address'),
  address: Yup.string(),
})

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm the new password'),
})

export default function Settings() {
  const { user, isGarage, updateProfile, changePassword, uploadAvatar, removeAvatar } = useAuth()
  const fileInput = useRef(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState(null)

  const pickAvatar = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) return setAvatarMsg({ ok: false, text: 'Please choose a JPG, PNG or WebP image.' })
    if (file.size > MAX_AVATAR_BYTES) return setAvatarMsg({ ok: false, text: 'The image must be 2 MB or smaller.' })
    setAvatarBusy(true)
    setAvatarMsg(null)
    try {
      await uploadAvatar(file)
      setAvatarMsg({ ok: true, text: 'Profile picture updated.' })
    } catch (err) {
      setAvatarMsg({ ok: false, text: err.message })
    }
    setAvatarBusy(false)
  }

  const clearAvatar = async () => {
    setAvatarBusy(true)
    setAvatarMsg(null)
    try {
      await removeAvatar()
      setAvatarMsg({ ok: true, text: 'Profile picture removed.' })
    } catch (err) {
      setAvatarMsg({ ok: false, text: err.message })
    }
    setAvatarBusy(false)
  }

  const saveProfile = async (values, { setSubmitting, setStatus }) => {
    setStatus(null)
    try {
      await updateProfile({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
      })
      setStatus({ ok: true, text: 'Profile updated.' })
    } catch (e) {
      setStatus({ ok: false, text: e.message })
    }
    setSubmitting(false)
  }

  const savePassword = async (values, { setSubmitting, setStatus, resetForm }) => {
    setStatus(null)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      resetForm()
      setStatus({ ok: true, text: 'Password changed.' })
    } catch (e) {
      setStatus({ ok: false, text: e.message })
    }
    setSubmitting(false)
  }

  const Notice = ({ status }) =>
    status ? <div className={status.ok ? 'form-success' : 'form-alert'}>{status.text}</div> : null

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle={isGarage ? 'Manage your garage profile and preferences' : 'Manage your profile and password'}
      />

      <div className="settings-grid">
        <div className="settings-col">
        <div className="panel-card">
          <h2 className="panel-card-title mb-3">Profile Picture</h2>
          <div className="avatar-editor">
            <span className="avatar-preview">
              <Avatar src={user.avatar} name={user.name} size={96} />
            </span>
            <div>
              <div className="avatar-actions">
                <button type="button" className="btn-primary-sm" disabled={avatarBusy} onClick={() => fileInput.current?.click()}>
                  {avatarBusy ? 'Working…' : user.avatar ? 'Change Photo' : 'Upload Photo'}
                </button>
                {user.avatar && (
                  <button type="button" className="btn-outline-sm" disabled={avatarBusy} onClick={clearAvatar}>
                    Remove
                  </button>
                )}
              </div>
              <div className="field-hint">JPG, PNG or WebP, up to 2 MB.</div>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickAvatar} />
            </div>
          </div>
          {avatarMsg && <div className={avatarMsg.ok ? 'form-success mt-3' : 'form-alert mt-3'}>{avatarMsg.text}</div>}
        </div>
        <div className="panel-card">
          <h2 className="panel-card-title mb-3">Profile</h2>
          <Formik
            enableReinitialize
            initialValues={{
              name: user.name ?? '',
              phone: user.phone ?? '',
              email: user.email ?? '',
              address: user.address ?? '',
            }}
            validationSchema={ProfileSchema}
            onSubmit={saveProfile}
          >
            {({ isSubmitting, status }) => (
              <Form noValidate>
                <div className="form-group-custom">
                  <label htmlFor="name" className="form-label-custom">{isGarage ? 'Garage / Owner Name' : 'Name'} *</label>
                  <Field id="name" name="name" className="form-control" />
                  <ErrorMessage name="name" component="div" className="field-error" />
                </div>
                <div className="form-group-custom">
                  <label htmlFor="phone" className="form-label-custom">Mobile Number *</label>
                  <Field id="phone" name="phone" className="form-control" />
                  <ErrorMessage name="phone" component="div" className="field-error" />
                </div>
                <div className="form-group-custom">
                  <label htmlFor="email" className="form-label-custom">Email</label>
                  <Field id="email" name="email" type="email" className="form-control" />
                  <ErrorMessage name="email" component="div" className="field-error" />
                </div>
                <div className="form-group-custom">
                  <label htmlFor="address" className="form-label-custom">Address</label>
                  <Field id="address" name="address" className="form-control" />
                </div>
                {!isGarage && user.aadhaarLast4 && (
                  <div className="form-group-custom">
                    <span className="form-label-custom">Aadhaar Number</span>
                    <div className="field-readonly">XXXX XXXX {user.aadhaarLast4}</div>
                    <div className="field-hint">Given at sign up. It can&apos;t be changed here.</div>
                  </div>
                )}
                <Notice status={status} />
                <div className="form-actions">
                  <button type="submit" className="btn-primary-sm" disabled={isSubmitting}>Save Changes</button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
        </div>

        <div className="settings-col">
        <div className="panel-card">
          <h2 className="panel-card-title mb-3">Change Password</h2>
          <Formik
            initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
            validationSchema={PasswordSchema}
            onSubmit={savePassword}
          >
            {({ isSubmitting, status }) => (
              <Form noValidate>
                <div className="form-group-custom">
                  <label htmlFor="currentPassword" className="form-label-custom">Current Password *</label>
                  <Field id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className="form-control" />
                  <ErrorMessage name="currentPassword" component="div" className="field-error" />
                </div>
                <div className="form-group-custom">
                  <label htmlFor="newPassword" className="form-label-custom">New Password *</label>
                  <Field id="newPassword" name="newPassword" type="password" autoComplete="new-password" className="form-control" />
                  <ErrorMessage name="newPassword" component="div" className="field-error" />
                </div>
                <div className="form-group-custom">
                  <label htmlFor="confirmPassword" className="form-label-custom">Confirm New Password *</label>
                  <Field id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="form-control" />
                  <ErrorMessage name="confirmPassword" component="div" className="field-error" />
                </div>
                <Notice status={status} />
                <div className="form-actions">
                  <button type="submit" className="btn-primary-sm" disabled={isSubmitting}>Update Password</button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
        </div>
      </div>
    </>
  )
}
