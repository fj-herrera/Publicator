import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Asset, AssetCollectionRelation, PublicationAssetRelation } from '../../entities/asset'
import type { AssetTextDraft } from '../../entities/asset-text'
import AssetDetailPanel from './AssetDetailPanel'

const asset: Asset = {
  id: 1,
  name: 'hero.png',
  type: 'image',
  url: '/media/hero.png',
  sizeBytes: 2048,
  uploadedAt: '2026-01-02T03:04:00.000Z',
  dimensions: { id: 1, width: 1200, height: 800 },
}

const publicationRelation: PublicationAssetRelation = {
  id: 11,
  role: 'Cover',
  asset: { id: 1 },
  publication: { id: 3, meta: { title: 'Home', slug: 'home' } },
}

const collectionRelation: AssetCollectionRelation = {
  id: 12,
  role: 'Gallery image',
  asset: { id: 1 },
  collection: { id: 5, name: 'Featured', type: 'Gallery' },
}

const textDrafts: AssetTextDraft[] = [{
  key: 7,
  id: 20,
  role: 'Alt',
  text: 'Hero image',
  isRemoved: false,
}]

const makeProps = (overrides: Partial<React.ComponentProps<typeof AssetDetailPanel>> = {}) => ({
  asset,
  publicationRelations: [publicationRelation],
  collectionRelations: [collectionRelation],
  publications: [{ id: 3, meta: { title: 'Home', slug: 'home' } }],
  publicationRoles: ['Cover', 'Thumbnail'],
  assetTextRoles: ['Alt', 'Caption'],
  assetTextDrafts: textDrafts,
  newPublicationRelations: [],
  editedAssetName: 'hero-edited.png',
  editedPublicationRoles: { 11: 'Cover' },
  isEditing: false,
  isSaving: false,
  isRefreshing: false,
  error: '',
  isPreviewFailed: false,
  getRelationLabel: (relation: PublicationAssetRelation | AssetCollectionRelation) => (
    'publication' in relation ? 'Home / home' : 'Featured (Gallery, #5)'
  ),
  onClose: vi.fn(),
  onSubmit: vi.fn((event) => event.preventDefault()),
  onPreviewError: vi.fn(),
  onAssetNameChange: vi.fn(),
  onPublicationRoleChange: vi.fn(),
  onAddPublicationRelation: vi.fn(),
  onChangePublicationRelation: vi.fn(),
  onRemovePublicationRelation: vi.fn(),
  onAddAssetText: vi.fn(),
  onChangeAssetText: vi.fn(),
  onRemoveAssetText: vi.fn(),
  onRestoreAssetText: vi.fn(),
  onCancelEdit: vi.fn(),
  ...overrides,
})

describe('AssetDetailPanel', () => {
  it('displays the selected asset and its associations in view mode', () => {
    render(<AssetDetailPanel {...makeProps()} />)

    expect(screen.getByRole('heading', { name: 'hero.png' })).toBeDefined()
    expect(screen.getByText('/media/hero.png')).toBeDefined()
    expect(screen.getByText('1200 x 800')).toBeDefined()
    expect(screen.getByText('2 KB')).toBeDefined()
    expect(screen.getByText('Home / home')).toBeDefined()
    expect(screen.getByText('Featured (Gallery, #5)')).toBeDefined()
    expect(screen.getByText('Hero image')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('delegates edit actions and form submission to the provided callbacks', () => {
    const props = makeProps({ isEditing: true })
    const { container } = render(<AssetDetailPanel {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close asset details' }))
    fireEvent.change(screen.getByLabelText('File name'), {
      target: { value: 'new-name.png' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Role for Home / home' }), {
      target: { value: 'Thumbnail' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add publication relation' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add text' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.submit(container.querySelector('form')!)

    expect(props.onClose).toHaveBeenCalledOnce()
    expect(props.onAssetNameChange).toHaveBeenCalledWith('new-name.png')
    expect(props.onPublicationRoleChange).toHaveBeenCalledWith(11, 'Thumbnail')
    expect(props.onAddPublicationRelation).toHaveBeenCalledOnce()
    expect(props.onAddAssetText).toHaveBeenCalledOnce()
    expect(props.onCancelEdit).toHaveBeenCalledOnce()
    expect(props.onSubmit).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined()
  })
})
