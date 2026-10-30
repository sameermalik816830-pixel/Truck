import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import AuthHero from '../components/AuthHero.jsx'
import Captcha, { captchaInitialValues, captchaShape } from '../components/Captcha.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const LoginSchema = Yup.object().shape({
  identifier: Yup.string()
    .trim()
    .required('Email or mobile number is required')
    .test('is-email-or-mobile', 'Enter a valid email or 10-digit mobile number', (value) => {
      if (!value) return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^[6-9]\d{9}$/.test(value)
    }),
  password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  ...captchaShape,
})

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus('')
    try {
      await login(values.identifier.trim(), values.password, {
        captchaId: values.captchaId,
        captchaText: values.captchaText.trim(),
      })
      navigate('/dashboard', { replace: true })
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
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Login to your account</p>

            <Formik initialValues={{ identifier: '', password: '', ...captchaInitialValues }} validationSchema={LoginSchema} onSubmit={handleSubmit}>
              {({ isSubmitting, status }) => (
                <Form noValidate>
                  <div className="form-group-custom">
                    <label htmlFor="identifier" className="form-label-custom">
                      Email / Mobile Number
                    </label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <Field
                        type="text"
                        id="identifier"
                        name="identifier"
                        autoComplete="username"
                        placeholder="Enter your email or mobile number"
                        className="form-control custom-input"
                      />
                    </div>
                    <ErrorMessage name="identifier" component="div" className="field-error" />
                  </div>

                  <div className="form-group-custom">
                    <label htmlFor="password" className="form-label-custom">
                      Password
                    </label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <Field
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
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

                  <div className="forgot-row">
                    <Link to="/forgot-password" className="link-accent">
                      Forgot password?
                    </Link>
                  </div>

                  <Captcha />

                  {status && <div className="form-alert">{status}</div>}

                  <button type="submit" className="btn-primary-custom" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in…' : 'Login'} <ArrowRight size={18} />
                  </button>
                </Form>
              )}
            </Formik>

            <p className="auth-footer-text mt-4">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="link-accent">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
