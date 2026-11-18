import { useState } from 'react'
import { getAssetName } from '../components/assets/asset-utils'
import type { Asset, AssetCollectionRelation, PublicationAssetRelation } from '../entities/asset'
import type { AssetRelations } from './useGalleryData'

type UseGalleryAssetFiltersProps = {
  assets: Asset[]
  relations: Record<number, AssetRelations>
  getRelationLabel: (relation: PublicationAssetRelation | AssetCollectionRelation) => string
}

function useGalleryAssetFilters({ assets, relations, getRelationLabel }: UseGalleryAssetFiltersProps) {
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')

  const assetTypes = Array.from(new Set(assets.map((asset) => asset.type))).sort()
  const normalizedQuery = query.trim().toLowerCase()
  const visibleAssets = assets.filter((asset) => {
    const assetRelations = relations[asset.id] ?? { publications: [], collections: [] }
    const relationLabels = [
      ...assetRelations.publications.map(getRelationLabel),
      ...assetRelations.collections.map(getRelationLabel),
    ]
    const searchValues = [
      getAssetName(asset),
      asset.url,
      asset.type,
      ...relationLabels,
    ]
    const matchesQuery = searchValues.some((value) => value.toLowerCase().includes(normalizedQuery))

    return matchesQuery && (selectedType === 'all' || asset.type === selectedType)
  })

  return { query, setQuery, selectedType, setSelectedType, assetTypes, visibleAssets }
}

export default useGalleryAssetFilters
