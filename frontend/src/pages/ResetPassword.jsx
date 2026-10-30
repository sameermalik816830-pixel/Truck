import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import AuthHero from '../components/AuthHero.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const ResetSchema = Yup.object().shape({
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  otp: Yup.string().trim().matches(/^\d{6}$/, 'Enter the 6-digit OTP').required('OTP is required'),
  password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
})

export default function ResetPassword() {
  const location = useLocation()
  const initialEmail = (location.state && location.state.email) || ''
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus('')
    try {
      await resetPassword(values.email.trim(), values.otp.trim(), values.password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (e) {
      setStatus(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthHero mode="login" />

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">Enter the OTP sent to your email and choose a new password</p>

            {done ? (
              <>
                <div className="form-success">Password updated. Taking you to login…</div>
                <Link to="/login" className="btn-primary-custom" style={{ textDecoration: 'none' }}>
                  Go to Login <ArrowRight size={18} />
                </Link>
              </>
            ) : (
              <Formik initialValues={{ email: initialEmail, otp: '', password: '', confirmPassword: '' }} validationSchema={ResetSchema} onSubmit={handleSubmit}>
                {({ isSubmitting, status, values }) => (
                  <Form noValidate>
                    <div className="form-group-custom">
                      <label htmlFor="email" className="form-label-custom">
                        Email
                      </label>
                      <div className="input-with-icon">
                        <Mail size={18} className="input-icon" />
                        <Field
                          type="email"
                          id="email"
                          name="email"
                          autoComplete="email"
                          placeholder="Enter your email"
                          className="form-control custom-input"
                        />
                      </div>
                      <ErrorMessage name="email" component="div" className="field-error" />
                    </div>

                    <div className="form-group-custom">
                      <label htmlFor="otp" className="form-label-custom">
                        OTP
                      </label>
                      <div className="input-with-icon">
                        <KeyRound size={18} className="input-icon" />
                        <Field
                          type="text"
                          id="otp"
                          name="otp"
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="one-time-code"
                          placeholder="Enter the 6-digit OTP"
                          className="form-control custom-input"
                        />
                      </div>
                      <ErrorMessage name="otp" component="div" className="field-error" />
                    </div>

                    <div className="form-group-custom">
                      <label htmlFor="password" className="form-label-custom">
                        New Password
                      </label>
                      <div className="input-with-icon">
                        <Lock size={18} className="input-icon" />
                        <Field
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          autoComplete="new-password"
                          placeholder="At least 6 characters"
                          className="form-control custom-input"
                        />
                        <button
                          type="button"
                          className="input-icon-trailing"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <ErrorMessage name="password" component="div" className="field-error" />
                    </div>

                    <div className="form-group-custom">
                      <label htmlFor="confirmPassword" className="form-label-custom">
                        Confirm Password
                      </label>
                      <div className="input-with-icon">
                        <Lock size={18} className="input-icon" />
                        <Field
                          type={showPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          autoComplete="new-password"
                          placeholder="Re-enter the new password"
                          className="form-control custom-input"
                        />
                      </div>
                      <ErrorMessage name="confirmPassword" component="div" className="field-error" />
                    </div>

                    {status && <div className="form-alert">{status}</div>}

                    <button type="submit" className="btn-primary-custom" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating…' : 'Update Password'} <ArrowRight size={18} />
                    </button>
                    <p className="auth-footer-text mt-3">
                      Didn&apos;t get the OTP?{' '}
                      <Link to="/forgot-password" state={{ email: values.email }} className="link-accent">
                        Request a new OTP
                      </Link>
                    </p>
                  </Form>
                )}
              </Formik>
            )}
            <p className="auth-footer-text mt-4">
              <Link to="/login" className="link-accent">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
