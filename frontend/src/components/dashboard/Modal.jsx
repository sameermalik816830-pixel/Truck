import { useEffect } from 'react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop-custom" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-card-header">
          <h3>{title}</h3>
          <button type="button" className="back-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-card-body">{children}</div>
      </div>
    </div>
  )
}
