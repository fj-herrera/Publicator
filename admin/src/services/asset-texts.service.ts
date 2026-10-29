import { apiMessages } from '../constants/api-messages'
import type {
  AssetText,
  AssetTextDraft,
  TextContentUsage,
  TextFormat,
} from '../entities/asset-text'
import { getErrorMessage } from './api-error'
import { jsonRequest, requestJson, requestVoid } from './api-request'

export function getAssetTexts() {
  return requestJson<AssetText[]>('/api/asset-texts', apiMessages.assetTexts.loadFailed)
}

function getTextContentUsages() {
  return requestJson<TextContentUsage[]>(
    '/api/text-contents',
    apiMessages.assetTexts.usageCheckFailed,
  )
}

function createText(text: string, format: TextFormat) {
  return requestJson<{ id: number }>(
    '/api/texts',
    apiMessages.assetTexts.createFailed,
    jsonRequest('POST', { text, format }),
  )
}

function updateText(id: number, text: string) {
  return requestJson<{ id: number }>(
    `/api/texts/${id}`,
    apiMessages.assetTexts.updateFailed,
    jsonRequest('PATCH', { text }),
  )
}

function deleteText(id: number) {
  return requestVoid(`/api/texts/${id}`, apiMessages.assetTexts.deleteFailed, { method: 'DELETE' })
}

function createAssetText(assetId: number, textId: number, type: string) {
  return requestJson<{ id: number }>(
    '/api/asset-texts',
    apiMessages.assetTexts.createFailed,
    jsonRequest('POST', { assetId, textId, type }),
  )
}

function updateAssetText(id: number, changes: { type?: string; textId?: number }) {
  return requestJson<{ id: number }>(
    `/api/asset-texts/${id}`,
    apiMessages.assetTexts.updateFailed,
    jsonRequest('PATCH', changes),
  )
}

// Deleting an association keeps its Text row, as in the rest of the API.
function deleteAssetText(id: number) {
  return requestVoid(
    `/api/asset-texts/${id}`,
    apiMessages.assetTexts.deleteFailed,
    { method: 'DELETE' },
  )
}

async function getSharedTextIds(): Promise<Set<number>> {
  const [assetTexts, textContents] = await Promise.all([getAssetTexts(), getTextContentUsages()])
  const usages = new Map<number, number>()
  const addUsage = (textId: number) => usages.set(textId, (usages.get(textId) ?? 0) + 1)

  assetTexts.forEach((item) => addUsage(item.text.id))
  textContents.forEach((item) => {
    if (item.text) {
      addUsage(item.text.id)
    }
  })

  return new Set([...usages].filter(([, count]) => count > 1).map(([textId]) => textId))
}

// Returns the error message of each draft that could not be saved, by draft key.
export async function saveAssetTextDrafts(
  assetId: number,
  drafts: AssetTextDraft[],
  current: AssetText[],
): Promise<Map<number, string>> {
  const currentById = new Map(current.map((item) => [item.id, item]))
  const failures = new Map<number, string>()
  const isContentChanged = (draft: AssetTextDraft) => {
    const original = draft.id === null ? undefined : currentById.get(draft.id)
    return Boolean(original) && draft.text.trim() !== original!.text.text.trim()
  }

  let sharedTextIds = new Set<number>()
  let sharedCheckError = ''
  if (drafts.some((draft) => !draft.isRemoved && isContentChanged(draft))) {
    try {
      sharedTextIds = await getSharedTextIds()
    } catch (error) {
      sharedCheckError = getErrorMessage(error, apiMessages.assetTexts.usageCheckFailed)
    }
  }

  for (const draft of drafts) {
    const original = draft.id === null ? undefined : currentById.get(draft.id)
    const role = draft.role.trim()
    const text = draft.text.trim()

    try {
      if (draft.isRemoved) {
        if (original) {
          await deleteAssetText(original.id)
        }
        continue
      }

      if (!original) {
        const created = await createText(text, 'PLAIN')
        try {
          await createAssetText(assetId, created.id, role)
        } catch (error) {
          await deleteText(created.id).catch(() => undefined)
          throw error
        }
        continue
      }

      const roleChanged = role !== original.type
      if (!isContentChanged(draft)) {
        if (roleChanged) {
          await updateAssetText(original.id, { type: role })
        }
        continue
      }

      if (sharedCheckError) {
        throw new Error(sharedCheckError)
      }

      if (sharedTextIds.has(original.text.id)) {
        // Another record uses this Text, so give this association its own copy.
        const copy = await createText(text, original.text.format)
        try {
          await updateAssetText(original.id, {
            textId: copy.id,
            ...(roleChanged ? { type: role } : {}),
          })
        } catch (error) {
          await deleteText(copy.id).catch(() => undefined)
          throw error
        }
      } else {
        await updateText(original.text.id, text)
        if (roleChanged) {
          await updateAssetText(original.id, { type: role })
        }
      }
    } catch (error) {
      failures.set(draft.key, getErrorMessage(error, apiMessages.assetTexts.updateFailed))
    }
  }

  return failures
}
