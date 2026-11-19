import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PublicationFormData } from '../../entities/publication-form'
import { createEmptyFormValues } from './publication-form-utils'
import PublicationForm from './PublicationForm'

const mocks = vi.hoisted(() => ({
  createMetaRequest: vi.fn(),
  updateMetaRequest: vi.fn(),
  createPublicationRequest: vi.fn(),
  updatePublicationRequest: vi.fn(),
  getMainInfoRelations: vi.fn(),
  createPublicationContextRequest: vi.fn(),
  createPublicationTagRequest: vi.fn(),
  createPublicationSkillGroupRequest: vi.fn(),
  invalidate: vi.fn(),
}))

vi.mock('../../services/publication-form.service', () => ({
  ...mocks,
  deletePublicationContextRequest: vi.fn(),
  deletePublicationTagRequest: vi.fn(),
  deletePublicationSkillGroupRequest: vi.fn(),
}))
vi.mock('../../state/resource-invalidation', () => ({ invalidate: mocks.invalidate }))
vi.mock('./PublicationMainInfo', () => ({
  default: ({ saveError, onContinue }: { saveError: string; onContinue: () => void }) => (
    <div>
      {saveError && <p role="alert">{saveError}</p>}
      <button onClick={onContinue} type="button">Continue Main Info</button>
    </div>
  ),
}))
vi.mock('./PublicationAssets', () => ({ default: () => <div>Assets editor</div> }))
vi.mock('./PublicationTexts', () => ({ default: () => <div>Texts editor</div> }))

function makeData(): PublicationFormData {
  const initialValues = createEmptyFormValues()
  initialValues.mainInfo = {
    ...initialValues.mainInfo,
    title: 'Title',
    slug: 'title',
    typeId: 1,
    contexts: [{ id: null, contextId: 2, position: 1, visible: false, featured: false }],
    tagIds: [4],
  }
  return {
    publicationId: null,
    metaId: null,
    publicationTexts: [],
    catalogs: {
      types: [], clients: [], contexts: [], tags: [], skillGroups: [],
      collections: [], publicationRoles: [], lastContextPosition: {},
    },
    initialValues,
  }
}

describe('PublicationForm main info saving', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.createMetaRequest.mockResolvedValue({ id: 11 })
    mocks.updateMetaRequest.mockResolvedValue({ id: 11 })
    mocks.createPublicationRequest.mockResolvedValue({ id: 12 })
    mocks.updatePublicationRequest.mockResolvedValue({ id: 12 })
    mocks.getMainInfoRelations.mockResolvedValue({ contexts: [], tags: [], skillGroups: [] })
    mocks.createPublicationContextRequest.mockResolvedValue({ position: 1 })
    mocks.createPublicationTagRequest.mockResolvedValue({})
  })

  it('saves main info and proceeds to assets', async () => {
    render(<PublicationForm data={makeData()} onCancel={vi.fn()} onCreateCollection={vi.fn()} onEditCollection={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue Main Info' }))
    await screen.findByText('Assets editor')
    expect(mocks.createPublicationContextRequest).toHaveBeenCalledOnce()
    expect(mocks.createPublicationTagRequest).toHaveBeenCalledOnce()
    expect(mocks.invalidate).toHaveBeenCalledWith('publications', 'publicationContexts', 'publicationTags')
  })

  it('reports completed writes and retries a failed association without duplicating earlier ones', async () => {
    mocks.createPublicationTagRequest.mockRejectedValueOnce(new Error('Tag failed'))
    mocks.getMainInfoRelations.mockResolvedValueOnce({ contexts: [], tags: [], skillGroups: [] })
      .mockResolvedValueOnce({
        contexts: [{ id: 9, publication: { id: 12 }, context: { id: 2 }, position: 1 }],
        tags: [], skillGroups: [],
      })
    render(<PublicationForm data={makeData()} onCancel={vi.fn()} onCreateCollection={vi.fn()} onEditCollection={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue Main Info' }))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Metadata #11 saved')
    expect(alert.textContent).toContain('Publication #12 saved')
    expect(alert.textContent).toContain('Context #2 added')
    expect(alert.textContent).toContain('Adding tag #4 failed: Tag failed')
    expect(mocks.invalidate).toHaveBeenCalledWith('publications', 'publicationContexts')
    fireEvent.click(screen.getByRole('button', { name: 'Continue Main Info' }))
    await screen.findByText('Assets editor')
    expect(mocks.createMetaRequest).toHaveBeenCalledOnce()
    expect(mocks.createPublicationRequest).toHaveBeenCalledOnce()
    expect(mocks.createPublicationContextRequest).toHaveBeenCalledOnce()
    expect(mocks.createPublicationTagRequest).toHaveBeenCalledTimes(2)
    expect(mocks.updateMetaRequest).toHaveBeenCalledOnce()
  })

  it('reports an initial metadata failure without claiming successful writes', async () => {
    mocks.createMetaRequest.mockRejectedValueOnce(new Error('Metadata unavailable'))
    render(<PublicationForm data={makeData()} onCancel={vi.fn()} onCreateCollection={vi.fn()} onEditCollection={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue Main Info' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent)
      .toContain('No writes confirmed. Metadata failed: Metadata unavailable'))
    expect(mocks.invalidate).not.toHaveBeenCalled()
    expect(mocks.createPublicationRequest).not.toHaveBeenCalled()
  })

  it('reuses confirmed metadata if publication creation fails', async () => {
    mocks.createPublicationRequest.mockRejectedValueOnce(new Error('Publication unavailable'))
      .mockResolvedValueOnce({ id: 12 })
    render(<PublicationForm data={makeData()} onCancel={vi.fn()} onCreateCollection={vi.fn()} onEditCollection={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue Main Info' }))
    expect((await screen.findByRole('alert')).textContent)
      .toContain('Completed: Metadata #11 saved. Publication failed: Publication unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Continue Main Info' }))
    await screen.findByText('Assets editor')
    expect(mocks.createMetaRequest).toHaveBeenCalledOnce()
    expect(mocks.updateMetaRequest).toHaveBeenCalledOnce()
    expect(mocks.createPublicationRequest).toHaveBeenCalledTimes(2)
  })
})
