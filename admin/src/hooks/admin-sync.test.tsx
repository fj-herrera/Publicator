import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loaders,
  requests,
  resetBackend,
  server,
  state,
  type LoaderName,
} from '../test/fake-publicator-backend'
import { invalidate, invalidateDeleted } from '../state/resource-invalidation'
import useCollectionsData from './useCollectionsData'
import useGalleryData from './useGalleryData'
import usePublicationsData from './usePublicationsData'

vi.mock('../services/publications.service', async () => (await import('../test/fake-publicator-backend')).publicationsService)
vi.mock('../services/assets.service', async () => (await import('../test/fake-publicator-backend')).assetsService)
vi.mock('../services/asset-texts.service', async () => (await import('../test/fake-publicator-backend')).assetTextsService)
vi.mock('../services/collections.service', async () => (await import('../test/fake-publicator-backend')).collectionsService)

const seed = () => resetBackend({
  types: [{ id: 1, name: 'Web' }, { id: 2, name: 'App' }],
  tags: [{ id: 1, name: 'React' }],
  contexts: [{ id: 1, name: 'Work' }],
  clients: [{ id: 1, name: 'Acme' }],
  publications: [
    { id: 1, title: 'One', typeId: 1, clientId: 1, tagIds: [1], contextIds: [1] },
    { id: 2, title: 'Two', typeId: 1, clientId: 1, tagIds: [], contextIds: [] },
  ],
  collections: [{ id: 1, name: 'Main' }],
  assets: [{ id: 1, name: 'logo' }, { id: 2, name: 'banner' }],
  publicationAssets: [{ id: 1, assetId: 1, targetId: 1, role: 'cover' }],
  collectionAssets: [{ id: 1, assetId: 1, targetId: 1, role: 'hero' }],
  assetTexts: [{ id: 1, assetId: 1, type: 'alt', content: 'Logo' }],
})

const snapshot = () => ({ ...requests })
const fetchedSince = (before: Record<LoaderName, number>) => (
  loaders.filter((name) => requests[name] > before[name])
)

const renderPublications = async () => {
  const view = renderHook(() => usePublicationsData())
  await waitFor(() => expect(view.result.current.data).not.toBeNull())
  return view
}
const renderGallery = async () => {
  const view = renderHook(() => useGalleryData())
  await waitFor(() => expect(view.result.current.isLoading).toBe(false))
  return view
}

const counter = (items: { id: number; inPublications?: number }[] | undefined, id: number) => (
  items?.find((item) => item.id === id)?.inPublications
)

describe('Publications and their catalogues', () => {
  beforeEach(seed)

  it('creating a publication refreshes the derived counters without flicker', async () => {
    const { result } = await renderPublications()
    expect(counter(result.current.data?.types, 2)).toBe(0)
    const flicker = vi.fn()
    const before = snapshot()

    state.publications.push({ id: 3, title: 'Three', typeId: 2, clientId: 1, tagIds: [1], contextIds: [1] })
    act(() => invalidate('publications', 'publicationTags', 'publicationContexts'))
    if (result.current.isLoading) flicker()

    await waitFor(() => expect(counter(result.current.data?.types, 2)).toBe(1))
    expect(counter(result.current.data?.clients, 1)).toBe(3)
    expect(counter(result.current.data?.tags, 1)).toBe(2)
    expect(counter(result.current.data?.contexts, 1)).toBe(2)
    expect(result.current.data?.publications).toHaveLength(3)
    expect(flicker).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    // One request per affected resource, none for the unrelated ones.
    expect(fetchedSince(before).sort()).toEqual([
      'clients', 'collections', 'contexts', 'publicationAssets',
      'publicationContexts', 'publicationTags', 'publications', 'tags', 'types',
    ].sort())
    loaders.forEach((name) => expect(requests[name] - before[name]).toBeLessThanOrEqual(1))
  })

  it('editing a publication only reloads the lists it can change', async () => {
    const { result } = await renderPublications()
    const before = snapshot()

    state.publications[0].typeId = 2
    act(() => invalidate('publications'))

    await waitFor(() => expect(counter(result.current.data?.types, 2)).toBe(1))
    expect(counter(result.current.data?.types, 1)).toBe(1)
    expect(requests.tags).toBe(before.tags)
    expect(requests.contexts).toBe(before.contexts)
    expect(requests.skillGroupSkills).toBe(before.skillGroupSkills)
  })

  it('deleting a publication also refreshes what the server cascades', async () => {
    const { result } = await renderPublications()
    const before = snapshot()

    server.deletePublication(1)
    act(() => invalidateDeleted('publications'))

    await waitFor(() => expect(result.current.data?.publications).toHaveLength(1))
    expect(counter(result.current.data?.tags, 1)).toBe(0)
    expect(counter(result.current.data?.contexts, 1)).toBe(0)
    expect(counter(result.current.data?.clients, 1)).toBe(1)
    expect(result.current.data?.publicationAssets).toHaveLength(0)
    expect(result.current.data?.publicationTags).toHaveLength(0)
    expect(result.current.data?.publicationContexts).toHaveLength(0)
    expect(requests.publicationSkillGroups).toBe(before.publicationSkillGroups + 1)
  })

  it('renaming a type reloads the types and the publications that show it', async () => {
    const { result } = await renderPublications()
    const before = snapshot()

    state.types[0].name = 'Website'
    act(() => invalidate('types'))

    await waitFor(() => expect(result.current.data?.types[0].name).toBe('Website'))
    expect(fetchedSince(before).sort()).toEqual(['publications', 'types'])
  })

  it('deleting a tag or a context refreshes its relations only', async () => {
    const { result } = await renderPublications()
    let before = snapshot()

    state.tags = []
    state.publications[0].tagIds = []
    act(() => invalidate('tags'))
    await waitFor(() => expect(result.current.data?.tags).toHaveLength(0))
    expect(result.current.data?.publicationTags).toHaveLength(0)
    expect(fetchedSince(before).sort()).toEqual(['publicationTags', 'tags'])

    before = snapshot()
    state.contexts = []
    state.publications[0].contextIds = []
    act(() => invalidate('contexts'))
    await waitFor(() => expect(result.current.data?.contexts).toHaveLength(0))
    expect(result.current.data?.publicationContexts).toHaveLength(0)
    expect(fetchedSince(before).sort()).toEqual(['contexts', 'publicationContexts'])
  })

  it('deleting a client refreshes publications and collections', async () => {
    const { result } = await renderPublications()
    const before = snapshot()

    state.clients = []
    state.publications.forEach((p) => { p.clientId = 0 })
    act(() => invalidate('clients'))

    await waitFor(() => expect(result.current.data?.clients).toHaveLength(0))
    expect(fetchedSince(before).sort()).toEqual(['clients', 'collections', 'publications'])
  })
})

describe('Gallery and assets', () => {
  beforeEach(seed)

  it('deleting an asset removes it and its relations from the gallery', async () => {
    const { result } = await renderGallery()
    expect(result.current.relations[1].publications).toHaveLength(1)
    const before = snapshot()

    server.deleteAsset(2)
    act(() => invalidate('assets'))

    await waitFor(() => expect(result.current.assets).toHaveLength(1))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.relations[2]).toBeUndefined()
    expect(requests.assets).toBe(before.assets + 1)
    expect(requests.publicationAssets).toBe(before.publicationAssets + 1)
    expect(requests.collectionAssets).toBe(before.collectionAssets + 1)
    expect(requests.assetTexts).toBe(before.assetTexts)
  })

  it('renaming an asset updates the gallery and its relations', async () => {
    const { result } = await renderGallery()

    state.assets[0].name = 'logo-v2'
    act(() => invalidate('assets'))

    await waitFor(() => expect(result.current.assets[0].name).toBe('logo-v2'))
    expect((result.current.relations[1].publications[0].asset as { name?: string }).name).toBe('logo-v2')
  })

  it('creating a relation shows it right away', async () => {
    const { result } = await renderGallery()
    const before = snapshot()

    state.publicationAssets.push({ id: 2, assetId: 2, targetId: 2, role: 'gallery' })
    act(() => invalidate('publicationAssets'))

    await waitFor(() => expect(result.current.relations[2].publications).toHaveLength(1))
    expect(fetchedSince(before)).toEqual(['publicationAssets'])
  })

  it('asset text writes reload only the texts', async () => {
    const { result } = await renderGallery()
    const before = snapshot()

    state.assetTexts.push({ id: 2, assetId: 1, type: 'caption', content: 'Hi' })
    act(() => invalidate('assetTexts'))
    await waitFor(() => expect(result.current.assetTexts[1]).toHaveLength(2))
    expect(fetchedSince(before)).toEqual(['assetTexts'])

    state.assetTexts = []
    act(() => invalidate('assetTexts'))
    await waitFor(() => expect(result.current.assetTexts[1]).toBeUndefined())
    expect(result.current.isLoading).toBe(false)
  })

  it('keeps the previous data and reports an error when a reload fails, then retries', async () => {
    const { result } = await renderGallery()
    const original = state.assets
    const assetsModule = await import('../test/fake-publicator-backend')
    const spy = vi.spyOn(assetsModule.assetsService, 'getAssets').mockRejectedValueOnce(new Error('boom'))

    act(() => invalidate('assets'))
    await waitFor(() => expect(result.current.error).not.toBe(''))
    expect(result.current.assets).toHaveLength(original.length)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.error).toBe(''))
    spy.mockRestore()
  })
})

describe('Collections and mounted consumers', () => {
  beforeEach(seed)

  it('a collection write reaches Collections and the Gallery mounted together', async () => {
    const collections = renderHook(() => useCollectionsData())
    const gallery = renderHook(() => useGalleryData())
    await waitFor(() => {
      expect(collections.result.current.data).not.toBeNull()
      expect(gallery.result.current.isLoading).toBe(false)
    })
    expect(gallery.result.current.relations[1].collections).toHaveLength(1)
    const before = snapshot()

    state.collectionAssets = []
    state.collections[0].name = 'Renamed'
    act(() => invalidate('collections'))

    await waitFor(() => {
      expect(collections.result.current.data?.collections[0].name).toBe('Renamed')
      expect(gallery.result.current.relations[1].collections).toHaveLength(0)
    })
    expect(collections.result.current.isLoading).toBe(false)
    expect(collections.result.current.data?.collectionAssets).toHaveLength(0)
    // Each mounted consumer reloads each resource it uses once.
    expect(requests.collections - before.collections).toBe(1)
    expect(requests.collectionAssets - before.collectionAssets).toBe(2)
    expect(requests.assets).toBe(before.assets)
  })

  it('deleting an asset reaches the collection editor data', async () => {
    const { result } = renderHook(() => useCollectionsData())
    await waitFor(() => expect(result.current.data).not.toBeNull())

    state.assets = state.assets.filter((asset) => asset.id !== 2)
    act(() => invalidate('assets'))

    await waitFor(() => expect(result.current.data?.assets).toHaveLength(1))
    expect(result.current.isLoading).toBe(false)
  })

  it('discards a stale response that resolves after a newer one', async () => {
    const { result } = await renderGallery()
    const assetsModule = await import('../test/fake-publicator-backend')
    let releaseStale: (value: unknown[]) => void = () => {}
    const spy = vi.spyOn(assetsModule.assetsService, 'getAssets')
      .mockImplementationOnce(() => new Promise((resolve) => { releaseStale = resolve as never }))

    act(() => invalidate('assets'))
    state.assets = [{ id: 9, name: 'fresh' }]
    act(() => invalidate('assets'))
    await waitFor(() => expect(result.current.assets[0]?.name).toBe('fresh'))

    await act(async () => releaseStale([{ id: 1, name: 'stale' }]))
    expect(result.current.assets[0].name).toBe('fresh')
    spy.mockRestore()
  })
})
