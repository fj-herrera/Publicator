import { afterEach, describe, expect, it, vi } from 'vitest'
import { updateCollectionRequest } from './collections.service'

describe('updateCollectionRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the new publication id when moving a collection', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 7 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await updateCollectionRequest(7, { publicationId: 12 })

    expect(fetchMock).toHaveBeenCalledWith('/api/collections/7', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicationId: 12 }),
    })
  })
})
