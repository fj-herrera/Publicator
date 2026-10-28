import { BadRequestException } from '@nestjs/common'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { AssetService } from '../asset/asset.service.js'
import { MediaController } from './media.controller.js'

describe('MediaController', () => {
  const assetService = {
    create: vi.fn(),
    findOrCreateDimensions: vi.fn(),
    remove: vi.fn(),
  }
  let controller: MediaController

  beforeEach(() => {
    vi.clearAllMocks()
    assetService.create.mockImplementation(async (asset) => ({
      id: assetService.create.mock.calls.length,
      ...asset,
    }))
    assetService.findOrCreateDimensions.mockResolvedValue({
      id: 8,
      width: 1920,
      height: 90,
    })
    controller = new MediaController(assetService as unknown as AssetService)
  })

  it('creates assets and associates detected image dimensions from the catalog', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'publicator-assets-'))
    const imagePath = join(directory, 'cover.jpg')

    try {
      const image = await sharp({
        create: {
          width: 1920,
          height: 90,
          channels: 3,
          background: '#ffffff',
        },
      }).jpeg().toBuffer()
      await writeFile(imagePath, image)

      const files = [
        {
          filename: 'cover-a1b2c3d4.jpg',
          originalname: 'cover.jpg',
          mimetype: 'image/jpeg',
          size: image.length,
          path: imagePath,
        },
        {
          filename: 'trailer-b2c3d4e5.mp4',
          originalname: 'trailer.mp4',
          mimetype: 'video/mp4',
          size: 2048,
          path: join(directory, 'trailer.mp4'),
        },
      ] as Express.Multer.File[]

      await expect(controller.uploadAssets(files)).resolves.toHaveLength(2)
      expect(assetService.findOrCreateDimensions).toHaveBeenCalledExactlyOnceWith(1920, 90)
      expect(assetService.create).toHaveBeenNthCalledWith(1, {
        type: 'Image',
        url: '/media/assets/cover-a1b2c3d4.jpg',
        name: 'cover.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: image.length,
        dimensionsId: 8,
      })
      expect(assetService.create).toHaveBeenNthCalledWith(2, {
        type: 'Video',
        url: '/media/assets/trailer-b2c3d4e5.mp4',
        name: 'trailer.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 2048,
      })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('rejects an empty upload', async () => {
    await expect(controller.uploadAssets([])).rejects.toBeInstanceOf(BadRequestException)
    expect(assetService.create).not.toHaveBeenCalled()
  })
})