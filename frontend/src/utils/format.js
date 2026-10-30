export const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const sum = (list, pick) => list.reduce((total, item) => total + Number(pick(item) || 0), 0)
