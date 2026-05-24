import './globals.css'

export const metadata = {
  title: 'Despensa IA',
  description: 'Tu cocina inteligente',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#F5F2EC" />
      </head>
      <body style={{ background: '#F5F2EC' }}>{children}</body>
    </html>
  )
}