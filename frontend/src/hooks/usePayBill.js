import { useState } from 'react'
import { api } from '../api/client.js'
import { loadRazorpay } from '../utils/razorpay.js'
import { useAppData } from '../context/AppDataContext.jsx'

export default function usePayBill() {
  const { refresh } = useAppData()
  const [payingId, setPayingId] = useState(null)
  const [notice, setNotice] = useState(null)

  const pay = async (bill) => {
    if (payingId) return
    setPayingId(bill.id)
    setNotice(null)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Could not load the payment window. Check your internet connection and try again.')

      const { order } = await api.post(`/owner/bills/${bill.id}/pay/order`)

      const result = await new Promise((resolve, reject) => {
        let lastFailure = ''
        const checkout = new window.Razorpay({
          key: order.keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'Truck Garage',
          description: `Bill ${order.billNo}`,
          prefill: order.prefill,
          theme: { color: '#1f5eff' },
          handler: async (response) => {
            try {
              await api.post(`/owner/bills/${bill.id}/pay/verify`, response)
              resolve({ paid: true })
            } catch (e) {
              reject(
                new Error(
                  `${e.message} Your bill will update automatically once the payment is confirmed. Do not pay again unless the bill still shows Unpaid after a few minutes.`
                )
              )
            }
          },
          modal: { ondismiss: () => resolve({ paid: false, reason: lastFailure }) },
        })
        checkout.on('payment.failed', (r) => {
          lastFailure = (r && r.error && r.error.description) || 'Payment failed'
        })
        checkout.open()
      })

      await refresh()
      if (result.paid) {
        setNotice({ type: 'success', text: `Payment received for bill ${bill.billNo}. Thank you!` })
      } else if (result.reason) {
        setNotice({ type: 'error', text: `Payment not completed: ${result.reason}` })
      }
    } catch (e) {
      await refresh().catch(() => {})
      setNotice({ type: 'error', text: e.message })
    } finally {
      setPayingId(null)
    }
  }

  return { pay, payingId, notice, clearNotice: () => setNotice(null) }
}
