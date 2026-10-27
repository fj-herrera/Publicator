import { getAssetFileType } from './asset-file-types.js'

describe('getAssetFileType', () => {
  it.each([
    ['image/jpeg', 'Image'],
    ['image/png', 'Image'],
    ['image/webp', 'Image'],
    ['image/gif', 'Image'],
    ['image/svg+xml', 'Image'],
    ['video/mp4', 'Video'],
    ['video/webm', 'Video'],
    ['audio/mpeg', 'Audio'],
    ['audio/wav', 'Audio'],
    ['audio/ogg', 'Audio'],
    ['application/pdf', 'Document'],
  ])('maps %s to %s', (mimeType, assetType) => {
    expect(getAssetFileType(mimeType)).toBe(assetType)
  })

  it('does not classify unsupported MIME types', () => {
    expect(getAssetFileType('model/gltf-binary')).toBeUndefined()
    expect(getAssetFileType('application/zip')).toBeUndefined()
  })
})