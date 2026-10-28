import { Repository } from 'typeorm'
import { Asset } from './entities/asset.entity.js'
import { AssetService } from './asset.service.js'
import { Dimensions } from '../dimensions/entities/dimensions.entity.js'

describe('AssetService', () => {
  let service: AssetService
  let assetRepository: {
    create: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
    findOneBy: ReturnType<typeof vi.fn>
  }
  let dimensionsRepository: {
    findOneBy: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    assetRepository = {
      create: vi.fn((asset) => asset),
      save: vi.fn(async (asset) => asset),
      findOneBy: vi.fn(),
    }
    dimensionsRepository = {
      findOneBy: vi.fn(),
      create: vi.fn((dimensions) => dimensions),
      save: vi.fn(async (dimensions) => ({ id: 1, ...dimensions })),
    }
    service = new AssetService(
      assetRepository as unknown as Repository<Asset>,
      dimensionsRepository as unknown as Repository<Dimensions>,
    )
  })

  it('records an upload date when creating an asset', async () => {
    const beforeCreate = new Date()

    const asset = await service.create({
      type: 'Image',
      url: '/media/assets/photo.jpg',
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1200,
    })

    expect(asset.uploadedAt).toBeInstanceOf(Date)
    expect(asset.uploadedAt!.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
    expect(assetRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1200,
    }))
  })

  it('updates the asset name without changing its stored file URL', async () => {
    const asset = {
      id: 1,
      name: 'old-name.jpg',
      url: '/media/assets/stored-file.jpg',
    } as Asset
    assetRepository.findOneBy.mockResolvedValue(asset)

    await service.update(1, { name: 'new-name.jpg' })

    expect(asset.name).toBe('new-name.jpg')
    expect(asset.url).toBe('/media/assets/stored-file.jpg')
    expect(assetRepository.save).toHaveBeenCalledWith(asset)
  })

  it('reuses an existing dimensions catalog entry', async () => {
    const dimensions = { id: 4, width: 1920, height: 90 } as Dimensions
    dimensionsRepository.findOneBy.mockResolvedValue(dimensions)

    await expect(service.findOrCreateDimensions(1920, 90)).resolves.toBe(dimensions)
    expect(dimensionsRepository.create).not.toHaveBeenCalled()
    expect(dimensionsRepository.save).not.toHaveBeenCalled()
  })

  it('creates a dimensions catalog entry when the pair does not exist', async () => {
    dimensionsRepository.findOneBy.mockResolvedValue(null)

    await expect(service.findOrCreateDimensions(1920, 90)).resolves.toEqual({
      id: 1,
      width: 1920,
      height: 90,
    })
    expect(dimensionsRepository.create).toHaveBeenCalledWith({ width: 1920, height: 90 })
    expect(dimensionsRepository.save).toHaveBeenCalled()
  })
})