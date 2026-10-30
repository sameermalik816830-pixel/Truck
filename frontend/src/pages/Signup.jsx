import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { User, Wrench, Mail, Phone, Lock, Eye, EyeOff, MapPin, KeyRound, IdCard } from 'lucide-react'
import AuthHero from '../components/AuthHero.jsx'
import Captcha, { captchaInitialValues, captchaShape } from '../components/Captcha.jsx'
import { aadhaarDigits, formatAadhaar, isValidAadhaar } from '../utils/aadhaar.js'
import { useAuth } from '../context/AuthContext.jsx'

const SignupSchema = Yup.object().shape({
  role: Yup.string().oneOf(['owner', 'garage']).required('Please choose a role'),
  fullName: Yup.string().trim().min(2, 'Enter at least 2 characters').required('Full name / business name is required'),
  email: Yup.string().email('Enter a valid email address').required('Email address is required'),
  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .required('Mobile number is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
  aadhaar: Yup.string().when('role', {
    is: 'owner',
    then: (schema) =>
      schema
        .required('Aadhaar number is required')
        .test('aadhaar-valid', 'Enter a valid 12-digit Aadhaar number', (v) => isValidAadhaar(v)),
    otherwise: (schema) => schema,
  }),
  address: Yup.string(),
  garageCode: Yup.string(),
  ...captchaShape,
})

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const { signup } = useAuth()

  const initialValues = {
    role: 'owner',
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    aadhaar: '',
    address: '',
    garageCode: '',
    ...captchaInitialValues,
  }

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus('')
    try {
      await signup(values.role, {
        name: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.mobile.trim(),
        password: values.password,
        address: values.address.trim(),
        garageCode: values.garageCode.trim(),
        ...(values.role === 'owner' ? { aadhaar: aadhaarDigits(values.aadhaar) } : {}),
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
        <AuthHero mode="signup" />

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">Get started in just a few steps</p>

            <Formik initialValues={initialValues} validationSchema={SignupSchema} onSubmit={handleSubmit}>
              {({ values, setFieldValue, isSubmitting, status }) => (
                <Form noValidate>
                  <div className="form-group-custom">
                    <span className="form-label-custom">Choose Your Role</span>
                    <div className="role-choice-row">
                      <button
                        type="button"
                        className={`role-choice-card ${values.role === 'owner' ? 'active' : ''}`}
                        onClick={() => setFieldValue('role', 'owner')}
                      >
                        <User size={20} />
                        <span className="role-choice-title">Truck Owner</span>
                        <span className="role-choice-desc">I own trucks and want to track repairs &amp; bills</span>
                      </button>
                      <button
                        type="button"
                        className={`role-choice-card ${values.role === 'garage' ? 'active' : ''}`}
                        onClick={() => setFieldValue('role', 'garage')}
                      >
                        <Wrench size={20} />
                        <span className="role-choice-title">Garage Owner</span>
                        <span className="role-choice-desc">I run a garage and manage repairs &amp; billing</span>
                      </button>
                    </div>
                  </div>

                  <div className="form-group-custom">
                    <label htmlFor="fullName" className="form-label-custom">
                      Full Name / Business Name
                    </label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <Field
                        type="text"
                        id="fullName"
                        name="fullName"
                        placeholder="Enter your name or business name"
                        className="form-control custom-input"
                      />
                    </div>
                    <ErrorMessage name="fullName" component="div" className="field-error" />
                  </div>

                  <div className="form-group-custom">
                    <label htmlFor="email" className="form-label-custom">
                      Email Address
                    </label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email address"
                        className="form-control custom-input"
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="field-error" />
                  </div>

                  <div className="form-group-custom">
                    <label htmlFor="mobile" className="form-label-custom">
                      Mobile Number
                    </label>
                    <div className="input-with-icon">
                      <Phone size={18} className="input-icon" />
                      <Field
                        type="text"
                        id="mobile"
                        name="mobile"
                        placeholder="Enter your mobile number"
                        className="form-control custom-input"
                      />
                    </div>
                    <ErrorMessage name="mobile" component="div" className="field-error" />
                  </div>

                  {values.role === 'owner' && (
                    <div className="form-group-custom">
                      <label htmlFor="aadhaar" className="form-label-custom">
                        Aadhaar Number
                      </label>
                      <div className="input-with-icon">
                        <IdCard size={18} className="input-icon" />
                        <Field
                          type="text"
                          id="aadhaar"
                          name="aadhaar"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={14}
                          placeholder="XXXX XXXX XXXX"
                          className="form-control custom-input"
                          onChange={(e) => setFieldValue('aadhaar', formatAadhaar(e.target.value))}
                        />
                      </div>
                      <ErrorMessage name="aadhaar" component="div" className="field-error" />
                      <div className="field-hint">Required for truck owners. Stored encrypted and never shown in full.</div>
                    </div>
                  )}

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
                        autoComplete="new-password"
                        placeholder="Create a password"
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
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        className="form-control custom-input"
                      />
                      <button
                        type="button"
                        className="input-icon-trailing"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <ErrorMessage name="confirmPassword" component="div" className="field-error" />
                  </div>

                  <div className="business-details-block">
                    <div className="form-group-custom">
                      <label htmlFor="address" className="form-label-custom form-label-sub">
                        Address (Optional)
                      </label>
                      <div className="input-with-icon">
                        <MapPin size={18} className="input-icon" />
                        <Field
                          type="text"
                          id="address"
                          name="address"
                          placeholder="Enter your address"
                          className="form-control custom-input"
                        />
                      </div>
                    </div>

                    {values.role === 'garage' && (
                      <div className="form-group-custom">
                        <label htmlFor="garageCode" className="form-label-custom form-label-sub">
                          Garage Access Code{' '}
                          <span className="optional-tag">(not needed for the very first garage account)</span>
                        </label>
                        <div className="input-with-icon">
                          <KeyRound size={18} className="input-icon" />
                          <Field
                            type="password"
                            id="garageCode"
                            name="garageCode"
                            placeholder="Enter the access code"
                            className="form-control custom-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Captcha />

                  {status && <div className="form-alert">{status}</div>}

                  <button type="submit" className="btn-primary-custom" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account…' : 'Create Account'}
                  </button>
                </Form>
              )}
            </Formik>

            <p className="auth-footer-text mt-4">
              Already have an account?{' '}
              <Link to="/login" className="link-accent">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
