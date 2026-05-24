import './globals.css'

export const metadata = {
  title: 'Despensa IA',
  description: 'Tu cocina inteligente',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}