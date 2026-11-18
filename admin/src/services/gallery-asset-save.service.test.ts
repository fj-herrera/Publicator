import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AssetText, AssetTextDraft } from '../entities/asset-text'
import type { PublicationRelationDraft } from '../components/assets/PublicationRelationDrafts'

const mocks = vi.hoisted(() => ({
  createPublicationAsset: vi.fn(),
  updateAssetName: vi.fn(),
  updatePublicationAssetRole: vi.fn(),
  saveAssetTextDrafts: vi.fn(),
  invalidate: vi.fn(),
}))

vi.mock('./assets.service', () => ({
  createPublicationAsset: mocks.createPublicationAsset,
  updateAssetName: mocks.updateAssetName,
  updatePublicationAssetRole: mocks.updatePublicationAssetRole,
}))
vi.mock('./asset-texts.service', () => ({
  saveAssetTextDrafts: mocks.saveAssetTextDrafts,
}))
vi.mock('../state/resource-invalidation', () => ({ invalidate: mocks.invalidate }))

import { saveGalleryAssetEdit } from './gallery-asset-save.service'

const textDrafts: AssetTextDraft[] = [{
  key: 5,
  id: null,
  role: 'alt',
  text: 'Image description',
  isRemoved: false,
}]

const relationDrafts: PublicationRelationDraft[] = [{
  key: 8,
  publicationId: '4',
  role: 'Cover',
}]

const baseInput = {
  assetId: 12,
  originalName: 'image.png',
  assetName: ' image-renamed.png ',
  publicationRoles: [
    { id: 21, role: 'Cover' },
    { id: 22, role: 'Thumbnail' },
  ],
  editedPublicationRoles: { 21: 'Main cover', 22: 'Thumbnail' },
  newPublicationRelations: relationDrafts,
  assetTextDrafts: textDrafts,
  currentAssetTexts: [] as AssetText[],
}

describe('saveGalleryAssetEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updateAssetName.mockResolvedValue({ id: 12, name: 'image-renamed.png' })
    mocks.updatePublicationAssetRole.mockResolvedValue({})
    mocks.createPublicationAsset.mockResolvedValue({})
    mocks.saveAssetTextDrafts.mockResolvedValue({ failures: new Map(), hasChanges: true })
  })

  it('saves all edit sections and invalidates resources with confirmed writes', async () => {
    const result = await saveGalleryAssetEdit(baseInput)

    expect(mocks.updateAssetName).toHaveBeenCalledWith(12, 'image-renamed.png')
    expect(mocks.updatePublicationAssetRole).toHaveBeenCalledWith(21, 'Main cover')
    expect(mocks.createPublicationAsset).toHaveBeenCalledWith(12, 4, 'Cover')
    expect(mocks.saveAssetTextDrafts).toHaveBeenCalledWith(12, textDrafts, [])
    expect(result).toMatchObject({
      trimmedName: 'image-renamed.png',
      savedRoles: { 21: 'Main cover' },
      hasSaveFailures: false,
    })
    expect(result.failedDraftKeys).toEqual(new Set())
    expect(mocks.invalidate).toHaveBeenCalledWith('assets', 'publicationAssets', 'assetTexts')
  })

  it('returns only unsuccessful fields for retry after partial writes', async () => {
    mocks.updateAssetName.mockResolvedValue({ id: 12, name: 'image.png' })
    mocks.updatePublicationAssetRole
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Role update failed'))
    mocks.createPublicationAsset.mockRejectedValue(new Error('Relation create failed'))
    mocks.saveAssetTextDrafts.mockResolvedValue({
      failures: new Map([[5, 'Text update failed']]),
      hasChanges: true,
    })

    const result = await saveGalleryAssetEdit({
      ...baseInput,
      publicationRoles: [
        { id: 21, role: 'Cover' },
        { id: 22, role: 'Image' },
      ],
      editedPublicationRoles: { 21: 'Main cover', 22: 'Main image' },
    })

    expect(result.hasSaveFailures).toBe(true)
    expect(result.savedRoles).toEqual({ 21: 'Main cover' })
    expect(result.failedDraftKeys).toEqual(new Set([8]))
    expect(result.textResult.failures).toEqual(new Map([[5, 'Text update failed']]))
    expect(mocks.invalidate).toHaveBeenCalledWith('publicationAssets', 'assetTexts')
  })

  it('does not invalidate resources that were not confirmed written', async () => {
    mocks.updateAssetName.mockResolvedValue({ id: 12, name: 'image.png' })
    mocks.updatePublicationAssetRole.mockRejectedValue(new Error('Role update failed'))
    mocks.createPublicationAsset.mockRejectedValue(new Error('Relation create failed'))
    mocks.saveAssetTextDrafts.mockResolvedValue({ failures: new Map(), hasChanges: false })

    await saveGalleryAssetEdit(baseInput)

    expect(mocks.invalidate).not.toHaveBeenCalled()
  })
})
