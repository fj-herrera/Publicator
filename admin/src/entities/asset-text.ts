export type TextFormat = 'PLAIN' | 'MD'

export interface AssetText {
  id: number
  type: string
  asset: { id: number }
  text: { id: number; text: string; format: TextFormat }
}

export interface TextContentUsage {
  id: number
  text: { id: number } | null
}

export interface AssetTextDraft {
  key: number
  // null while the text has not been saved yet.
  id: number | null
  role: string
  text: string
  isRemoved: boolean
  error?: string
}
