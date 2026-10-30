const SUCCESS = ['Completed', 'Active', 'Paid']
const WARNING = ['Pending', 'Unbilled', 'Unpaid']

export default function StatusBadge({ status }) {
  const tone = SUCCESS.includes(status) ? 'success' : WARNING.includes(status) ? 'warning' : 'neutral'
  return <span className={`status-badge status-${tone}`}>{status}</span>
}
