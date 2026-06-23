import './globals.css'
import Providers from './Providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SITE_NAME, SITE_URL } from '@/lib/site'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: `${SITE_NAME} — Academic discussion for published research`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    'Start or join a discussion on any published paper. Paste a DOI. Verified authors get a badge via ORCID.',
  openGraph: {
    title: SITE_NAME,
    description: 'Academic discussion for published research',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Academic discussion for published research',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
