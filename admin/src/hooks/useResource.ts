import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api-error'
import { useResourceVersion, type ResourceName } from '../state/resource-invalidation'

type Settled<T> = { version: number; data: T | undefined; error: string }

// Loads a resource and reloads it every time it is invalidated.
// `load` must be a stable reference (a module-level function or a memoised callback).
// Only the first load reports `isLoading`; later reloads are silent and keep the
// previous data on screen (`isRefreshing` tells whether one is in flight).
// A response that is no longer the latest request is discarded.
// `retry` repeats this resource's load only, for failed requests.
function useResource<T>(resource: ResourceName, load: () => Promise<T>, loadFailedMessage: string) {
  const version = useResourceVersion(resource)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((count) => count + 1), [])

  useEffect(() => {
    let isCurrent = true

    load().then(
      (data) => {
        if (isCurrent) setSettled({ version, data, error: '' })
      },
      (loadError: unknown) => {
        if (isCurrent) {
          setSettled((previous) => ({
            version,
            data: previous?.data,
            error: getErrorMessage(loadError, loadFailedMessage),
          }))
        }
      },
    )

    return () => {
      isCurrent = false
    }
  }, [load, loadFailedMessage, version, attempt])

  return {
    data: settled?.data,
    error: settled?.error ?? '',
    isLoading: settled === null,
    isRefreshing: settled !== null && settled.version !== version,
    retry,
  }
}

export default useResource
