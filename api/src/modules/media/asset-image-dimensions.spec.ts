import sharp from 'sharp'
import { readAssetImageDimensions } from './asset-image-dimensions.js'

describe('readAssetImageDimensions', () => {
  it('reads the original pixel dimensions from an image', async () => {
    const image = await sharp({
      create: {
        width: 1920,
        height: 90,
        channels: 3,
        background: '#ffffff',
      },
    }).jpeg().toBuffer()

    await expect(readAssetImageDimensions(image)).resolves.toEqual({
      width: 1920,
      height: 90,
    })
  })

  it('returns no dimensions for data that is not a readable image', async () => {
    await expect(readAssetImageDimensions(Buffer.from('not an image'))).resolves.toBeNull()
  })
})