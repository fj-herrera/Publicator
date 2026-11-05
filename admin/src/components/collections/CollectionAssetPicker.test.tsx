import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CollectionAssetPicker from './CollectionAssetPicker'

describe('CollectionAssetPicker', () => {
  it('explains when the gallery has no assets', () => {
    render(
      <CollectionAssetPicker
        assets={[]}
        hasGalleryAssets={false}
        onAdd={vi.fn()}
        onClose={vi.fn()}
        roles={[]}
      />,
    )

    expect(screen.getByText('There are no assets in the gallery yet.')).toBeTruthy()
  })

  it('explains when all gallery assets are already in the collection', () => {
    render(
      <CollectionAssetPicker
        assets={[]}
        hasGalleryAssets
        onAdd={vi.fn()}
        onClose={vi.fn()}
        roles={[]}
      />,
    )

    expect(screen.getByText('All the assets of the gallery are already in this collection.')).toBeTruthy()
  })
})
