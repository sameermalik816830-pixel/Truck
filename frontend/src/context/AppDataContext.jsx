import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

const AppDataContext = createContext(null)

const idOf = (v) => (v && typeof v === 'object' ? v._id ?? v.id : v)
const day = (d) => (d ? String(d).slice(0, 10) : '')

const normOwner = (o) => ({ ...o, id: idOf(o) })
const normTruck = (t) => ({ ...t, id: t._id, ownerId: idOf(t.owner), lastServiceDate: day(t.lastServiceDate) })
const repairItems = (r) =>
  r.items && r.items.length
    ? r.items.map((i) => ({ description: i.description, amount: i.amount }))
    : [{ description: r.workDone, amount: r.cost }]
const normRepair = (r) => ({
  ...r,
  id: r._id,
  ownerId: idOf(r.owner),
  date: day(r.date),
  photos: r.photos || [],
  items: repairItems(r),
})
const normBill = (b) => ({
  ...b,
  id: b._id,
  ownerId: idOf(b.owner),
  billDate: day(b.billDate),
  items: (b.items || []).map((i) => ({ ...i, date: day(i.date) })),
})

export function AppDataProvider({ children }) {
  const { user, isGarage } = useAuth()
  const base = isGarage ? '/garage' : '/owner'

  const [ownersRaw, setOwnersRaw] = useState([])
  const [trucks, setTrucks] = useState([])
  const [repairs, setRepairs] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [billDraft, setBillDraft] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const calls = [api.get(`${base}/trucks`), api.get(`${base}/repairs`), api.get(`${base}/bills`)]
      if (isGarage) calls.push(api.get('/garage/truck-owners'))
      const [t, r, b, o] = await Promise.all(calls)
      setTrucks(t.trucks.map(normTruck))
      setRepairs(r.repairs.map(normRepair))
      setBills(b.bills.map(normBill))
      if (o) setOwnersRaw(o.owners.map(normOwner))
      setError('')
      setLoaded(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [base, isGarage])

  useEffect(() => {
    refresh()
  }, [refresh])

  const owners = useMemo(() => (isGarage ? ownersRaw : user ? [normOwner(user)] : []), [isGarage, ownersRaw, user])

  const run = async (fn) => {
    const result = await fn()
    await refresh()
    return result
  }

  const actions = {
    addOwner: (data) => run(() => api.post('/garage/truck-owners', data)),
    updateOwner: (id, data) => run(() => api.put(`/garage/truck-owners/${id}`, data)),
    deleteOwner: (id) => run(() => api.del(`/garage/truck-owners/${id}`)),

    addTruck: (data) => run(() => api.post('/garage/trucks', data)),
    updateTruck: (id, data) => run(() => api.put(`/garage/trucks/${id}`, data)),
    deleteTruck: (id) => run(() => api.del(`/garage/trucks/${id}`)),

    addRepair: (form) => run(() => api.postForm('/garage/repairs', form)),
    updateRepair: (id, form) => run(() => api.putForm(`/garage/repairs/${id}`, form)),
    deleteRepair: (id) => run(() => api.del(`/garage/repairs/${id}`)),

    createBill: async (payload) => {
      const d = await api.post('/garage/bills', payload)
      await refresh()
      return normBill(d.bill)
    },
    updateBill: (id, data) => run(() => api.put(`/garage/bills/${id}`, data)),
    deleteBill: (id) => run(() => api.del(`/garage/bills/${id}`)),
  }

  const getOwnerById = (id) => owners.find((o) => o.id === id)
  const getTrucksByOwner = (ownerId) => trucks.filter((t) => t.ownerId === ownerId)
  const getUnbilledRepairs = (ownerId) => repairs.filter((r) => r.ownerId === ownerId && !r.billed)

  const value = {
    owners,
    trucks,
    repairs,
    bills,
    loading,
    loaded,
    error,
    refresh,
    billDraft,
    setBillDraft,
    getOwnerById,
    getTrucksByOwner,
    getUnbilledRepairs,
    ...actions,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
