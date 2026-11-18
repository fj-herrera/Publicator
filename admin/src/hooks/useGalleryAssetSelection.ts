import { useState } from 'react'
import type { Asset } from '../entities/asset'
import { getAssetName } from '../components/assets/asset-utils'
import { deleteAsset } from '../services/assets.service'
import { invalidate } from '../state/resource-invalidation'

type UseGalleryAssetSelectionProps = {
  assets: Asset[]
  visibleAssets: Asset[]
  hasAssetAssociations: (asset: Asset) => boolean
  selectedAssetId: number | null
  onSelectedAssetDeleted: () => void
}

function useGalleryAssetSelection({
  assets,
  visibleAssets,
  hasAssetAssociations,
  selectedAssetId,
  onSelectedAssetDeleted,
}: UseGalleryAssetSelectionProps) {
  const [isSelectingAssets, setIsSelectingAssets] = useState(false)
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(() => new Set())
  const [pendingDeleteAssets, setPendingDeleteAssets] = useState<Asset[]>([])
  const [isDeletingAsset, setIsDeletingAsset] = useState(false)
  const [deleteAssetError, setDeleteAssetError] = useState('')

  const deletableVisibleAssets = visibleAssets.filter((asset) => !hasAssetAssociations(asset))
  const selectedDeletableAssets = assets.filter(
    (asset) => selectedAssetIds.has(asset.id) && !hasAssetAssociations(asset),
  )
  const allVisibleDeletableAssetsSelected = deletableVisibleAssets.length > 0
    && deletableVisibleAssets.every((asset) => selectedAssetIds.has(asset.id))

  const toggleVisibleAssetSelection = () => {
    const visibleIds = deletableVisibleAssets.map((asset) => asset.id)
    const allVisibleSelected = visibleIds.length > 0
      && visibleIds.every((id) => selectedAssetIds.has(id))

    setSelectedAssetIds((currentIds) => {
      const nextIds = new Set(currentIds)
      visibleIds.forEach((id) => {
        if (allVisibleSelected) {
          nextIds.delete(id)
        } else {
          nextIds.add(id)
        }
      })
      return nextIds
    })
  }

  const setAssetSelected = (asset: Asset, selected: boolean) => {
    if (selected && hasAssetAssociations(asset)) return

    setSelectedAssetIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (selected) {
        nextIds.add(asset.id)
      } else {
        nextIds.delete(asset.id)
      }
      return nextIds
    })
  }

  const requestDeleteAssets = (requestedAssets: Asset[]) => {
    const deletableAssets = requestedAssets.filter((asset) => !hasAssetAssociations(asset))
    if (deletableAssets.length === 0) return

    setDeleteAssetError('')
    setPendingDeleteAssets(deletableAssets)
  }

  const requestDeleteSelectedAssets = () => requestDeleteAssets(selectedDeletableAssets)

  const closeDeleteAssetDialog = () => {
    if (!isDeletingAsset) {
      setPendingDeleteAssets([])
      setDeleteAssetError('')
    }
  }

  const confirmDeleteAssets = async () => {
    if (!pendingDeleteAssets.length) return

    const assetsToDelete = pendingDeleteAssets.filter((asset) => !hasAssetAssociations(asset))
    if (assetsToDelete.length === 0) {
      setPendingDeleteAssets([])
      return
    }

    setIsDeletingAsset(true)
    setDeleteAssetError('')

    const results: PromiseSettledResult<void>[] = []
    for (let index = 0; index < assetsToDelete.length; index += 10) {
      const batch = assetsToDelete.slice(index, index + 10)
      results.push(...await Promise.allSettled(
        batch.map((asset) => deleteAsset(asset.id)),
      ))
    }

    const deletedIds = new Set<number>()
    const failedAssets: Asset[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        deletedIds.add(assetsToDelete[index].id)
      } else {
        failedAssets.push(assetsToDelete[index])
      }
    })

    if (deletedIds.size > 0) {
      invalidate('assets')
      setSelectedAssetIds((currentIds) => new Set(
        [...currentIds].filter((id) => !deletedIds.has(id)),
      ))
      if (selectedAssetId !== null && deletedIds.has(selectedAssetId)) {
        onSelectedAssetDeleted()
      }
    }

    setIsDeletingAsset(false)
    if (failedAssets.length) {
      const names = failedAssets.map(getAssetName)
      setDeleteAssetError(
        `Could not delete ${names.length === 1 ? `"${names[0]}"` : `${names.length} assets: ${names.join(', ')}`}. They may still have associations.`,
      )
      setPendingDeleteAssets(failedAssets)
    } else {
      setPendingDeleteAssets([])
      setDeleteAssetError('')
      setIsSelectingAssets(false)
      setSelectedAssetIds(new Set())
    }
  }

  const cancelAssetSelection = () => {
    setIsSelectingAssets(false)
    setSelectedAssetIds(new Set())
  }

  return {
    allVisibleDeletableAssetsSelected,
    cancelAssetSelection,
    closeDeleteAssetDialog,
    confirmDeleteAssets,
    deleteAssetError,
    deletableVisibleAssets,
    isDeletingAsset,
    isSelectingAssets,
    pendingDeleteAssets,
    requestDeleteAssets,
    requestDeleteSelectedAssets,
    selectedAssetIds,
    selectedDeletableAssets,
    setAssetSelected,
    setIsSelectingAssets,
    toggleVisibleAssetSelection,
  }
}

export default useGalleryAssetSelection
