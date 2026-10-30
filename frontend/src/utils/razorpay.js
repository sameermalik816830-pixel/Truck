const SRC = 'https://checkout.razorpay.com/v1/checkout.js'

export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    let script = document.querySelector(`script[src="${SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SRC
      document.body.appendChild(script)
    }
    script.addEventListener('load', () => resolve(true))
    script.addEventListener('error', () => {
      script.remove()
      resolve(false)
    })
  })
}
