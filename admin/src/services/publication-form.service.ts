import type { PublicationContextRecord, PublicationListData } from '../entities/publication'
import type { PublicationRecord } from '../entities/publication'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export type MetaInput = {
  title: string
  slug: string
  date: string
  status: 'draft'
  clientId?: number | null
}

export async function createMetaRequest(meta: MetaInput) {
  return requestJson<PublicationRecord['meta']>(
    '/api/metadata',
    'Could not create publication metadata.',
    jsonRequest('POST', meta),
  )
}

export async function updateMetaRequest(id: number, meta: Omit<MetaInput, 'date'>) {
  return requestJson<PublicationRecord['meta']>(
    `/api/metadata/${id}`,
    'Could not update publication metadata.',
    jsonRequest('PATCH', meta),
  )
}

export async function createPublicationRequest(typeId: number, metaId: number) {
  return requestJson<PublicationRecord>(
    '/api/publications',
    'Could not create publication.',
    jsonRequest('POST', { typeId, metaId }),
  )
}

export async function updatePublicationRequest(id: number, typeId: number) {
  return requestJson<PublicationRecord>(
    `/api/publications/${id}`,
    'Could not update publication.',
    jsonRequest('PATCH', { typeId }),
  )
}

export async function getMainInfoRelations() {
  const [contexts, tags, skillGroups] = await Promise.all([
    requestJson<PublicationContextRecord[]>('/api/publication-contexts', 'Could not load publication contexts.'),
    requestJson<PublicationListData['publicationTags']>('/api/publication-tags', 'Could not load publication tags.'),
    requestJson<PublicationListData['publicationSkillGroups']>('/api/publication-skill-groups', 'Could not load publication skill groups.'),
  ])
  return { contexts, tags, skillGroups }
}

export async function createPublicationContextRequest(input: {
  publicationId: number
  contextId: number
  position: number
  visible: false
  featured: false
}) {
  return requestJson<PublicationContextRecord>(
    '/api/publication-contexts',
    'Could not associate context with publication.',
    jsonRequest('POST', input),
  )
}

export function deletePublicationContextRequest(id: number) {
  return requestVoid(`/api/publication-contexts/${id}`, 'Could not remove publication context.', { method: 'DELETE' })
}

export async function createPublicationTagRequest(publicationId: number, tagId: number) {
  return requestJson<PublicationListData['publicationTags'][number]>(
    '/api/publication-tags',
    'Could not associate tag with publication.',
    jsonRequest('POST', { publicationId, tagId }),
  )
}

export function deletePublicationTagRequest(id: number) {
  return requestVoid(`/api/publication-tags/${id}`, 'Could not remove publication tag.', { method: 'DELETE' })
}

export async function createPublicationSkillGroupRequest(publicationId: number, skillGroupId: number) {
  return requestJson<PublicationListData['publicationSkillGroups'][number]>(
    '/api/publication-skill-groups',
    'Could not associate skill group with publication.',
    jsonRequest('POST', { publicationId, skillGroupId }),
  )
}

export function deletePublicationSkillGroupRequest(id: number) {
  return requestVoid(`/api/publication-skill-groups/${id}`, 'Could not remove publication skill group.', { method: 'DELETE' })
}

export async function deletePublicationAssetRequest(id: number): Promise<void> {
  return requestVoid(`/api/publication-assets/${id}`, 'Could not remove asset from publication.', { method: 'DELETE' })
}
