import './globals.css'

export const metadata = {
  title: 'Despensa IA',
  description: 'Tu cocina inteligente',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Despensa IA',
  },
}

export const viewport = {
  themeColor: '#F5F2EC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Despensa IA" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ background: '#F5F2EC', overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  )
}