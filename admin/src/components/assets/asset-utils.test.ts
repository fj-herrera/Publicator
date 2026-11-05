import { describe, expect, it } from 'vitest'
import type { AssetText } from '../../entities/asset-text'
import { getAssetAssociationCount, hasAssetAssociations } from './asset-utils'

const noRelations = { publications: [], collections: [] }
const assetText: AssetText = {
  id: 1,
  type: 'alt',
  asset: { id: 1 },
  text: { id: 1, text: 'Description', format: 'PLAIN' },
}

describe('asset association summary', () => {
  it('counts publication and collection relations, but not texts', () => {
    const relations = {
      publications: [{
        id: 1,
        role: 'cover',
        asset: { id: 1 },
        publication: { id: 1 },
      }],
      collections: [{
        id: 2,
        role: 'image',
        asset: { id: 1 },
        collection: { id: 2, name: 'Main' },
      }],
    }

    expect(getAssetAssociationCount(relations)).toBe(2)
    expect(getAssetAssociationCount(noRelations)).toBe(0)
    expect(hasAssetAssociations(noRelations, [assetText])).toBe(true)
    expect(hasAssetAssociations(noRelations, [])).toBe(false)
  })
})
