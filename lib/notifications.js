export async function requestPermission() {
  if (!('Notification' in window)) return false
  if (!('serviceWorker' in navigator)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function permissionStatus() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch (err) {
    console.error('SW registration failed:', err)
    return null
  }
}

export async function scheduleNotifications(products) {
  if (!('serviceWorker' in navigator)) return
  if (Notification.permission !== 'granted') return
  const reg = await navigator.serviceWorker.ready
  reg.active?.postMessage({
    type: 'SCHEDULE_NOTIFICATIONS',
    products,
  })
}