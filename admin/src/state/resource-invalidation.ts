import { useSyncExternalStore } from 'react'

export type ResourceName =
  | 'skills'
  | 'skillGroups'
  | 'skillGroupSkills'
  | 'publications'
  | 'publicationContexts'
  | 'publicationTags'
  | 'publicationSkillGroups'
  | 'publicationAssets'
  | 'types'
  | 'tags'
  | 'contexts'
  | 'clients'
  | 'assets'
  | 'assetTexts'
  | 'collections'
  | 'collectionAssets'

// Resources whose API responses embed or aggregate data derived from another
// resource (for example a skill's `inSkillGroups` counter, a type's
// `inPublications` counter or the publication title shown on an asset relation).
// Only one level is applied: list every resource that reads the written one.
const dependentResources: Record<ResourceName, readonly ResourceName[]> = {
  skills: ['skillGroups', 'skillGroupSkills'],
  skillGroups: ['skills', 'skillGroupSkills', 'publicationSkillGroups'],
  skillGroupSkills: ['skills', 'skillGroups'],
  publications: ['types', 'clients', 'publicationAssets', 'collections'],
  publicationContexts: ['contexts'],
  publicationTags: ['tags'],
  publicationSkillGroups: ['skillGroups'],
  publicationAssets: [],
  types: ['publications'],
  tags: ['publicationTags'],
  contexts: ['publicationContexts'],
  clients: ['publications', 'collections'],
  // assetTexts is not a dependent: asset_text.asset_id has no ON DELETE CASCADE,
  // so the API answers 409 when deleting an asset that still has texts.
  assets: ['publicationAssets', 'collectionAssets'],
  assetTexts: [],
  collections: ['collectionAssets'],
  collectionAssets: [],
}

// Rows the API removes together with the resource they belong to.
const cascadeOnDelete: Partial<Record<ResourceName, readonly ResourceName[]>> = {
  publications: [
    'publicationContexts',
    'publicationTags',
    'publicationSkillGroups',
    'publicationAssets',
    'collections',
    'collectionAssets',
  ],
}

const versions = new Map<ResourceName, number>()
const listeners = new Set<() => void>()

export function getResourceVersion(resource: ResourceName): number {
  return versions.get(resource) ?? 0
}

export function subscribeToInvalidations(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Call only after the API has confirmed a write. Every consumer of the given
// resources, and of the ones derived from them, reloads once per call.
export function invalidate(...resources: ResourceName[]): void {
  const affected = new Set<ResourceName>(resources)
  resources.forEach((resource) => {
    dependentResources[resource].forEach((dependent) => affected.add(dependent))
  })

  affected.forEach((resource) => versions.set(resource, getResourceVersion(resource) + 1))
  listeners.forEach((listener) => listener())
}

// Call after the API confirmed the deletion of a row of `resource`.
export function invalidateDeleted(resource: ResourceName): void {
  invalidate(resource, ...(cascadeOnDelete[resource] ?? []))
}

export function useResourceVersion(resource: ResourceName): number {
  return useSyncExternalStore(
    subscribeToInvalidations,
    () => getResourceVersion(resource),
  )
}
