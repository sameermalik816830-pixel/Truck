import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormikContext, Field } from 'formik'
import * as Yup from 'yup'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import { api } from '../api/client.js'

export const captchaInitialValues = { captchaId: '', captchaText: '' }

export const captchaShape = {
  captchaId: Yup.string().required('Captcha failed to load. Click the refresh button.'),
  captchaText: Yup.string().trim().required('Enter the characters shown in the image'),
}

export default function Captcha() {
  const { setFieldValue, setFieldTouched, errors, touched, isSubmitting, status } = useFormikContext()
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const wasSubmitting = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const d = await api.get('/captcha')
      setImage(`data:image/svg+xml;utf8,${encodeURIComponent(d.image)}`)
      setFieldValue('captchaId', d.captchaId, false)
      setFieldValue('captchaText', '', false)
      setFieldTouched('captchaText', false, false)
      setFieldTouched('captchaId', false, false)
    } catch (e) {
      setImage('')
      setFieldValue('captchaId', '', false)
      setLoadError(e.message || 'Could not load the captcha.')
    } finally {
      setLoading(false)
    }
  }, [setFieldValue, setFieldTouched])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (wasSubmitting.current && !isSubmitting && status) load()
    wasSubmitting.current = isSubmitting
  }, [isSubmitting, status, load])

  const showError = touched.captchaText || touched.captchaId
  const message = loadError || (showError && (errors.captchaText || errors.captchaId))

  return (
    <div className="form-group-custom">
      <label htmlFor="captchaText" className="form-label-custom">
        Captcha
      </label>
      <div className="captcha-row">
        <div className="captcha-image" aria-busy={loading}>
          {image ? <img src={image} alt="Captcha: type the characters you see" /> : <span>{loading ? 'Loading…' : '—'}</span>}
        </div>
        <button type="button" className="captcha-refresh" onClick={load} disabled={loading} aria-label="Get a new captcha" title="Get a new captcha">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
      <div className="input-with-icon">
        <ShieldCheck size={18} className="input-icon" />
        <Field
          type="text"
          id="captchaText"
          name="captchaText"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={8}
          placeholder="Enter the characters above"
          className="form-control custom-input"
        />
      </div>
      {message && <div className="field-error">{message}</div>}
    </div>
  )
}
