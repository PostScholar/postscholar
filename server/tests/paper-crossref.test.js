const { fetchCrossRefPaper } = require('../routes/papers')

describe('fetchCrossRefPaper', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('normalizes a verified CrossRef DOI', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        message: {
          title: ['Canonical CrossRef Title'],
          author: [{ given: 'Jane', family: 'Doe' }],
          'container-title': ['Journal of Tests'],
          'published-online': { 'date-parts': [[2024]] },
          abstract: '<jats:p>Abstract text</jats:p>',
        },
      }),
    })

    const result = await fetchCrossRefPaper('10.5555/example')

    expect(result).toEqual({
      found: true,
      paper: {
        title: 'Canonical CrossRef Title',
        authors: [{ given: 'Jane', family: 'Doe' }],
        journal: 'Journal of Tests',
        year: 2024,
        abstract: 'Abstract text',
      },
    })
  })

  it('reports lookup failure when CrossRef is unavailable', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 503,
      ok: false,
      json: async () => ({}),
    })

    await expect(fetchCrossRefPaper('10.5555/example')).resolves.toEqual({
      found: false,
      lookupFailed: true,
    })
  })
})
