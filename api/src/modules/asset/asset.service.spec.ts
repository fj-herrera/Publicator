import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Asset } from './entities/asset.entity.js'
import { AssetService } from './asset.service.js'
import { Dimensions } from '../dimensions/entities/dimensions.entity.js'
import { MediaStorageService } from '../media/media-storage.service.js'

describe('AssetService', () => {
  let service: AssetService
  let assetRepository: {
    create: ReturnType<typeof vi.fn>
    findOneBy: ReturnType<typeof vi.fn>
    manager: { transaction: ReturnType<typeof vi.fn> }
  }
  let manager: {
    findOne: ReturnType<typeof vi.fn>
    findOneBy?: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let mediaStorage: {
    assertAssignable: ReturnType<typeof vi.fn>
    deleteUnreferencedFiles: ReturnType<typeof vi.fn>
  }
  let dimensionsRepository: {
    findOneBy: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    assetRepository = {
      create: vi.fn((asset) => asset),
      findOneBy: vi.fn(),
      manager: { transaction: vi.fn((callback) => callback(manager)) },
    }
    manager = {
      findOne: vi.fn(),
      save: vi.fn(async (_entity, asset) => asset),
      delete: vi.fn(async () => ({ affected: 1 })),
    }
    mediaStorage = {
      assertAssignable: vi.fn().mockResolvedValue(undefined),
      deleteUnreferencedFiles: vi.fn().mockResolvedValue(undefined),
    }
    dimensionsRepository = {
      findOneBy: vi.fn(),
      create: vi.fn((dimensions) => dimensions),
      save: vi.fn(async (dimensions) => ({ id: 1, ...dimensions })),
    }
    service = new AssetService(
      assetRepository as unknown as Repository<Asset>,
      dimensionsRepository as unknown as Repository<Dimensions>,
      mediaStorage as unknown as MediaStorageService,
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

  it('validates and locks the file URL before saving a new asset', async () => {
    await service.create({ type: 'Image', url: '/media/assets/photo.jpg', name: 'photo.jpg' } as never)

    expect(mediaStorage.assertAssignable).toHaveBeenCalledWith('/media/assets/photo.jpg', 'assets', manager)
    expect(mediaStorage.assertAssignable.mock.invocationCallOrder[0]).toBeLessThan(
      manager.save.mock.invocationCallOrder[0],
    )
  })

  it('does not save the asset when its file is rejected on create', async () => {
    mediaStorage.assertAssignable.mockRejectedValue(new Error('missing file'))

    await expect(
      service.create({ type: 'Image', url: '/media/assets/gone.jpg', name: 'gone.jpg' } as never),
    ).rejects.toThrow('missing file')
    expect(manager.save).not.toHaveBeenCalled()
  })

  describe('update', () => {
    const oldUrl = '/media/assets/old.jpg'
    const lockedRead = { lock: { mode: 'pessimistic_write' }, loadEagerRelations: false }
    const dbError = (code: string) => Object.assign(new Error(`pg ${code}`), { code })
    const existing = (overrides: Partial<Asset> = {}) =>
      ({ id: 1, type: 'Image', name: 'a', url: oldUrl, ...overrides }) as Asset

    it('reads and locks the asset row inside the transaction', async () => {
      manager.findOne.mockResolvedValue(existing())

      await service.update(1, { name: 'b' })

      expect(manager.findOne).toHaveBeenCalledWith(Asset, { where: { id: 1 }, ...lockedRead })
      expect(assetRepository.findOneBy).not.toHaveBeenCalled()
    })

    it('reports a missing asset before validating the DTO', async () => {
      manager.findOne.mockResolvedValue(null)

      await expect(service.update(9, {})).rejects.toBeInstanceOf(NotFoundException)
      expect(manager.save).not.toHaveBeenCalled()
      expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled()
    })

    it('rejects an empty update of an existing asset', async () => {
      manager.findOne.mockResolvedValue(existing())

      await expect(service.update(1, {})).rejects.toBeInstanceOf(BadRequestException)
      expect(manager.save).not.toHaveBeenCalled()
    })

    it('updates the name without validating or cleaning files', async () => {
      const asset = existing()
      manager.findOne.mockResolvedValue(asset)

      await service.update(1, { name: 'new-name.jpg' })

      expect(asset.name).toBe('new-name.jpg')
      expect(asset.url).toBe(oldUrl)
      expect(manager.save).toHaveBeenCalledWith(Asset, asset)
      expect(mediaStorage.assertAssignable).not.toHaveBeenCalled()
      expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledExactlyOnceWith([])
    })

    it('does not revalidate or clean when the URL is sent unchanged', async () => {
      manager.findOne.mockResolvedValue(existing())

      await service.update(1, { url: oldUrl })

      expect(mediaStorage.assertAssignable).not.toHaveBeenCalled()
      expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledWith([])
    })

    it('validates the new URL before saving and cleans the old file after the transaction', async () => {
      manager.findOne.mockResolvedValue(existing())

      await service.update(1, { url: '/media/assets/new.jpg' })

      expect(mediaStorage.assertAssignable).toHaveBeenCalledExactlyOnceWith('/media/assets/new.jpg', 'assets', manager)
      expect(mediaStorage.assertAssignable.mock.invocationCallOrder[0]).toBeLessThan(
        manager.save.mock.invocationCallOrder[0],
      )
      expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledExactlyOnceWith([
        { url: oldUrl, folder: 'assets' },
      ])
      expect(mediaStorage.deleteUnreferencedFiles.mock.invocationCallOrder[0]).toBeGreaterThan(
        assetRepository.manager.transaction.mock.invocationCallOrder[0],
      )
    })

    it('schedules cleanup of an external previous URL, which the storage ignores', async () => {
      manager.findOne.mockResolvedValue(existing({ url: 'https://example.test/a.jpg' }))

      await service.update(1, { url: '/media/assets/new.jpg' })

      expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledWith([
        { url: 'https://example.test/a.jpg', folder: 'assets' },
      ])
    })

    it('does not save or clean anything when the new file is rejected', async () => {
      manager.findOne.mockResolvedValue(existing())
      mediaStorage.assertAssignable.mockRejectedValue(new Error('missing file'))

      await expect(service.update(1, { url: '/media/assets/gone.jpg' })).rejects.toThrow('missing file')
      expect(manager.save).not.toHaveBeenCalled()
      expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled()
    })

    it('never deletes the previous file when the COMMIT fails', async () => {
      manager.findOne.mockResolvedValue(existing())
      assetRepository.manager.transaction.mockImplementation(async (callback) => {
        await callback(manager)
        throw new Error('commit failed')
      })

      await expect(service.update(1, { url: '/media/assets/new.jpg' })).rejects.toThrow('commit failed')
      expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled()
    })

    it('reports a duplicate URL as a conflict without cleaning anything', async () => {
      manager.findOne.mockResolvedValue(existing())
      manager.save.mockRejectedValue(dbError('23505'))

      await expect(service.update(1, { url: '/media/assets/new.jpg' })).rejects.toBeInstanceOf(ConflictException)
      expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled()
    })

    it('resolves dimensions inside the transaction and reports unknown ones', async () => {
      const dimensions = { id: 5, width: 10, height: 20 }
      const asset = existing()
      manager.findOne.mockResolvedValue(asset)
      manager.findOneBy = vi.fn().mockResolvedValueOnce(dimensions).mockResolvedValueOnce(null)

      await service.update(1, { dimensionsId: 5 })
      expect(manager.findOneBy).toHaveBeenCalledWith(Dimensions, { id: 5 })
      expect(asset.dimensions).toBe(dimensions)

      await expect(service.update(1, { dimensionsId: 99 })).rejects.toThrow('Dimensions with id 99 not found')
      expect(manager.save).toHaveBeenCalledTimes(1)
    })
  })

  it('deletes an unassociated asset and then its stored file after commit', async () => {
    manager.findOne.mockResolvedValue({ id: 1, url: '/media/assets/asset-a1b2c3d4.jpg' })

    await expect(service.remove(1)).resolves.toBeUndefined()
    expect(manager.findOne).toHaveBeenCalledWith(Asset, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
      loadEagerRelations: false,
    })
    expect(manager.delete).toHaveBeenCalledWith(Asset, 1)
    expect(mediaStorage.deleteUnreferencedFiles).toHaveBeenCalledExactlyOnceWith([
      { url: '/media/assets/asset-a1b2c3d4.jpg', folder: 'assets' },
    ])
  })

  it('never deletes the file when the COMMIT fails', async () => {
    manager.findOne.mockResolvedValue({ id: 1, url: '/media/assets/asset-a1b2c3d4.jpg' })
    assetRepository.manager.transaction.mockImplementation(async (callback) => {
      await callback(manager)
      throw new Error('commit failed')
    })

    await expect(service.remove(1)).rejects.toThrow('commit failed')
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled()
  })

  it('reports when the asset to delete does not exist', async () => {
    manager.findOne.mockResolvedValue(null)

    await expect(service.remove(9)).rejects.toThrow('Asset with id 9 not found')
    expect(manager.delete).not.toHaveBeenCalled()
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled()
  })

  it('rejects deleting an asset that still has associations and keeps its file', async () => {
    manager.findOne.mockResolvedValue({ id: 1, url: '/media/assets/asset-a1b2c3d4.jpg' })
    manager.delete.mockRejectedValue(
      Object.assign(new Error('foreign key violation'), { code: '23503' }),
    )

    await expect(service.remove(1)).rejects.toThrow(
      'Asset cannot be deleted while it has associations.',
    )
    expect(mediaStorage.deleteUnreferencedFiles).not.toHaveBeenCalled()
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