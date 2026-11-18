import { useEffect, useRef, useState } from 'react'
import type { AssetText, AssetTextDraft } from '../entities/asset-text'

type TextReconcile = {
  assetId: number
  drafts: AssetTextDraft[]
  failures: Map<number, string>
}

type UseGalleryAssetTextDraftsProps = {
  assetTexts: Record<number, AssetText[]>
  isRefreshing: boolean
  error: string
  onReconcileError: (message: string) => void
}

function toTextDraft(assetText: AssetText, key: number): AssetTextDraft {
  return {
    key,
    id: assetText.id,
    role: assetText.type,
    text: assetText.text.text,
    isRemoved: false,
  }
}

function useGalleryAssetTextDrafts({
  assetTexts,
  isRefreshing,
  error,
  onReconcileError,
}: UseGalleryAssetTextDraftsProps) {
  const [assetTextDrafts, setAssetTextDrafts] = useState<AssetTextDraft[]>([])
  const [textReconcile, setTextReconcile] = useState<TextReconcile | null>(null)
  const nextAssetTextKey = useRef(0)

  useEffect(() => {
    if (!textReconcile || isRefreshing) return

    const { assetId, drafts, failures } = textReconcile
    const failedDrafts = drafts
      .filter((draft) => failures.has(draft.key))
      .map((draft) => ({ ...draft, error: failures.get(draft.key) }))
    const failedIds = new Set(failedDrafts.map((draft) => draft.id))
    // One-shot reconciliation once the reloaded texts are available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTextReconcile(null)

    if (error) {
      // Without the saved state another save could duplicate texts.
      setAssetTextDrafts((current) => current.map((draft) => (
        failures.has(draft.key) ? { ...draft, error: failures.get(draft.key) } : draft
      )))
      onReconcileError('Texts were saved, but the list could not be refreshed. Retry loading the gallery before editing them again.')
      return
    }

    setAssetTextDrafts([
      ...(assetTexts[assetId] ?? [])
        .filter((item) => !failedIds.has(item.id))
        .map((item) => toTextDraft(item, nextAssetTextKey.current++)),
      ...failedDrafts,
    ])
  }, [assetTexts, error, isRefreshing, onReconcileError, textReconcile])

  const initializeAssetTextDrafts = (assetId: number) => {
    setAssetTextDrafts((assetTexts[assetId] ?? []).map(
      (assetText) => toTextDraft(assetText, nextAssetTextKey.current++),
    ))
  }

  const clearAssetTextDrafts = () => setAssetTextDrafts([])

  const addAssetTextDraft = () => setAssetTextDrafts((drafts) => [
    ...drafts,
    {
      key: nextAssetTextKey.current++,
      id: null,
      role: '',
      text: '',
      isRemoved: false,
    },
  ])

  const changeAssetTextDraft = (
    key: number,
    changes: Partial<Pick<AssetTextDraft, 'role' | 'text'>>,
  ) => setAssetTextDrafts((drafts) => drafts.map((draft) => (
    draft.key === key ? { ...draft, ...changes, error: undefined } : draft
  )))

  const removeAssetTextDraft = (key: number) => setAssetTextDrafts((drafts) => (
    drafts
      .filter((draft) => draft.id !== null || draft.key !== key)
      .map((draft) => (draft.key === key ? { ...draft, isRemoved: true, error: undefined } : draft))
  ))

  const restoreAssetTextDraft = (key: number) => setAssetTextDrafts((drafts) => drafts.map(
    (draft) => (draft.key === key ? { ...draft, isRemoved: false } : draft),
  ))

  const reconcileAssetTextDrafts = (assetId: number, failures: Map<number, string>) => {
    setTextReconcile({ assetId, drafts: assetTextDrafts, failures })
  }

  return {
    assetTextDrafts,
    initializeAssetTextDrafts,
    clearAssetTextDrafts,
    addAssetTextDraft,
    changeAssetTextDraft,
    removeAssetTextDraft,
    restoreAssetTextDraft,
    reconcileAssetTextDrafts,
  }
}

export default useGalleryAssetTextDrafts
