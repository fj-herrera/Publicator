import type { PublicationTextFormat, PublicationTextRecord } from '../entities/publication-text'
import { jsonRequest, requestJson, requestVoid } from './api-request'

const loadFailed = 'Could not load publication texts.'

export function getPublicationTextRecords() {
  return requestJson<PublicationTextRecord[]>('/api/text-contents', loadFailed)
}

export function createPublicationText(input: {
  publicationId: number
  type: string
  text: string
  format: PublicationTextFormat
}) {
  return requestJson<PublicationTextRecord>(
    '/api/text-contents/publication',
    'Could not save this text.',
    jsonRequest('POST', input),
  )
}

export function updatePublicationText(
  id: number,
  input: { type: string; text: string; format: PublicationTextFormat },
) {
  return requestJson<PublicationTextRecord>(
    `/api/text-contents/${id}/publication`,
    'Could not update this text.',
    jsonRequest('PATCH', input),
  )
}

export function deletePublicationText(id: number) {
  return requestVoid(
    `/api/text-contents/${id}`,
    'Could not remove this text from the publication.',
    { method: 'DELETE' },
  )
}
