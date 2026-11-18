import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Asset } from '../../entities/asset'
import AssetGrid from './AssetGrid'

const assets: Asset[] = [
  { id: 1, name: 'hero.png', type: 'image', url: '/media/hero.png', dimensions: null },
  { id: 2, name: 'document.pdf', type: 'document', url: '/media/document.pdf', dimensions: null },
]

function makeProps(overrides: Partial<ComponentProps<typeof AssetGrid>> = {}) {
  return {
    assets,
    isSelectingAssets: false,
    selectedAssetIds: new Set<number>(),
    failedPreviews: new Set<number>(),
    actionAssetId: null,
    getAssetAssociationCount: (asset: Asset) => asset.id === 2 ? 1 : 0,
    hasAssetAssociations: (asset: Asset) => asset.id === 2,
    onAssetSelectionChange: vi.fn(),
    onPreviewError: vi.fn(),
    onShowActions: vi.fn(),
    onCloseActions: vi.fn(),
    onEdit: vi.fn(),
    onView: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  }
}

describe('AssetGrid', () => {
  it('renders visible cards, associations and preview failures', () => {
    const props = makeProps()
    const { rerender } = render(<AssetGrid {...props} />)

    expect(screen.getByRole('region', { name: 'Assets' })).toBeDefined()
    expect(screen.getByText('hero.png')).toBeDefined()
    expect(screen.getByText('document.pdf')).toBeDefined()
    expect(screen.getByText('PNG')).toBeDefined()
    expect(screen.getByText('PDF')).toBeDefined()
    expect(screen.getByText('No associations')).toBeDefined()
    expect(screen.getByText('1 association')).toBeDefined()
    const image = screen.getByRole('presentation', { hidden: true })
    expect(image.getAttribute('src')).toBe('/media/hero.png')
    fireEvent.error(image)
    expect(props.onPreviewError).toHaveBeenCalledWith(assets[0])

    rerender(<AssetGrid {...props} failedPreviews={new Set([1])} />)
    expect(screen.queryByRole('presentation', { hidden: true })).toBeNull()
  })

  it('delegates selection and prevents selection or removal of associated assets', () => {
    const props = makeProps({ isSelectingAssets: true, actionAssetId: 2 })
    const { rerender } = render(<AssetGrid {...props} />)

    const selection = screen.getByRole('checkbox', { name: 'Select hero.png' })
    fireEvent.click(selection)
    expect(props.onAssetSelectionChange).toHaveBeenCalledWith(assets[0], true)
    rerender(<AssetGrid {...props} selectedAssetIds={new Set([1])} />)
    expect((selection as HTMLInputElement).checked).toBe(true)
    fireEvent.click(selection)
    expect(props.onAssetSelectionChange).toHaveBeenCalledWith(assets[0], false)

    const associated = screen.getByRole('checkbox', { name: 'Select document.pdf' })
    expect((associated as HTMLInputElement).disabled).toBe(true)
    expect(props.onAssetSelectionChange).toHaveBeenCalledTimes(2)
    const remove = screen.getByRole('menuitem', { name: 'Remove' })
    expect((remove as HTMLButtonElement).disabled).toBe(true)
    expect(props.onRemove).not.toHaveBeenCalled()
  })

  it('delegates menu opening, viewing, editing, removing and cancellation', () => {
    const props = makeProps()
    const { rerender } = render(<AssetGrid {...props} />)

    const card = screen.getByText('hero.png').closest('article')
    if (!card) throw new Error('Asset card not found')
    const actionButtons = within(card).getAllByRole('button', { name: 'Show actions for hero.png' })
    fireEvent.click(actionButtons[0])
    fireEvent.click(actionButtons[1])
    expect(props.onShowActions).toHaveBeenCalledTimes(2)
    expect(props.onShowActions).toHaveBeenCalledWith(assets[0])

    rerender(<AssetGrid {...props} actionAssetId={1} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'View' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cancel' }))
    expect(props.onView).toHaveBeenCalledWith(assets[0])
    expect(props.onEdit).toHaveBeenCalledWith(assets[0])
    expect(props.onRemove).toHaveBeenCalledWith(assets[0])
    expect(props.onCloseActions).toHaveBeenCalledOnce()
  })
})
