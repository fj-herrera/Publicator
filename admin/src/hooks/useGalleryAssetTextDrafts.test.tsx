import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AssetText } from '../entities/asset-text'
import useGalleryAssetTextDrafts from './useGalleryAssetTextDrafts'

function makeText(id: number, type: string, text: string, assetId = 1): AssetText {
  return { id, type, asset: { id: assetId }, text: { id: id + 100, text, format: 'PLAIN' } }
}

describe('useGalleryAssetTextDrafts', () => {
  it('initializes drafts for each asset with unique keys, adds drafts and clears them', () => {
    const assetTexts = { 1: [makeText(10, 'caption', 'First')], 2: [makeText(20, 'alt', 'Second', 2)] }
    const { result } = renderHook(() => useGalleryAssetTextDrafts({
      assetTexts, isRefreshing: false, error: '', onReconcileError: vi.fn(),
    }))

    act(() => result.current.initializeAssetTextDrafts(1))
    expect(result.current.assetTextDrafts).toEqual([
      { key: 0, id: 10, role: 'caption', text: 'First', isRemoved: false },
    ])
    act(() => result.current.addAssetTextDraft())
    expect(result.current.assetTextDrafts[1]).toEqual({
      key: 1, id: null, role: '', text: '', isRemoved: false,
    })
    act(() => result.current.initializeAssetTextDrafts(2))
    expect(result.current.assetTextDrafts).toEqual([
      { key: 2, id: 20, role: 'alt', text: 'Second', isRemoved: false },
    ])
    act(() => result.current.clearAssetTextDrafts())
    expect(result.current.assetTextDrafts).toEqual([])
    act(() => result.current.initializeAssetTextDrafts(99))
    expect(result.current.assetTextDrafts).toEqual([])
    act(() => result.current.addAssetTextDraft())
    expect(result.current.assetTextDrafts[0].key).toBe(3)
  })

  it('changes and restores persisted drafts, and removes unsaved drafts outright', () => {
    const assetTexts = { 1: [makeText(10, 'caption', 'First')] }
    const { result } = renderHook(() => useGalleryAssetTextDrafts({
      assetTexts, isRefreshing: false, error: '', onReconcileError: vi.fn(),
    }))

    act(() => {
      result.current.initializeAssetTextDrafts(1)
      result.current.addAssetTextDraft()
    })
    const [existing, added] = result.current.assetTextDrafts
    act(() => result.current.changeAssetTextDraft(existing.key, { role: 'alt', text: 'Changed' }))
    expect(result.current.assetTextDrafts[0]).toMatchObject({ role: 'alt', text: 'Changed' })
    act(() => {
      result.current.removeAssetTextDraft(existing.key)
      result.current.removeAssetTextDraft(added.key)
    })
    expect(result.current.assetTextDrafts).toHaveLength(1)
    expect(result.current.assetTextDrafts[0]).toMatchObject({ id: 10, isRemoved: true })
    act(() => result.current.restoreAssetTextDraft(existing.key))
    expect(result.current.assetTextDrafts[0]).toMatchObject({ id: 10, isRemoved: false })
  })

  it('waits for reload, then reconciles saved IDs without duplicating failed existing drafts', () => {
    const original = { 1: [makeText(10, 'caption', 'Old'), makeText(11, 'alt', 'Keep')] }
    const onReconcileError = vi.fn()
    const { result, rerender } = renderHook(useGalleryAssetTextDrafts, {
      initialProps: { assetTexts: original, isRefreshing: true, error: '', onReconcileError },
    })
    act(() => {
      result.current.initializeAssetTextDrafts(1)
      result.current.addAssetTextDraft()
      result.current.addAssetTextDraft()
    })
    const [failedExisting, unchanged, savedNew, failedNew] = result.current.assetTextDrafts
    act(() => {
      result.current.changeAssetTextDraft(failedExisting.key, { text: 'Retry existing' })
      result.current.changeAssetTextDraft(savedNew.key, { role: 'summary', text: 'Saved new' })
      result.current.changeAssetTextDraft(failedNew.key, { role: 'note', text: 'Retry new' })
    })
    act(() => result.current.reconcileAssetTextDrafts(1, new Map([
      [failedExisting.key, 'Update failed'],
      [failedNew.key, 'Create failed'],
    ])))
    expect(result.current.assetTextDrafts).toHaveLength(4)
    expect(result.current.assetTextDrafts[2].id).toBeNull()

    const refreshed = {
      1: [
        makeText(10, 'caption', 'Old'),
        makeText(11, 'alt', 'Keep'),
        makeText(12, 'summary', 'Saved new'),
      ],
    }
    rerender({ assetTexts: refreshed, isRefreshing: false, error: '', onReconcileError })
    expect(result.current.assetTextDrafts).toEqual([
      { key: 4, id: 11, role: 'alt', text: 'Keep', isRemoved: false },
      { key: 5, id: 12, role: 'summary', text: 'Saved new', isRemoved: false },
      { ...failedExisting, text: 'Retry existing', error: 'Update failed' },
      { ...failedNew, role: 'note', text: 'Retry new', error: 'Create failed' },
    ])
    expect(result.current.assetTextDrafts.filter((draft) => draft.id === 10)).toHaveLength(1)
    expect(result.current.assetTextDrafts.find((draft) => draft.id === 11)?.key).not.toBe(unchanged.key)
    expect(onReconcileError).not.toHaveBeenCalled()
    act(() => result.current.changeAssetTextDraft(failedNew.key, { text: 'Corrected' }))
    expect(result.current.assetTextDrafts.at(-1)).toMatchObject({ text: 'Corrected', error: undefined })
    rerender({ assetTexts: refreshed, isRefreshing: false, error: '', onReconcileError })
    expect(result.current.assetTextDrafts.at(-1)?.text).toBe('Corrected')
  })

  it('keeps current drafts and reports the existing error if reload fails', () => {
    const assetTexts = { 1: [makeText(10, 'caption', 'Old')] }
    const onReconcileError = vi.fn()
    const { result, rerender } = renderHook(useGalleryAssetTextDrafts, {
      initialProps: { assetTexts, isRefreshing: true, error: '', onReconcileError },
    })
    act(() => {
      result.current.initializeAssetTextDrafts(1)
      result.current.addAssetTextDraft()
    })
    const [existing, added] = result.current.assetTextDrafts
    act(() => result.current.reconcileAssetTextDrafts(1, new Map([[added.key, 'Create failed']])))
    expect(onReconcileError).not.toHaveBeenCalled()
    rerender({ assetTexts, isRefreshing: false, error: 'Load failed', onReconcileError })
    expect(result.current.assetTextDrafts).toEqual([
      existing,
      { ...added, error: 'Create failed' },
    ])
    expect(onReconcileError).toHaveBeenCalledExactlyOnceWith(
      'Texts were saved, but the list could not be refreshed. Retry loading the gallery before editing them again.',
    )
    act(() => result.current.removeAssetTextDraft(added.key))
    expect(result.current.assetTextDrafts).toEqual([existing])
  })
})
