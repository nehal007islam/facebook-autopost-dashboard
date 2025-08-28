import './globals.css'

export const metadata = {
  title: 'Facebook Auto-Post Dashboard',
  description: 'AI-powered social media automation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
