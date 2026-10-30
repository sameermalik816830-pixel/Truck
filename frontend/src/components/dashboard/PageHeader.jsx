export default function PageHeader({ title, subtitle, right, onBack }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {onBack && (
          <button type="button" className="back-btn" onClick={onBack} aria-label="Go back">
            ←
          </button>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="page-header-right">{right}</div>}
    </div>
  )
}
