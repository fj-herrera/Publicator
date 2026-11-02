import { apiMessages } from '../constants/api-messages'
import type { PublicationContextRecord, PublicationListData } from '../entities/publication'
import { jsonRequest, requestJson, requestVoid } from './api-request'

const loadError = 'Could not load publications.'

const listLoader = <K extends keyof PublicationListData>(path: string) => (
  () => requestJson<PublicationListData[K]>(path, loadError)
)

// Module-level loaders keep a stable identity so they can be passed to useResource.
export const getPublicationContextRecords = listLoader<'publicationContexts'>('/api/publication-contexts')
export const getPublicationTagRecords = listLoader<'publicationTags'>('/api/publication-tags')
export const getPublicationSkillGroupRecords = listLoader<'publicationSkillGroups'>('/api/publication-skill-groups')
export const getSkillGroupSkillRecords = listLoader<'skillGroupSkills'>('/api/skill-group-skills')
export const getPublicationAssetRecords = listLoader<'publicationAssets'>('/api/publication-assets')
export const getListContexts = listLoader<'contexts'>('/api/contexts')
export const getListTypes = listLoader<'types'>('/api/types')
export const getListClients = listLoader<'clients'>('/api/clients')
export const getListTags = listLoader<'tags'>('/api/tags')
export const getListCollections = listLoader<'collections'>('/api/collections')
export const getListCollectionAssets = listLoader<'collectionAssets'>('/api/asset-collections')

export async function getPublicationRecords(): Promise<
  Pick<PublicationListData, 'publications' | 'metas'>
> {
  const [publications, metas] = await Promise.all([
    requestJson<PublicationListData['publications']>('/api/publications', loadError),
    requestJson<PublicationListData['metas']>('/api/metadata', loadError),
  ])
  const metasById = new Map(metas.map((meta) => [meta.id, meta]))

  return {
    publications: publications.map((publication) => ({
      ...publication,
      meta: metasById.get(publication.meta.id) ?? publication.meta,
    })),
    metas,
  }
}

export async function getPublicationListData(): Promise<PublicationListData> {
  const [
    records,
    contexts,
    types,
    clients,
    tags,
    publicationContexts,
    publicationTags,
    publicationSkillGroups,
    skillGroupSkills,
    publicationAssets,
    collections,
    collectionAssets,
  ] = await Promise.all([
    getPublicationRecords(),
    getListContexts(),
    getListTypes(),
    getListClients(),
    getListTags(),
    getPublicationContextRecords(),
    getPublicationTagRecords(),
    getPublicationSkillGroupRecords(),
    getSkillGroupSkillRecords(),
    getPublicationAssetRecords(),
    getListCollections(),
    getListCollectionAssets(),
  ])

  return {
    ...records,
    contexts,
    types,
    clients,
    tags,
    publicationContexts,
    publicationTags,
    publicationSkillGroups,
    skillGroupSkills,
    publicationAssets,
    collections,
    collectionAssets,
  }
}

export function deletePublicationRequest(id: number): Promise<void> {
  return requestVoid(
    `/api/publications/${id}`,
    'Could not delete publication.',
    { method: 'DELETE' },
  )
}

export function reorderPublicationContextsRequest(contextId: number, ids: number[]) {
  return requestJson<PublicationContextRecord[]>(
    '/api/publication-contexts/order',
    apiMessages.contexts.reorderFailed,
    jsonRequest('PATCH', { contextId, ids }),
  )
}
