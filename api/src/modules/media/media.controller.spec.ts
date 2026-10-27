import { BadRequestException } from '@nestjs/common'
import { AssetService } from '../asset/asset.service.js'
import { MediaController } from './media.controller.js'

describe('MediaController', () => {
  const assetService = {
    create: vi.fn(),
    remove: vi.fn(),
  }
  let controller: MediaController

  beforeEach(() => {
    vi.clearAllMocks()
    assetService.create.mockImplementation(async (asset) => ({
      id: assetService.create.mock.calls.length,
      ...asset,
    }))
    controller = new MediaController(assetService as unknown as AssetService)
  })

  it('creates a global asset for every uploaded file', async () => {
    const files = [
      {
        filename: 'cover-a1b2c3d4.jpg',
        originalname: 'cover.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
      {
        filename: 'trailer-b2c3d4e5.mp4',
        originalname: 'trailer.mp4',
        mimetype: 'video/mp4',
        size: 2048,
      },
    ] as Express.Multer.File[]

    await expect(controller.uploadAssets(files)).resolves.toHaveLength(2)
    expect(assetService.create).toHaveBeenNthCalledWith(1, {
      type: 'Image',
      url: '/media/assets/cover-a1b2c3d4.jpg',
      name: 'cover.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
    })
    expect(assetService.create).toHaveBeenNthCalledWith(2, {
      type: 'Video',
      url: '/media/assets/trailer-b2c3d4e5.mp4',
      name: 'trailer.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 2048,
    })
  })

  it('rejects an empty upload', async () => {
    await expect(controller.uploadAssets([])).rejects.toBeInstanceOf(BadRequestException)
    expect(assetService.create).not.toHaveBeenCalled()
  })
})