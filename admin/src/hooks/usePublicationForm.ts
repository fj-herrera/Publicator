import { useMemo, useRef, useState } from 'react'
import {
  publicationFormSections,
  type MainInfoValues,
  type AssetsValues,
  type DirectAssetUploadDraft,
  type DirectPublicationAssetDraft,
  type TextsValues,
  type PublicationFormErrors,
  type PublicationFormSectionId,
  type PublicationFormValues,
} from '../entities/publication-form'
import {
  hasErrors,
  sectionValidators,
  slugify,
  syncContextDrafts,
} from '../components/publications/publication-form-utils'

type AttemptedSections = Record<PublicationFormSectionId, boolean>

function usePublicationForm(
  initialValues: PublicationFormValues,
  lastContextPosition: Record<number, number>,
  initialSection: PublicationFormSectionId = 'mainInfo',
) {
  const [values, setValues] = useState(initialValues)
  const nextUploadKey = useRef(0)
  const [openSection, setOpenSection] = useState<PublicationFormSectionId>(initialSection)
  // A section shows its errors only after a failed attempt to leave it.
  const [attempted, setAttempted] = useState<AttemptedSections>({
    mainInfo: false,
    assets: false,
    texts: false,
  })

  const errors = useMemo<PublicationFormErrors>(() => ({
    mainInfo: attempted.mainInfo ? sectionValidators.mainInfo(values) : {},
    assets: attempted.assets ? sectionValidators.assets(values) : {},
    texts: attempted.texts ? sectionValidators.texts(values) : {},
  }), [attempted, values])

  const updateMainInfo = (changes: Partial<MainInfoValues>) => {
    setValues((current) => ({ ...current, mainInfo: { ...current.mainInfo, ...changes } }))
  }

  const setTitle = (title: string) => {
    setValues((current) => ({
      ...current,
      mainInfo: {
        ...current.mainInfo,
        title,
        slug: current.mainInfo.slugEditedManually ? current.mainInfo.slug : slugify(title),
      },
    }))
  }

  const setSlug = (slug: string) => updateMainInfo({ slug, slugEditedManually: true })

  const setContexts = (contextIds: number[]) => {
    setValues((current) => ({
      ...current,
      mainInfo: {
        ...current.mainInfo,
        contexts: syncContextDrafts(current.mainInfo.contexts, contextIds, lastContextPosition),
      },
    }))
  }

  const updateAssets = (changes: Partial<AssetsValues>) => {
    setValues((current) => ({ ...current, assets: { ...current.assets, ...changes } }))
  }

  const changePendingAssetOperations = (change: number) => {
    setValues((current) => ({
      ...current,
      assets: {
        ...current.assets,
        pendingOperations: Math.max(0, current.assets.pendingOperations + change),
      },
    }))
  }

  const updateTexts = (changes: Partial<TextsValues>) => {
    setValues((current) => ({ ...current, texts: { ...current.texts, ...changes } }))
  }

  const addUploadFiles = (files: File[]) => {
    const uploads: DirectAssetUploadDraft[] = files.map((file) => ({
      key: nextUploadKey.current++,
      file,
      role: '',
      asset: null,
      error: '',
      isUploading: false,
    }))
    setValues((current) => ({
      ...current,
      assets: {
        ...current.assets,
        pendingUploads: [...current.assets.pendingUploads, ...uploads],
      },
    }))
  }

  const updatePendingUpload = (
    key: number,
    changes: Partial<DirectAssetUploadDraft>,
  ) => setValues((current) => ({
    ...current,
    assets: {
      ...current.assets,
      pendingUploads: current.assets.pendingUploads.map((draft) => (
        draft.key === key ? { ...draft, ...changes } : draft
      )),
    },
  }))

  const removePendingUpload = (key: number) => setValues((current) => ({
    ...current,
    assets: {
      ...current.assets,
      pendingUploads: current.assets.pendingUploads.filter((draft) => draft.key !== key),
    },
  }))

  const addDirectAsset = (asset: DirectPublicationAssetDraft) => setValues((current) => ({
    ...current,
    assets: {
      ...current.assets,
      directAssets: [...current.assets.directAssets, asset],
    },
  }))

  const updateDirectAsset = (id: number, changes: Partial<DirectPublicationAssetDraft>) => {
    setValues((current) => ({
      ...current,
      assets: {
        ...current.assets,
        directAssets: current.assets.directAssets.map((item) => (
          item.id === id ? { ...item, ...changes } : item
        )),
      },
    }))
  }

  const removeDirectAsset = (id: number) => setValues((current) => ({
    ...current,
    assets: {
      ...current.assets,
      directAssets: current.assets.directAssets.filter((item) => item.id !== id),
    },
  }))

  // Moving forward validates every section from the open one up to the target.
  const validateTo = (target: PublicationFormSectionId) => {
    const currentIndex = publicationFormSections.indexOf(openSection)
    const targetIndex = publicationFormSections.indexOf(target)

    for (let index = currentIndex; index < targetIndex; index += 1) {
      const section = publicationFormSections[index]
      if (hasErrors(sectionValidators[section](values))) {
        setAttempted((current) => ({ ...current, [section]: true }))
        setOpenSection(section)
        return false
      }
    }

    return true
  }

  const validateAll = () => {
    setAttempted({ mainInfo: true, assets: true, texts: true })
    for (const section of publicationFormSections) {
      if (hasErrors(sectionValidators[section](values))) {
        setOpenSection(section)
        return false
      }
    }
    return true
  }

  const isSectionComplete = (section: PublicationFormSectionId) => (
    !hasErrors(sectionValidators[section](values))
  )

  const requestSection = (target: PublicationFormSectionId) => {
    const currentIndex = publicationFormSections.indexOf(openSection)
    const targetIndex = publicationFormSections.indexOf(target)
    if (targetIndex <= currentIndex || validateTo(target)) setOpenSection(target)
  }

  const openSectionDirectly = (target: PublicationFormSectionId) => {
    setOpenSection(target)
  }

  const continueFrom = (section: PublicationFormSectionId) => {
    const next = publicationFormSections[publicationFormSections.indexOf(section) + 1]
    if (next) requestSection(next)
  }

  return {
    values,
    errors,
    openSection,
    updateMainInfo,
    setTitle,
    setSlug,
    setContexts,
    updateAssets,
    changePendingAssetOperations,
    updateTexts,
    addUploadFiles,
    updatePendingUpload,
    removePendingUpload,
    addDirectAsset,
    updateDirectAsset,
    removeDirectAsset,
    validateTo,
    validateAll,
    isSectionComplete,
    requestSection,
    openSectionDirectly,
    continueFrom,
  }
}

export default usePublicationForm
