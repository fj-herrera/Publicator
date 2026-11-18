import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import type { PublicationAssetRelation } from '../entities/asset'
import useGalleryPublicationRelationDrafts from './useGalleryPublicationRelationDrafts'

const relations: PublicationAssetRelation[] = [
  { id: 1, role: 'cover', asset: { id: 10 }, publication: { id: 20 } },
  { id: 2, role: 'gallery', asset: { id: 10 }, publication: { id: 21 } },
]

describe('useGalleryPublicationRelationDrafts', () => {
  it('initializes editable roles and resets drafts when opening another asset', () => {
    const { result } = renderHook(useGalleryPublicationRelationDrafts)
    expect(result.current.editedPublicationRoles).toEqual({})
    expect(result.current.newPublicationRelations).toEqual([])

    act(() => result.current.initializePublicationRelationDrafts(relations))
    expect(result.current.editedPublicationRoles).toEqual({ 1: 'cover', 2: 'gallery' })
    act(() => {
      result.current.changePublicationRole(1, ' new role ')
      result.current.addPublicationRelationDraft()
    })
    expect(result.current.editedPublicationRoles).toEqual({ 1: ' new role ', 2: 'gallery' })

    act(() => result.current.initializePublicationRelationDrafts([relations[1]]))
    expect(result.current.editedPublicationRoles).toEqual({ 2: 'gallery' })
    expect(result.current.newPublicationRelations).toEqual([])
    act(() => result.current.initializePublicationRelationDrafts([]))
    expect(result.current.editedPublicationRoles).toEqual({})
  })

  it('creates unique keys across removals and resets and edits string publication IDs', () => {
    const { result } = renderHook(useGalleryPublicationRelationDrafts, { wrapper: StrictMode })
    act(() => {
      result.current.addPublicationRelationDraft()
      result.current.addPublicationRelationDraft()
    })
    const [first, second] = result.current.newPublicationRelations
    expect(first).toEqual({ key: 0, publicationId: '', role: '' })
    expect(second).toEqual({ key: 1, publicationId: '', role: '' })

    act(() => {
      result.current.changePublicationRelationDraft(first.key, { publicationId: '42' })
      result.current.changePublicationRelationDraft(first.key, { role: ' cover ' })
      result.current.removePublicationRelationDraft(second.key)
    })
    expect(result.current.newPublicationRelations).toEqual([
      { key: first.key, publicationId: '42', role: ' cover ' },
    ])

    act(() => result.current.clearPublicationRelationDrafts())
    expect(result.current.editedPublicationRoles).toEqual({})
    expect(result.current.newPublicationRelations).toEqual([])
    act(() => result.current.addPublicationRelationDraft())
    expect(result.current.newPublicationRelations).toEqual([
      { key: 2, publicationId: '', role: '' },
    ])
    act(() => result.current.initializePublicationRelationDrafts(relations))
    act(() => result.current.addPublicationRelationDraft())
    expect(result.current.newPublicationRelations[0].key).toBe(3)
  })

  it('keeps unsaved roles and failed new drafts when Gallery applies a partial save result', () => {
    const { result } = renderHook(useGalleryPublicationRelationDrafts)
    act(() => {
      result.current.initializePublicationRelationDrafts(relations)
      result.current.addPublicationRelationDraft()
      result.current.addPublicationRelationDraft()
    })
    const [saved, failed] = result.current.newPublicationRelations
    act(() => {
      result.current.changePublicationRole(1, ' saved ')
      result.current.changePublicationRole(2, 'retry')
      result.current.changePublicationRelationDraft(saved.key, { publicationId: '20', role: 'saved' })
      result.current.changePublicationRelationDraft(failed.key, { publicationId: '21', role: 'retry' })
    })
    act(() => {
      result.current.setEditedPublicationRoles((current) => ({ ...current, 1: 'saved' }))
      result.current.setNewPublicationRelations((current) => current.filter((draft) => draft.key === failed.key))
    })
    expect(result.current.editedPublicationRoles).toEqual({ 1: 'saved', 2: 'retry' })
    expect(result.current.newPublicationRelations).toEqual([
      { key: failed.key, publicationId: '21', role: 'retry' },
    ])
    act(() => result.current.clearPublicationRelationDrafts())
    expect(result.current.editedPublicationRoles).toEqual({})
    expect(result.current.newPublicationRelations).toEqual([])
  })
})
