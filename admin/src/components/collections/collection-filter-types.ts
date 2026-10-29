export type FilterOption = { id: string; label: string }

export type CollectionFilterValues = {
  publications: string[]
  contexts: string[]
  types: string[]
  clients: string[]
}

export const emptyCollectionFilters: CollectionFilterValues = {
  publications: [],
  contexts: [],
  types: [],
  clients: [],
}