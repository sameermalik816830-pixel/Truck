import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import AuthHero from '../components/AuthHero.jsx'
import Captcha, { captchaInitialValues, captchaShape } from '../components/Captcha.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const ForgotSchema = Yup.object().shape({
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  ...captchaShape,
})

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialEmail = (location.state && location.state.email) || ''

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus('')
    try {
      await forgotPassword(values.email.trim(), {
        captchaId: values.captchaId,
        captchaText: values.captchaText.trim(),
      })
      navigate('/reset-password', { state: { email: values.email.trim() } })
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
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-subtitle">Enter your account email and we&apos;ll send you an OTP</p>

            <Formik initialValues={{ email: initialEmail, ...captchaInitialValues }} validationSchema={ForgotSchema} onSubmit={handleSubmit}>
                {({ isSubmitting, status }) => (
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

                    <Captcha />

                    {status && <div className="form-alert">{status}</div>}

                    <button type="submit" className="btn-primary-custom" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending…' : 'Send OTP'} <ArrowRight size={18} />
                    </button>
                  </Form>
                )}
            </Formik>

            <p className="auth-footer-text mt-4">
              <Link to="/login" className="link-accent">
                <ArrowLeft size={14} style={{ verticalAlign: '-2px' }} /> Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
