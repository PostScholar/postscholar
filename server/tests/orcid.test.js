jest.mock('../db', () => ({
  query: jest.fn(),
}))

const db = require('../db')
const { findOrcidOwnerConflict } = require('../routes/orcid')

beforeEach(() => {
  db.query.mockReset()
})

describe('findOrcidOwnerConflict', () => {
  it('returns the other owner when an ORCID iD belongs to a different user', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'user-2' }] })

    const conflict = await findOrcidOwnerConflict('0000-0002-1825-0097', 'user-1')

    expect(conflict).toEqual({ id: 'user-2' })
    expect(db.query).toHaveBeenCalledWith(
      'SELECT id FROM users WHERE orcid_id = $1 AND id != $2',
      ['0000-0002-1825-0097', 'user-1']
    )
  })

  it('returns null when the ORCID iD is not linked to another user', async () => {
    db.query.mockResolvedValueOnce({ rows: [] })

    const conflict = await findOrcidOwnerConflict('0000-0002-1825-0097', 'user-1')

    expect(conflict).toBeNull()
  })
})
