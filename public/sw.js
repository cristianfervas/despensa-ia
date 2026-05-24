self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/'))
})

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleAll(e.data.products)
  }
})

function scheduleAll(products) {
  const now = Date.now()
  products.forEach(p => {
    const expiry = new Date(p.expiry).getTime()
    const daysLeft = Math.round((expiry - now) / 86400000)

    if (daysLeft === 2) {
      setTimeout(() => showNotification(p, daysLeft), 1000)
    }
    if (daysLeft === 1) {
      setTimeout(() => showNotification(p, daysLeft), 1000)
    }
    if (daysLeft === 0) {
      setTimeout(() => showNotification(p, daysLeft), 1000)
    }
  })
}

function showNotification(product, daysLeft) {
  const messages = {
    2: `${product.emoji} ${product.name} vence en 2 días`,
    1: `${product.emoji} ${product.name} vence mañana`,
    0: `${product.emoji} ${product.name} vence hoy — úsalo ahora`,
  }
  const body = messages[daysLeft] || `${product.emoji} ${product.name} está por vencer`
  self.registration.showNotification('Despensa IA', {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `expiry-${product.id}`,
    renotify: true,
    data: { productId: product.id },
  })
}