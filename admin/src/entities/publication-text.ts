export type PublicationTextFormat = 'PLAIN' | 'MD'

export type PublicationTextRecord = {
  id: number
  type: string
  content: {
    id: number
    publication: { id: number } | null
  }
  text: {
    id: number
    text: string
    format: PublicationTextFormat
  } | null
}

export type PublicationTextValues = {
  associations: PublicationTextRecord[]
  typeOptions: string[]
  textType: string
  format: PublicationTextFormat
  plainContent: string
  markdownContent: string
  editingAssociationId: number | null
  pendingOperation: boolean
}
