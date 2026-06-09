import './globals.css'
import Providers from './Providers'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata = {
  title: 'PostScholar — Academic discussion for published research',
  description: 'Start or join a discussion on any published paper. Paste a DOI. Verified authors get a badge via ORCID.',
  openGraph: {
    title: 'PostScholar',
    description: 'Academic discussion for published research',
    url: 'https://postscholar.org',
    type: 'website',
  },
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
