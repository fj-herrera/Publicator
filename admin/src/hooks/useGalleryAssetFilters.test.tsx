import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Asset, AssetCollectionRelation, PublicationAssetRelation } from '../entities/asset'
import type { AssetRelations } from './useGalleryData'
import useGalleryAssetFilters from './useGalleryAssetFilters'

const assets: Asset[] = [
  { id: 1, name: 'Mountain View', type: 'image', url: '/media/first.png', dimensions: null },
  { id: 2, name: 'Other', type: 'document', url: '/files/report.pdf', dimensions: null },
  { id: 3, name: null, type: 'image', url: '/media/Coast%20Photo.jpg', dimensions: null },
  { id: 4, name: 'Mountain Notes', type: 'Image', url: '/files/notes.txt', dimensions: null },
]

const relations: Record<number, AssetRelations> = {
  1: {
    publications: [{
      id: 10,
      role: 'exclusive-role',
      asset: { id: 1 },
      publication: { id: 20, meta: { title: 'Travel Journal', slug: 'summer-trip' } },
    }],
    collections: [{
      id: 11,
      role: 'cover',
      asset: { id: 1 },
      collection: { id: 30, name: 'Holiday Album', type: 'Portfolio' },
    }],
  },
  2: {
    publications: [{ id: 12, role: 'attachment', asset: { id: 2 }, publication: { id: 42 } }],
    collections: [{ id: 13, role: 'attachment', asset: { id: 2 }, collection: { id: 43, name: '' } }],
  },
}

function getRelationLabel(relation: PublicationAssetRelation | AssetCollectionRelation) {
  if ('publication' in relation) {
    return relation.publication.meta
      ? `${relation.publication.meta.title} / ${relation.publication.meta.slug}`
      : `Publication #${relation.publication.id}`
  }
  return relation.collection.name
    ? `${relation.collection.name} (${relation.collection.type ?? 'Collection'}, #${relation.collection.id})`
    : `Collection #${relation.collection.id}`
}

describe('useGalleryAssetFilters', () => {
  it('searches names, URLs, types and publication and collection labels with trimmed case-insensitive text', () => {
    const { result } = renderHook(() => useGalleryAssetFilters({ assets, relations, getRelationLabel }))
    const cases: [string, number[]][] = [
      ['  MOUNTAIN  ', [1, 4]],
      ['REPORT.PDF', [2]],
      ['  IMAGE ', [1, 3, 4]],
      ['coast photo.jpg', [3]],
      ['travel journal', [1]],
      ['summer-trip', [1]],
      ['holiday album', [1]],
      ['portfolio', [1]],
      ['publication #42', [2]],
      ['collection #43', [2]],
      ['exclusive-role', []],
      ['  ', [1, 2, 3, 4]],
    ]

    for (const [query, expectedIds] of cases) {
      act(() => result.current.setQuery(query))
      expect(result.current.visibleAssets.map((asset) => asset.id)).toEqual(expectedIds)
      expect(result.current.query).toBe(query)
    }
  })

  it('sorts distinct types and filters by exact type, with all restoring every asset', () => {
    const { result } = renderHook(() => useGalleryAssetFilters({ assets, relations, getRelationLabel }))
    expect(result.current.selectedType).toBe('all')
    expect(result.current.assetTypes).toEqual(['Image', 'document', 'image'])
    expect(result.current.visibleAssets).toEqual(assets)

    act(() => result.current.setSelectedType('image'))
    expect(result.current.visibleAssets.map((asset) => asset.id)).toEqual([1, 3])
    act(() => result.current.setSelectedType('Image'))
    expect(result.current.visibleAssets.map((asset) => asset.id)).toEqual([4])
    act(() => result.current.setSelectedType('all'))
    expect(result.current.visibleAssets).toEqual(assets)
  })

  it('combines both filters and recomputes when assets or relations change', () => {
    const { result, rerender } = renderHook(
      ({ currentAssets, currentRelations }) => useGalleryAssetFilters({
        assets: currentAssets,
        relations: currentRelations,
        getRelationLabel,
      }),
      { initialProps: { currentAssets: assets, currentRelations: relations } },
    )

    act(() => {
      result.current.setQuery('mountain')
      result.current.setSelectedType('image')
    })
    expect(result.current.visibleAssets.map((asset) => asset.id)).toEqual([1])
    act(() => result.current.setSelectedType('document'))
    expect(result.current.visibleAssets).toEqual([])
    act(() => {
      result.current.setQuery('holiday')
      result.current.setSelectedType('image')
    })
    expect(result.current.visibleAssets.map((asset) => asset.id)).toEqual([1])
    rerender({ currentAssets: assets.slice(0, 3), currentRelations: {} })
    expect(result.current.visibleAssets).toEqual([])
    expect(result.current.assetTypes).toEqual(['document', 'image'])
    expect(result.current.query).toBe('holiday')
    expect(result.current.selectedType).toBe('image')
  })
})
