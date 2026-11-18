import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Asset } from '../entities/asset'
import useGalleryAssetSelection from './useGalleryAssetSelection'

const { deleteAsset, invalidate } = vi.hoisted(() => ({
  deleteAsset: vi.fn(),
  invalidate: vi.fn(),
}))

vi.mock('../services/assets.service', () => ({ deleteAsset }))
vi.mock('../state/resource-invalidation', () => ({ invalidate }))

const makeAsset = (id: number): Asset => ({
  id,
  type: 'image',
  url: `/media/${id}.png`,
  name: `Asset ${id}`,
  dimensions: null,
})

const renderSelection = (
  assets: Asset[],
  visibleAssets = assets,
  hasAssetAssociations: (asset: Asset) => boolean = () => false,
  selectedAssetId: number | null = null,
  onSelectedAssetDeleted = vi.fn(),
) => renderHook(() => useGalleryAssetSelection({
  assets,
  visibleAssets,
  hasAssetAssociations,
  selectedAssetId,
  onSelectedAssetDeleted,
}))

describe('useGalleryAssetSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('selects and deselects individual and all visible unassociated assets', () => {
    const assets = [makeAsset(1), makeAsset(2), makeAsset(3)]
    const hasAssociations = (asset: Asset) => asset.id === 3
    const { result } = renderSelection(assets, assets, hasAssociations)

    act(() => {
      result.current.setIsSelectingAssets(true)
      result.current.setAssetSelected(assets[0], true)
      result.current.setAssetSelected(assets[2], true)
    })
    expect(result.current.selectedAssetIds).toEqual(new Set([1]))

    act(() => result.current.toggleVisibleAssetSelection())
    expect(result.current.selectedAssetIds).toEqual(new Set([1, 2]))
    expect(result.current.allVisibleDeletableAssetsSelected).toBe(true)

    act(() => result.current.toggleVisibleAssetSelection())
    expect(result.current.selectedAssetIds).toEqual(new Set())
  })

  it('keeps failed deletions selected and reports partial failures', async () => {
    const assets = [makeAsset(1), makeAsset(2)]
    const onSelectedAssetDeleted = vi.fn()
    vi.mocked(deleteAsset).mockImplementation(async (id) => {
      if (id === 2) throw new Error('Associated asset')
    })
    const { result } = renderSelection(assets, assets, () => false, 1, onSelectedAssetDeleted)

    act(() => {
      result.current.setIsSelectingAssets(true)
      result.current.toggleVisibleAssetSelection()
    })
    act(() => {
      result.current.requestDeleteSelectedAssets()
    })
    await act(async () => result.current.confirmDeleteAssets())

    expect(deleteAsset).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledWith('assets')
    expect(result.current.selectedAssetIds).toEqual(new Set([2]))
    expect(result.current.pendingDeleteAssets).toEqual([assets[1]])
    expect(result.current.deleteAssetError).toContain('Asset 2')
    expect(result.current.isSelectingAssets).toBe(true)
    expect(onSelectedAssetDeleted).toHaveBeenCalledOnce()
  })
})
