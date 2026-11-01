import { useEffect, useState } from 'react'
import type { PublicationListData } from '../entities/publication'
import { getErrorMessage } from '../services/api-error'
import { getPublicationListData } from '../services/publications.service'

function usePublicationsData() {
  const [data, setData] = useState<PublicationListData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    const load = async () => {
      setIsLoading(true)
      setError('')

      try {
        const nextData = await getPublicationListData()
        if (isCurrent) {
          setData(nextData)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, 'Could not load publications.'))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isCurrent = false
    }
  }, [reloadCount])

  return {
    data,
    isLoading,
    error,
    reload: () => setReloadCount((count) => count + 1),
  }
}

export default usePublicationsData
