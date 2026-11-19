import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import usePublicationForm from '../../hooks/usePublicationForm'
import { createEmptyFormValues } from './publication-form-utils'
import PublicationAssets from './PublicationAssets'

const mocks = vi.hoisted(() => ({
  uploadAssets: vi.fn(),
  createPublicationAsset: vi.fn(),
  getPublicationAssets: vi.fn(),
  updateAssetName: vi.fn(),
  updatePublicationAssetRole: vi.fn(),
  invalidate: vi.fn(),
}))

vi.mock('../../services/assets.service', () => ({
  uploadAssets: mocks.uploadAssets,
  createPublicationAsset: mocks.createPublicationAsset,
  getPublicationAssets: mocks.getPublicationAssets,
  updateAssetName: mocks.updateAssetName,
  updatePublicationAssetRole: mocks.updatePublicationAssetRole,
}))
vi.mock('../../state/resource-invalidation', () => ({ invalidate: mocks.invalidate }))

const asset = { id: 8, name: 'image.png', type: 'image', url: '/image.png', dimensions: null }
const relation = { id: 42, role: 'cover', publication: { id: 3 }, asset: { id: 8 } }

function Harness({ existing = false }: { existing?: boolean }) {
  const initial = createEmptyFormValues()
  initial.assets.uploadRole = 'cover'
  if (existing) initial.assets.directAssets = [{ ...relation, asset }]
  const form = usePublicationForm(initial, {})
  return (
    <PublicationAssets
      publicationId={3}
      values={form.values.assets}
      collections={[]}
      publicationRoles={[]}
      onCreateCollection={() => {}}
      onEditCollection={() => {}}
      onContinue={() => {}}
      onValuesChange={form.updateAssets}
      onFilesSelected={form.addUploadFiles}
      onPendingUploadChange={form.updatePendingUpload}
      onPendingUploadRemove={form.removePendingUpload}
      onDirectAssetAdded={form.addDirectAsset}
      onDirectAssetChange={form.updateDirectAsset}
      onDirectAssetRemove={form.removeDirectAsset}
      onAssetOperationChange={form.changePendingAssetOperations}
    />
  )
}

function queueFile(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('File input not found')
  fireEvent.change(input, { target: { files: [new File(['test'], 'image.png', { type: 'image/png' })] } })
}

describe('PublicationAssets upload', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.uploadAssets.mockResolvedValue([asset])
    mocks.createPublicationAsset.mockResolvedValue(relation)
    mocks.getPublicationAssets.mockResolvedValue([])
  })

  it('uploads and associates a file, displaying the confirmed relation', async () => {
    const { container } = render(<Harness />)
    queueFile(container)
    fireEvent.click(screen.getByRole('button', { name: 'Upload selected' }))
    await screen.findByRole('button', { name: 'Remove image.png from publication' })
    expect(screen.queryByRole('list', { name: 'Files queued for direct upload' })).toBeNull()
    expect(mocks.uploadAssets).toHaveBeenCalledOnce()
    expect(mocks.createPublicationAsset).toHaveBeenCalledWith(8, 3, 'cover')
    expect(mocks.invalidate).toHaveBeenCalledWith('assets', 'publicationAssets')
  })

  it('keeps the uploaded file and retries only the missing association', async () => {
    mocks.createPublicationAsset.mockRejectedValueOnce(new Error('Association unavailable'))
    const { container } = render(<Harness />)
    queueFile(container)
    fireEvent.click(screen.getByRole('button', { name: 'Upload selected' }))
    expect((await screen.findByRole('alert')).textContent)
      .toContain('Associating the uploaded file failed: Association unavailable')
    const status = screen.getByText(/Uploaded to the gallery \(asset #8\)/)
    const row = status.closest('li')
    expect(row?.querySelector('.publication-assets-upload-name')?.textContent).toBe('image.png')
    expect(row?.querySelector('.publication-assets-upload-status')).toBe(status)
    expect(row?.querySelector('.publication-assets-upload-error')).toBe(screen.getByRole('alert'))
    expect(row?.querySelector('.publication-assets-upload-actions')?.contains(screen.getByRole('button', { name: 'Retry' }))).toBe(true)
    expect(row?.querySelector('.publication-assets-upload-actions')?.contains(screen.getByRole('button', { name: 'Remove image.png' }))).toBe(true)
    expect(mocks.invalidate).toHaveBeenCalledWith('assets')
    fireEvent.change(screen.getByRole('combobox', { name: 'Asset Role' }), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByRole('button', { name: 'Remove image.png from publication' })
    expect(mocks.uploadAssets).toHaveBeenCalledOnce()
    expect(mocks.getPublicationAssets).toHaveBeenCalledOnce()
    expect(mocks.createPublicationAsset).toHaveBeenCalledTimes(2)
    expect(mocks.createPublicationAsset).toHaveBeenLastCalledWith(8, 3, 'cover')
  })

  it('reports an upload failure and retries the upload before associating', async () => {
    mocks.uploadAssets.mockRejectedValueOnce(new Error('Upload unavailable'))
    const { container } = render(<Harness />)
    queueFile(container)
    fireEvent.click(screen.getByRole('button', { name: 'Upload selected' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Uploading the file failed: Upload unavailable')
    expect(screen.queryByText(/Uploaded to the gallery/)).toBeNull()
    expect(mocks.createPublicationAsset).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByRole('button', { name: 'Remove image.png from publication' })
    expect(mocks.uploadAssets).toHaveBeenCalledTimes(2)
    expect(mocks.createPublicationAsset).toHaveBeenCalledOnce()
  })

  it('does not duplicate an association when its original response was lost', async () => {
    mocks.createPublicationAsset.mockRejectedValueOnce(new Error('Connection lost'))
    mocks.getPublicationAssets.mockRejectedValueOnce(new Error('Read failed')).mockResolvedValueOnce([relation])
    const { container } = render(<Harness />)
    queueFile(container)
    fireEvent.click(screen.getByRole('button', { name: 'Upload selected' }))
    await screen.findByText(/Connection lost/)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByText(/Checking the existing association failed: Read failed/)
    expect(mocks.createPublicationAsset).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByRole('button', { name: 'Remove image.png from publication' })
    expect(mocks.uploadAssets).toHaveBeenCalledOnce()
    expect(mocks.createPublicationAsset).toHaveBeenCalledOnce()
    await waitFor(() => expect(mocks.getPublicationAssets).toHaveBeenCalledTimes(2))
  })

  it('keeps a confirmed asset name on partial edit and retries only the failed role', async () => {
    mocks.updateAssetName.mockResolvedValue({ ...asset, name: 'renamed.png' })
    mocks.updatePublicationAssetRole.mockRejectedValueOnce(new Error('Role unavailable')).mockResolvedValueOnce({})
    render(<Harness existing />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit image.png' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'File name' }), { target: { value: 'renamed.png' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Asset Role' }), { target: { value: 'hero' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect((await screen.findByRole('alert')).textContent)
      .toContain('Completed: Asset name saved. Updating the asset role failed: Role unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mocks.updateAssetName).toHaveBeenCalledOnce()
    expect(mocks.updatePublicationAssetRole).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Edit renamed.png' })).toBeDefined()
  })
})
