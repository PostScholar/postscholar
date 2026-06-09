import LandingHome from './LandingHome'
import { getInitialFeedData } from '@/lib/feedData'

export const metadata = {
  title: 'PostScholar — Academic discussion for published research',
  description: 'PostScholar is an open platform for discussing published academic papers. Paste a DOI, start a thread, and connect with verified authors via ORCID.',
  openGraph: {
    title: 'PostScholar — Academic discussion for published research',
    description: 'Open discussion for published research papers. Verified author badges via ORCID.',
    url: 'https://postscholar.org',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { discussions } = await getInitialFeedData()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'PostScholar',
            url: 'https://postscholar.org',
            description: 'Open academic discussion platform for published research papers.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://postscholar.org/search?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <LandingHome discussions={discussions} />
    </>
  )
}
