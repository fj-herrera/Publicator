import { useMemo, useState } from 'react'
import { apiMessages } from '../constants/api-messages'
import { getErrorMessage } from '../services/api-error'
import {
  getPublicationContextRecords,
  getPublicationRecords,
  reorderPublicationContextsRequest,
} from '../services/publications.service'
import { invalidate } from '../state/resource-invalidation'
import useResource from './useResource'

export type ContextPublicationRow = {
  id: number
  position: number
  title: string
  slug: string
  isFirst: boolean
  isLast: boolean
}

// Publications of one context in their manual order. Both resources reload on
// invalidation, so the table follows any change made from another tab.
function useContextPublications(contextId: number) {
  const links = useResource('publicationContexts', getPublicationContextRecords, apiMessages.contexts.loadPublicationsFailed)
  const publications = useResource('publications', getPublicationRecords, apiMessages.contexts.loadPublicationsFailed)
  const [isMoving, setIsMoving] = useState(false)
  const [moveError, setMoveError] = useState('')

  const rows = useMemo<ContextPublicationRow[]>(() => {
    if (!links.data || !publications.data) return []

    const metaByPublication = new Map(
      publications.data.publications.map((publication) => [publication.id, publication.meta]),
    )
    const ordered = links.data
      .filter((link) => link.context.id === contextId)
      .sort((a, b) => a.position - b.position)

    return ordered.map((link, index) => {
      const meta = metaByPublication.get(link.publication.id)

      return {
        id: link.id,
        position: link.position,
        title: meta?.title ?? `Publication ${link.publication.id}`,
        slug: meta?.slug ?? '',
        isFirst: index === 0,
        isLast: index === ordered.length - 1,
      }
    })
  }, [links.data, publications.data, contextId])

  const move = async (row: ContextPublicationRow, direction: -1 | 1) => {
    const index = rows.findIndex((item) => item.id === row.id)
    const target = index + direction

    if (isMoving || index < 0 || target < 0 || target >= rows.length) return

    const ids = rows.map((item) => item.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setIsMoving(true)
    setMoveError('')

    try {
      await reorderPublicationContextsRequest(contextId, ids)
      invalidate('publicationContexts')
    } catch (error) {
      setMoveError(getErrorMessage(error, apiMessages.contexts.reorderFailed))
    } finally {
      setIsMoving(false)
    }
  }

  return {
    rows,
    isLoading: links.isLoading || publications.isLoading,
    error: moveError || links.error || publications.error,
    isMoving,
    move,
  }
}

export default useContextPublications
