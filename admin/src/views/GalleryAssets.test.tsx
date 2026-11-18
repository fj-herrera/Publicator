import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GalleryAssets from './GalleryAssets'

vi.mock('../hooks/useGalleryData', () => ({
  default: () => ({
    assets: [{ id: 1, name: 'First', type: 'image', url: '/first.png', dimensions: null }],
    publications: [], relations: {}, assetTexts: {},
    isLoading: false, isRefreshing: false, error: '', retry: vi.fn(),
  }),
}))

describe('GalleryAssets', () => {
  it('keeps detail editing state while inactive and delegates tab navigation', () => {
    const onTabChange = vi.fn()
    const renderTabs = (onChange: (value: string) => void, onCreate: () => void) => (
      <>
        <button onClick={() => onChange('collections')} type="button">Collections</button>
        <button onClick={onCreate} type="button">Create Asset</button>
      </>
    )
    const { rerender } = render(<GalleryAssets active onTabChange={onTabChange} renderTabs={renderTabs} />)
    fireEvent.click(screen.getByRole('button', { name: 'Collections' }))
    expect(onTabChange).toHaveBeenCalledWith('collections')
    fireEvent.click(screen.getAllByRole('button', { name: 'Show actions for First' })[0])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(screen.queryByRole('button', { name: 'Collections' })).toBeNull()
    const name = screen.getByRole<HTMLInputElement>('textbox', { name: 'File name' })
    fireEvent.change(name, { target: { value: 'Edited name' } })

    rerender(<GalleryAssets active={false} onTabChange={onTabChange} renderTabs={renderTabs} />)
    expect(screen.queryByRole('textbox', { name: 'File name' })).toBeNull()
    rerender(<GalleryAssets active onTabChange={onTabChange} renderTabs={renderTabs} />)
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'File name' }).value).toBe('Edited name')
    fireEvent.click(screen.getByRole('button', { name: 'Close asset details' }))
    expect(screen.getByRole('button', { name: 'Collections' })).toBeDefined()
  })
})
