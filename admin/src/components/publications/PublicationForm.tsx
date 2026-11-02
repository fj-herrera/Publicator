import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getErrorMessage } from '../../services/api-error'
import {
  createMetaRequest,
  createPublicationContextRequest,
  createPublicationRequest,
  createPublicationSkillGroupRequest,
  createPublicationTagRequest,
  deletePublicationContextRequest,
  deletePublicationSkillGroupRequest,
  deletePublicationTagRequest,
  getMainInfoRelations,
  updateMetaRequest,
  updatePublicationRequest,
} from '../../services/publication-form.service'
import {
  publicationFormSections,
  type PublicationFormData,
  type PublicationFormSectionId,
} from '../../entities/publication-form'
import { invalidate, type ResourceName } from '../../state/resource-invalidation'
import usePublicationForm from '../../hooks/usePublicationForm'
import PublicationMainInfo from './PublicationMainInfo'
import PublicationAssets from './PublicationAssets'
import PublicationTexts from './PublicationTexts'
import PublicationSectionPlaceholder from './PublicationSectionPlaceholder'
import './publication-form.css'
import type { PublicationFormSession } from '../../services/publication-form-session'

type PublicationFormProps = {
  data: PublicationFormData
  resume?: PublicationFormSession | null
  onCancel: () => void
  onCreateCollection: (session: PublicationFormSession) => void
  onEditCollection: (session: PublicationFormSession, collectionId: number) => void
}

const sectionLabels: Record<PublicationFormSectionId, string> = {
  mainInfo: 'Main Info',
  assets: 'Assets',
  texts: 'Texts',
}

function PublicationForm({
  data,
  resume,
  onCancel,
  onCreateCollection,
  onEditCollection,
}: PublicationFormProps) {
  const form = usePublicationForm(
    resume?.values ?? data.initialValues,
    data.catalogs.lastContextPosition,
    resume?.openSection,
  )
  const [publicationId, setPublicationId] = useState(resume?.publicationId ?? data.publicationId)
  const publicationIdRef = useRef(resume?.publicationId ?? data.publicationId)
  const [metaId, setMetaId] = useState(resume?.metaId ?? data.metaId)
  const metaIdRef = useRef(resume?.metaId ?? data.metaId)
  const [isSavingMainInfo, setIsSavingMainInfo] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [mainInfoSaveError, setMainInfoSaveError] = useState('')
  const savingLock = useRef(false)
  const savedMainInfoSnapshot = useRef<string | null>(
    (resume?.publicationId ?? data.publicationId) === null
      ? null
      : JSON.stringify(data.initialValues.mainInfo),
  )
  const mainInfo = form.values.mainInfo
  const mainInfoSummary = [
    mainInfo.title.trim(),
    mainInfo.slug.trim(),
    data.catalogs.types.find((item) => item.id === mainInfo.typeId)?.name,
    mainInfo.contexts
      .map((item) => data.catalogs.contexts.find((context) => context.id === item.contextId)?.name)
      .filter((name): name is string => Boolean(name))
      .join(', '),
    data.catalogs.clients.find((item) => item.id === mainInfo.clientId)?.name,
  ].filter(Boolean).join(' · ')
  const sectionComplete = {
    mainInfo: form.isSectionComplete('mainInfo') && !mainInfoSaveError,
    assets: form.isSectionComplete('assets'),
    texts: form.isSectionComplete('texts'),
  }
  const completedSectionCount = Object.values(sectionComplete).filter(Boolean).length

  const persistMainInfo = async () => {
    if (savingLock.current || !form.validateTo('assets')) return false
    const mainInfo = form.values.mainInfo
    if (mainInfo.typeId === null) return false
    const snapshot = JSON.stringify(mainInfo)
    if (
      publicationIdRef.current !== null
      && metaIdRef.current !== null
      && savedMainInfoSnapshot.current === snapshot
    ) {
      return true
    }

    savingLock.current = true
    setIsSavingMainInfo(true)
    setMainInfoSaveError('')
    // Collected as writes are confirmed so a partial save still refreshes what changed.
    const written = new Set<ResourceName>()
    try {
      let nextMetaId = metaIdRef.current
      const metaInput = {
        title: mainInfo.title.trim(),
        slug: mainInfo.slug.trim(),
        status: 'draft' as const,
        clientId: mainInfo.clientId,
      }

      if (nextMetaId === null) {
        const createdMeta = await createMetaRequest({
          ...metaInput,
          date: new Date().toISOString().slice(0, 10),
        })
        nextMetaId = createdMeta.id
        written.add('publications')
        metaIdRef.current = nextMetaId
        setMetaId(nextMetaId)
      } else {
        await updateMetaRequest(nextMetaId, metaInput)
        written.add('publications')
      }

      let nextPublicationId = publicationIdRef.current
      if (nextPublicationId === null) {
        const createdPublication = await createPublicationRequest(mainInfo.typeId, nextMetaId)
        nextPublicationId = createdPublication.id
        written.add('publications')
        publicationIdRef.current = nextPublicationId
        setPublicationId(nextPublicationId)
      } else {
        await updatePublicationRequest(nextPublicationId, mainInfo.typeId)
        written.add('publications')
      }

      const currentRelations = await getMainInfoRelations()
      const currentContexts = currentRelations.contexts.filter(
        (item) => item.publication.id === nextPublicationId,
      )
      const selectedContextIds = new Set(mainInfo.contexts.map((item) => item.contextId))
      for (const relation of currentContexts) {
        if (!selectedContextIds.has(relation.context.id)) {
          await deletePublicationContextRequest(relation.id)
          written.add('publicationContexts')
        }
      }

      const lastPositions = new Map<number, number>()
      currentRelations.contexts.forEach((item) => {
        lastPositions.set(item.context.id, Math.max(
          lastPositions.get(item.context.id) ?? 0,
          item.position,
        ))
      })
      for (const contextId of selectedContextIds) {
        if (currentContexts.some((item) => item.context.id === contextId)) continue
        const position = (lastPositions.get(contextId) ?? 0) + 1
        const created = await createPublicationContextRequest({
          publicationId: nextPublicationId,
          contextId,
          position,
          visible: false,
          featured: false,
        })
        written.add('publicationContexts')
        lastPositions.set(contextId, created.position)
      }

      const currentTags = currentRelations.tags.filter(
        (item) => item.publication.id === nextPublicationId,
      )
      const selectedTagIds = new Set(mainInfo.tagIds)
      for (const relation of currentTags) {
        if (!selectedTagIds.has(relation.tag.id)) {
          await deletePublicationTagRequest(relation.id)
          written.add('publicationTags')
        }
      }
      for (const tagId of selectedTagIds) {
        if (!currentTags.some((item) => item.tag.id === tagId)) {
          await createPublicationTagRequest(nextPublicationId, tagId)
          written.add('publicationTags')
        }
      }

      const currentSkillGroups = currentRelations.skillGroups.filter(
        (item) => item.publication.id === nextPublicationId,
      )
      const selectedSkillGroupIds = new Set(mainInfo.skillGroupIds)
      for (const relation of currentSkillGroups) {
        if (!selectedSkillGroupIds.has(relation.skillGroup.id)) {
          await deletePublicationSkillGroupRequest(relation.id)
          written.add('publicationSkillGroups')
        }
      }
      for (const skillGroupId of selectedSkillGroupIds) {
        if (!currentSkillGroups.some((item) => item.skillGroup.id === skillGroupId)) {
          await createPublicationSkillGroupRequest(nextPublicationId, skillGroupId)
          written.add('publicationSkillGroups')
        }
      }

      savedMainInfoSnapshot.current = snapshot
      return true
    } catch (saveError) {
      setMainInfoSaveError(getErrorMessage(saveError, 'Could not save Main Info.'))
      return false
    } finally {
      if (written.size > 0) invalidate(...written)
      savingLock.current = false
      setIsSavingMainInfo(false)
    }
  }

  const finishForm = async () => {
    if (!form.validateAll()) return
    setIsFinalizing(true)
    try {
      if (!(await persistMainInfo())) {
        form.openSectionDirectly('mainInfo')
        return
      }
      if (publicationIdRef.current === null) {
        setMainInfoSaveError('The Publication could not be created.')
        form.openSectionDirectly('mainInfo')
        return
      }
      onCancel()
    } finally {
      setIsFinalizing(false)
    }
  }

  const requestSection = async (target: PublicationFormSectionId) => {
    const currentIndex = publicationFormSections.indexOf(form.openSection)
    const targetIndex = publicationFormSections.indexOf(target)

    if (targetIndex <= currentIndex) {
      form.openSectionDirectly(target)
      return
    }
    if (!form.validateTo(target)) return
    if (currentIndex === 0 && !(await persistMainInfo())) return
    form.openSectionDirectly(target)
  }

  const sectionContent: Record<PublicationFormSectionId, ReactNode> = {
    mainInfo: (
      <PublicationMainInfo
        catalogs={data.catalogs}
        errors={form.errors.mainInfo}
        onChange={form.updateMainInfo}
        onContextsChange={form.setContexts}
        onContinue={() => void requestSection('assets')}
        onSlugChange={form.setSlug}
        onTitleChange={form.setTitle}
        isSaving={isSavingMainInfo}
        saveError={mainInfoSaveError}
        values={form.values.mainInfo}
      />
    ),
    assets: publicationId === null ? (
      <PublicationSectionPlaceholder label="Save Main Info before adding Assets." />
    ) : (
      <PublicationAssets
        collections={data.catalogs.collections}
        completionError={Object.values(form.errors.assets).join(' ')}
        onAssetOperationChange={form.changePendingAssetOperations}
        onCreateCollection={() => {
          if (publicationId !== null && metaId !== null) {
            onCreateCollection({
              publicationId,
              metaId,
              values: form.values,
              openSection: 'assets',
            })
          }
        }}
        onEditCollection={(collectionId) => {
          if (publicationId !== null && metaId !== null) {
            onEditCollection({
              publicationId,
              metaId,
              values: form.values,
              openSection: 'assets',
            }, collectionId)
          }
        }}
        onContinue={() => void requestSection('texts')}
        onDirectAssetAdded={form.addDirectAsset}
        onDirectAssetChange={form.updateDirectAsset}
        onDirectAssetRemove={form.removeDirectAsset}
        onFilesSelected={form.addUploadFiles}
        onPendingUploadChange={form.updatePendingUpload}
        onPendingUploadRemove={form.removePendingUpload}
        onValuesChange={form.updateAssets}
        publicationId={publicationId}
        publicationRoles={data.catalogs.publicationRoles}
        values={form.values.assets}
      />
    ),
    texts: publicationId === null ? (
      <PublicationSectionPlaceholder label="Save Main Info before adding Texts." />
    ) : (
      <PublicationTexts
        completionError={Object.values(form.errors.texts).join(' ')}
        onValuesChange={form.updateTexts}
        publicationId={publicationId}
        values={form.values.texts}
      />
    ),
  }

  return (
    <div className="publication-form">
      <div className="publication-form-progress" aria-label={`${completedSectionCount} of 3 sections complete`}>
        <span>{completedSectionCount}/3</span>
        <LinearProgress
          aria-label="Form completion"
          value={(completedSectionCount / publicationFormSections.length) * 100}
          variant="determinate"
        />
      </div>
      {publicationFormSections.map((section, index) => (
        <Accordion
          className="publication-form-section"
          disableGutters
          expanded={form.openSection === section}
          key={section}
          onChange={(_event, isExpanded) => {
            if (isExpanded && !isSavingMainInfo) void requestSection(section)
          }}
        >
          <AccordionSummary
            aria-controls={`publication-section-${section}`}
            expandIcon={<ExpandMoreIcon />}
            id={`publication-section-${section}-header`}
          >
            {sectionComplete[section] && (
              <CheckCircleIcon
                aria-label={`${sectionLabels[section]} complete`}
                className="publication-form-section-complete"
              />
            )}
            <span className="publication-form-section-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="publication-form-section-title">{sectionLabels[section]}</span>
            {section === 'mainInfo' && (
              <span className="publication-form-section-summary">
                {mainInfoSummary || 'New publication'}
              </span>
            )}
            {section === 'assets' && (
              <span className="publication-form-section-summary publication-assets-summary">
                <span>Collections {form.values.assets.collectionIds.length}</span>
                <span>Direct Assets {form.values.assets.directAssets.length}</span>
              </span>
            )}
            {section === 'texts' && (
              <span className="publication-text-counts">
                <span>Plain Texts</span>
                <Chip
                  icon={<LayersOutlinedIcon />}
                  label={form.values.texts.associations.filter((item) => item.text?.format === 'PLAIN').length}
                  size="small"
                />
                <span>MD Texts</span>
                <Chip
                  icon={<DescriptionOutlinedIcon />}
                  label={form.values.texts.associations.filter((item) => item.text?.format === 'MD').length}
                  size="small"
                />
              </span>
            )}
          </AccordionSummary>
          <AccordionDetails id={`publication-section-${section}`}>
            {sectionContent[section]}
          </AccordionDetails>
        </Accordion>
      ))}
      <div className="publication-form-actions">
        <Button
          disabled={isFinalizing || isSavingMainInfo}
          onClick={() => void finishForm()}
          startIcon={<CheckIcon />}
          variant="contained"
        >
          {isFinalizing ? 'Checking...' : 'Save'}
        </Button>
        <Button onClick={onCancel} startIcon={<CloseIcon />} variant="outlined">Cancel</Button>
      </div>
    </div>
  )
}

export default PublicationForm
