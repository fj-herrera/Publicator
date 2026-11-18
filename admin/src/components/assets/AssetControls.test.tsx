import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import AssetControls from './AssetControls'

function makeProps(overrides: Partial<ComponentProps<typeof AssetControls>> = {}) {
  return {
    query: 'initial',
    selectedType: 'image',
    assetTypes: ['document', 'image'],
    isSelectingAssets: false,
    visibleDeletableCount: 2,
    selectedDeletableCount: 0,
    allVisibleDeletableAssetsSelected: false,
    isDeletingAsset: false,
    onQueryChange: vi.fn(),
    onTypeChange: vi.fn(),
    onStartSelection: vi.fn(),
    onToggleVisibleSelection: vi.fn(),
    onDeleteSelected: vi.fn(),
    onCancelSelection: vi.fn(),
    ...overrides,
  }
}

describe('AssetControls', () => {
  it('displays controlled search and type options and delegates changes', () => {
    const props = makeProps()
    const { rerender } = render(<AssetControls {...props} />)
    const search = screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search assets' })
    const filter = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Filter by asset type' })

    expect(search.value).toBe('initial')
    expect(filter.value).toBe('image')
    expect(within(filter).getAllByRole('option').map((option) => option.textContent))
      .toEqual(['All types', 'document', 'image'])
    fireEvent.change(search, { target: { value: 'new query' } })
    fireEvent.change(filter, { target: { value: 'all' } })
    expect(props.onQueryChange).toHaveBeenCalledWith('new query')
    expect(props.onTypeChange).toHaveBeenCalledWith('all')

    rerender(<AssetControls {...props} query="new query" selectedType="all" />)
    expect(search.value).toBe('new query')
    expect(filter.value).toBe('all')
  })

  it('delegates selection actions and displays the current selection state', () => {
    const props = makeProps()
    const { rerender } = render(<AssetControls {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Select assets' }))
    expect(props.onStartSelection).toHaveBeenCalledOnce()

    rerender(<AssetControls {...props} isSelectingAssets selectedDeletableCount={1} />)
    const toggle = screen.getByRole('button', { name: 'Select visible unassociated (2)' })
    expect(toggle.getAttribute('title')).toBe('Select or deselect unassociated assets currently visible.')
    expect(screen.getByText('1 selected').getAttribute('aria-live')).toBe('polite')
    fireEvent.click(toggle)
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel selection' }))
    expect(props.onToggleVisibleSelection).toHaveBeenCalledOnce()
    expect(props.onDeleteSelected).toHaveBeenCalledOnce()
    expect(props.onCancelSelection).toHaveBeenCalledOnce()

    rerender(<AssetControls {...props} isSelectingAssets allVisibleDeletableAssetsSelected />)
    expect(screen.getByRole('button', { name: 'Deselect visible unassociated (2)' })).toBeDefined()
  })

  it('disables selection with no eligible visible assets and deletion when empty or deleting', () => {
    const props = makeProps({ isSelectingAssets: true, visibleDeletableCount: 0 })
    const { rerender } = render(<AssetControls {...props} />)
    const toggle = screen.getByRole<HTMLButtonElement>('button', { name: 'Select visible unassociated (0)' })
    const remove = screen.getByRole<HTMLButtonElement>('button', { name: 'Delete selected' })
    expect(toggle.disabled).toBe(true)
    expect(remove.disabled).toBe(true)
    toggle.click()
    remove.click()
    expect(props.onToggleVisibleSelection).not.toHaveBeenCalled()
    expect(props.onDeleteSelected).not.toHaveBeenCalled()

    rerender(<AssetControls {...props} selectedDeletableCount={1} isDeletingAsset />)
    expect(remove.disabled).toBe(true)
    remove.click()
    expect(props.onDeleteSelected).not.toHaveBeenCalled()
    rerender(<AssetControls {...props} selectedDeletableCount={1} />)
    expect(remove.disabled).toBe(false)
  })
})
