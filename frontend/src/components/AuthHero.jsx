import { Truck, Wrench, FileText, ShieldCheck } from 'lucide-react'

export default function AuthHero({ mode }) {
  return (
    <div className="auth-hero">
      <div className="auth-hero-overlay" />

      <div className="auth-hero-content">
        <div className="auth-hero-top">
          <div className="brand-row">
            <span className="brand-icon">
              <Truck size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className="brand-name">Truck Garage</div>
              <div className="brand-tagline">Repair &nbsp;•&nbsp; Maintain &nbsp;•&nbsp; Keep Moving</div>
            </div>
          </div>
        </div>

        <div className="auth-hero-middle">
          {mode === 'login' ? (
            <>
              <h1 className="hero-heading">
                Your Truck,
                <br />
                Our <span className="hero-accent">Priority</span>
              </h1>
              <p className="hero-subtext">
                Track repairs, manage bills and keep your fleet on the road — all in one place.
              </p>
            </>
          ) : (
            <>
              <h1 className="hero-heading">
                Join <span className="hero-accent">Truck Garage</span>
              </h1>
              <p className="hero-subtext">
                Manage your trucks, track repairs, handle bills — simply and securely.
              </p>
            </>
          )}
        </div>

        <div className="auth-hero-bottom">
          <div className="hero-feature">
            <Wrench size={20} strokeWidth={2} />
            <span>Easy Maintenance Tracking</span>
          </div>
          <div className="hero-feature">
            <FileText size={20} strokeWidth={2} />
            <span>Transparent Billing</span>
          </div>
          <div className="hero-feature">
            <ShieldCheck size={20} strokeWidth={2} />
            <span>Trusted by Truck Owners</span>
          </div>
        </div>
      </div>
    </div>
  )
}
