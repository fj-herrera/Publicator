import { fireEvent, render, screen } from '@testing-library/react'
import { useLocation, MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import Gallery from './Gallery'

vi.mock('../hooks/useGalleryData', () => ({
  default: () => ({
    assets: [
      { id: 1, name: 'First', type: 'image', url: '/first.png', dimensions: null },
      { id: 2, name: 'Second', type: 'document', url: '/second.pdf', dimensions: null },
    ],
    publications: [], relations: {}, assetTexts: {},
    isLoading: false, isRefreshing: false, error: '', retry: vi.fn(),
  }),
}))

vi.mock('../components/assets/AssetUploadForm', () => ({
  default: ({ onCancel }: { onCancel: () => void }) => (
    <button onClick={onCancel} type="button">Close upload</button>
  ),
}))

vi.mock('../views/Collections', () => ({
  default: ({
    isCreateFormOpen,
    onCreateFormClose,
    publicationCreationFlow,
    publicationEditFlow,
  }: {
    isCreateFormOpen: boolean
    onCreateFormClose: () => void
    publicationCreationFlow?: { publicationId: number; onReturn: (id?: number) => void }
    publicationEditFlow?: { collectionId: number; onReturn: () => void }
  }) => (
    <div>
      <span>Collections view</span>
      {isCreateFormOpen && <button onClick={onCreateFormClose} type="button">Close collection form</button>}
      {publicationCreationFlow && (
        <button onClick={() => publicationCreationFlow.onReturn(81)} type="button">
          Return created for {publicationCreationFlow.publicationId}
        </button>
      )}
      {publicationEditFlow && (
        <button onClick={publicationEditFlow.onReturn} type="button">
          Return edited {publicationEditFlow.collectionId}
        </button>
      )}
    </div>
  ),
}))

function ReturnLocation() {
  const location = useLocation()
  return <output>{JSON.stringify({ path: location.pathname, state: location.state })}</output>
}

function renderGallery(state: unknown = null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/gallery', state }]}>
      <Routes>
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/publications/edit" element={<ReturnLocation />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Gallery composition', () => {
  it('switches tabs, resets creation forms and preserves asset filters and selection', () => {
    renderGallery()
    fireEvent.click(screen.getByRole('button', { name: 'Create Collection' }))
    expect(screen.getByRole('button', { name: 'Close collection form' })).toBeDefined()
    fireEvent.click(screen.getByRole('tab', { name: 'Assets' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select assets' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select First' }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search assets' }), { target: { value: 'First' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by asset type' }), { target: { value: 'image' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Asset' }))
    expect(screen.getByRole('button', { name: 'Close upload' })).toBeDefined()

    fireEvent.click(screen.getByRole('tab', { name: 'Collections' }))
    expect(screen.queryByRole('button', { name: 'Close collection form' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close upload' })).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Assets' }))
    expect(screen.queryByRole('button', { name: 'Close upload' })).toBeNull()
    expect(screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search assets' }).value).toBe('First')
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Filter by asset type' }).value).toBe('image')
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Select First' }).checked).toBe(true)
    expect(screen.getByText('1 selected')).toBeDefined()
    expect(screen.queryByText('Second')).toBeNull()
  })

  it('preserves the publication collection creation flow and return state', () => {
    renderGallery({ publicationCollectionFlow: { publicationId: 7, returnPath: '/publications/edit' } })
    expect(screen.getByRole('button', { name: 'Close collection form' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Return created for 7' }))
    expect(screen.getByText(JSON.stringify({
      path: '/publications/edit',
      state: { publicationCollectionReturn: true, createdCollectionId: 81 },
    }))).toBeDefined()
  })

  it('preserves the publication collection edit flow and return state', () => {
    renderGallery({ publicationCollectionEditFlow: { collectionId: 22, returnPath: '/publications/edit' } })
    expect(screen.queryByRole('button', { name: 'Close collection form' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Return edited 22' }))
    expect(screen.getByText(JSON.stringify({
      path: '/publications/edit',
      state: { publicationCollectionReturn: true },
    }))).toBeDefined()
  })
})
