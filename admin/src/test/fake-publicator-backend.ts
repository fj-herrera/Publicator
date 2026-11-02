// In-memory stand-in for the Publicator API. Every list is served from one
// state object and counted per loader, so tests can assert which resources a
// write refetched and that derived counters come from the "server".
type Named = { id: number; name: string }
type PublicationRow = {
  id: number
  title: string
  typeId: number
  clientId: number
  tagIds: number[]
  contextIds: number[]
}
type AssetRow = { id: number; name: string }
type AssetRelationRow = { id: number; assetId: number; targetId: number; role: string }
type TextRow = { id: number; assetId: number; type: string; content: string }
type CollectionRow = { id: number; name: string }

export const loaders = [
  'publications', 'types', 'tags', 'contexts', 'clients', 'collections',
  'publicationContexts', 'publicationTags', 'publicationSkillGroups',
  'skillGroupSkills', 'publicationAssets', 'collectionAssets', 'assets', 'assetTexts',
] as const
export type LoaderName = typeof loaders[number]

export const requests = Object.fromEntries(loaders.map((name) => [name, 0])) as Record<LoaderName, number>

type State = {
  types: Named[]
  tags: Named[]
  contexts: Named[]
  clients: Named[]
  publications: PublicationRow[]
  collections: CollectionRow[]
  assets: AssetRow[]
  publicationAssets: AssetRelationRow[]
  collectionAssets: AssetRelationRow[]
  assetTexts: TextRow[]
}

export const state: State = {
  types: [], tags: [], contexts: [], clients: [], publications: [],
  collections: [], assets: [], publicationAssets: [], collectionAssets: [], assetTexts: [],
}

export function resetBackend(seed: Partial<State> = {}) {
  Object.assign(state, {
    types: [], tags: [], contexts: [], clients: [], publications: [],
    collections: [], assets: [], publicationAssets: [], collectionAssets: [],
    assetTexts: [], ...seed,
  })
  loaders.forEach((name) => { requests[name] = 0 })
}

const count = (name: LoaderName) => { requests[name]++ }

const withCounter = <T extends Named>(
  items: T[],
  inPublications: (id: number) => number,
) => items.map((item) => ({ ...item, inPublications: inPublications(item.id) }))

// Rows whose asset no longer exists are dropped, as the API's joins would.
const withAsset = <T extends { assetId: number }>(rows: T[]) => rows.flatMap((row) => {
  const asset = state.assets.find((item) => item.id === row.assetId)
  return asset ? [{ ...row, asset }] : []
})

export const publicationsService = {
  getPublicationRecords: async () => {
    count('publications')
    return { publications: state.publications.map((row) => ({ ...row })), metas: [] }
  },
  getListTypes: async () => {
    count('types')
    return withCounter(state.types, (id) => state.publications.filter((p) => p.typeId === id).length)
  },
  getListClients: async () => {
    count('clients')
    return withCounter(state.clients, (id) => state.publications.filter((p) => p.clientId === id).length)
  },
  getListTags: async () => {
    count('tags')
    return withCounter(state.tags, (id) => state.publications.filter((p) => p.tagIds.includes(id)).length)
  },
  getListContexts: async () => {
    count('contexts')
    return withCounter(state.contexts, (id) => state.publications.filter((p) => p.contextIds.includes(id)).length)
  },
  getListCollections: async () => {
    count('collections')
    return state.collections.map((row) => ({ ...row }))
  },
  getPublicationContextRecords: async () => {
    count('publicationContexts')
    return state.publications.flatMap((p) => p.contextIds.map((contextId) => ({ publicationId: p.id, contextId })))
  },
  getPublicationTagRecords: async () => {
    count('publicationTags')
    return state.publications.flatMap((p) => p.tagIds.map((tagId) => ({ publicationId: p.id, tagId })))
  },
  getPublicationSkillGroupRecords: async () => {
    count('publicationSkillGroups')
    return []
  },
  getSkillGroupSkillRecords: async () => {
    count('skillGroupSkills')
    return []
  },
  getPublicationAssetRecords: async () => {
    count('publicationAssets')
    return state.publicationAssets.map((row) => ({ ...row }))
  },
  getListCollectionAssets: async () => {
    count('collectionAssets')
    return state.collectionAssets.map((row) => ({ ...row }))
  },
}

export const assetsService = {
  getAssets: async () => {
    count('assets')
    return state.assets.map((row) => ({ ...row }))
  },
  getPublicationAssets: async () => {
    count('publicationAssets')
    return withAsset(state.publicationAssets)
  },
  getAssetCollections: async () => {
    count('collectionAssets')
    return withAsset(state.collectionAssets)
  },
  getPublications: async () => {
    count('publications')
    return state.publications.map((row) => ({ id: row.id, title: row.title }))
  },
  getCollections: async () => {
    count('collections')
    return state.collections.map((row) => ({ ...row }))
  },
}

export const assetTextsService = {
  getAssetTexts: async () => {
    count('assetTexts')
    return withAsset(state.assetTexts)
  },
}

export const collectionsService = {
  getCollections: async () => {
    count('collections')
    return state.collections.map((row) => ({ ...row }))
  },
  getCollectionAssets: async () => {
    count('collectionAssets')
    return state.collectionAssets.map((row) => ({ ...row }))
  },
  getPublicationContexts: async () => {
    count('publicationContexts')
    return state.publications.flatMap((p) => p.contextIds.map((contextId) => ({ publicationId: p.id, contextId })))
  },
}

// Server-side operations the tests call in place of the HTTP layer.
export const server = {
  deletePublication(id: number) {
    state.publications = state.publications.filter((p) => p.id !== id)
    state.publicationAssets = state.publicationAssets.filter((row) => row.targetId !== id)
  },
  deleteAsset(id: number) {
    state.assets = state.assets.filter((asset) => asset.id !== id)
  },
}
