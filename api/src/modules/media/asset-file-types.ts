export type AssetFileType = 'Image' | 'Video' | 'Audio' | 'Document'

export const assetFileTypes: Record<string, { extension: string; type: AssetFileType }> = {
  'image/gif': { extension: '.gif', type: 'Image' },
  'image/jpeg': { extension: '.jpg', type: 'Image' },
  'image/png': { extension: '.png', type: 'Image' },
  'image/svg+xml': { extension: '.svg', type: 'Image' },
  'image/webp': { extension: '.webp', type: 'Image' },
  'video/mp4': { extension: '.mp4', type: 'Video' },
  'video/webm': { extension: '.webm', type: 'Video' },
  'audio/mpeg': { extension: '.mp3', type: 'Audio' },
  'audio/mp3': { extension: '.mp3', type: 'Audio' },
  'audio/wav': { extension: '.wav', type: 'Audio' },
  'audio/x-wav': { extension: '.wav', type: 'Audio' },
  'audio/ogg': { extension: '.ogg', type: 'Audio' },
  'application/pdf': { extension: '.pdf', type: 'Document' },
}

export function getAssetFileType(mimeType: string): AssetFileType | undefined {
  return assetFileTypes[mimeType]?.type
}