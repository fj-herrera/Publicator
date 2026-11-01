import { useEffect, useState } from 'react'
import type { PublicationFormData } from '../entities/publication-form'
import { buildPublicationFormData } from '../components/publications/publication-form-utils'
import { getErrorMessage } from '../services/api-error'
import { getAssets } from '../services/assets.service'
import { getPublicationListData } from '../services/publications.service'
import { getSkillGroups } from '../services/skill-groups.service'
import { getPublicationTextRecords } from '../services/publication-texts.service'

const loadFailed = 'Could not load the publication form.'

// Pass null to prepare an empty form for a new publication.
function usePublicationFormData(publicationId: number | null) {
  const [data, setData] = useState<PublicationFormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const load = async () => {
      setIsLoading(true)
      setError('')
      setData(null)

      try {
        const [listData, skillGroups, assets, textContents] = await Promise.all([
          getPublicationListData(),
          getSkillGroups(),
          publicationId === null ? Promise.resolve([]) : getAssets(),
          getPublicationTextRecords(),
        ])
        const formData = buildPublicationFormData(
          listData,
          skillGroups,
          publicationId,
          assets,
          textContents,
        )

        if (!isCurrent) return
        if (formData) setData(formData)
        else setError(`Publication ${publicationId} was not found.`)
      } catch (loadError) {
        if (isCurrent) setError(getErrorMessage(loadError, loadFailed))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isCurrent = false
    }
  }, [publicationId])

  return { data, isLoading, error }
}

export default usePublicationFormData
