import { requestJson, requestVoid } from './api-request'
import type { PublicationListData } from '../entities/publication'

const loadError = 'Could not load publications.'

export async function getPublicationListData(): Promise<PublicationListData> {
  const [
    publications,
    metas,
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
    requestJson<PublicationListData['publications']>('/api/publications', loadError),
    requestJson<PublicationListData['metas']>('/api/metadata', loadError),
    requestJson<PublicationListData['contexts']>('/api/contexts', loadError),
    requestJson<PublicationListData['types']>('/api/types', loadError),
    requestJson<PublicationListData['clients']>('/api/clients', loadError),
    requestJson<PublicationListData['tags']>('/api/tags', loadError),
    requestJson<PublicationListData['publicationContexts']>('/api/publication-contexts', loadError),
    requestJson<PublicationListData['publicationTags']>('/api/publication-tags', loadError),
    requestJson<PublicationListData['publicationSkillGroups']>('/api/publication-skill-groups', loadError),
    requestJson<PublicationListData['skillGroupSkills']>('/api/skill-group-skills', loadError),
    requestJson<PublicationListData['publicationAssets']>('/api/publication-assets', loadError),
    requestJson<PublicationListData['collections']>('/api/collections', loadError),
    requestJson<PublicationListData['collectionAssets']>('/api/asset-collections', loadError),
  ])

  const metasById = new Map(metas.map((meta) => [meta.id, meta]))

  return {
    publications: publications.map((publication) => ({
      ...publication,
      meta: metasById.get(publication.meta.id) ?? publication.meta,
    })),
    metas,
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
