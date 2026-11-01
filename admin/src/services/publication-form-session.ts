import type { PublicationFormValues, PublicationFormSectionId } from '../entities/publication-form'

export type PublicationFormSession = {
  publicationId: number
  metaId: number
  values: PublicationFormValues
  openSection: PublicationFormSectionId
}

let publicationFormSession: PublicationFormSession | null = null

export function savePublicationFormSession(session: PublicationFormSession) {
  publicationFormSession = session
}

export function getPublicationFormSession() {
  return publicationFormSession
}

export function clearPublicationFormSession() {
  publicationFormSession = null
}
