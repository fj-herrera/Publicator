import { useEffect, useRef, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import CollectionsIcon from '@mui/icons-material/Collections'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import SectionTabs from '../components/navigation/SectionTabs'
import AssetTextsEditor from '../components/assets/AssetTextsEditor'
import AssetUploadForm from '../components/assets/AssetUploadForm'
import {
  formatFileSize,
  getAssetName,
  getFileFormat,
  getPreviewUrl,
  isPreviewableImage,
} from '../components/assets/asset-utils'
import Collections from '../views/Collections'
import PublicationRelationDrafts from '../components/assets/PublicationRelationDrafts'
import RoleCombobox from '../components/assets/RoleCombobox'
import type {
  Asset,
  AssetCollectionRelation,
  PublicationAssetTarget,
  PublicationAssetRelation,
} from '../entities/asset'
import type { PublicationRelationDraft } from '../components/assets/PublicationRelationDrafts'
import type { AssetText, AssetTextDraft } from '../entities/asset-text'
import { getAssetTexts, saveAssetTextDrafts } from '../services/asset-texts.service'
import {
  createPublicationAsset,
  getAssetCollections,
  getAssets,
  getPublications,
  getPublicationAssets,
  updateAssetName,
  updatePublicationAssetRole,
} from '../services/assets.service'
import { getErrorMessage } from '../services/api-error'
import './gallery.css'

type AssetRelations = {
  publications: PublicationAssetRelation[]
  collections: AssetCollectionRelation[]
}

function formatUploadDate(value?: string | null) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
}

function getRelationLabel(relation: PublicationAssetRelation | AssetCollectionRelation) {
  if ('publication' in relation) {
    return relation.publication.meta
      ? `${relation.publication.meta.title} / ${relation.publication.meta.slug}`
      : `Publication #${relation.publication.id}`
  }

  return relation.collection.type
    ? `${relation.collection.type} (#${relation.collection.id})`
    : `Collection #${relation.collection.id}`
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
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

function Gallery() {
  const [activeGalleryTab, setActiveGalleryTab] = useState('collections')
  const [assets, setAssets] = useState<Asset[]>([])
  const [publications, setPublications] = useState<PublicationAssetTarget[]>([])
  const [relations, setRelations] = useState<Record<number, AssetRelations>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isEditingAsset, setIsEditingAsset] = useState(false)
  const [editedAssetName, setEditedAssetName] = useState('')
  const [editedPublicationRoles, setEditedPublicationRoles] = useState<Record<number, string>>({})
  const [newPublicationRelations, setNewPublicationRelations] = useState<PublicationRelationDraft[]>([])
  const [assetTexts, setAssetTexts] = useState<Record<number, AssetText[]>>({})
  const [assetTextDrafts, setAssetTextDrafts] = useState<AssetTextDraft[]>([])
  const [isSavingAsset, setIsSavingAsset] = useState(false)
  const [assetEditError, setAssetEditError] = useState('')
  const [actionAsset, setActionAsset] = useState<Asset | null>(null)
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false)
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false)
  const [failedPreviews, setFailedPreviews] = useState<Set<number>>(() => new Set())
  const [retryCount, setRetryCount] = useState(0)
  const nextPublicationRelationKey = useRef(0)
  const nextAssetTextKey = useRef(0)

  const groupAssetTexts = (items: AssetText[]) => {
    const grouped: Record<number, AssetText[]> = {}
    items.forEach((item) => {
      grouped[item.asset.id] = [...(grouped[item.asset.id] ?? []), item]
    })
    return grouped
  }

  useEffect(() => {
    let isCurrent = true

    const loadAssets = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [
          loadedAssets,
          publicationRelations,
          collectionRelations,
          loadedPublications,
          loadedAssetTexts,
        ] = await Promise.all([
          getAssets(),
          getPublicationAssets(),
          getAssetCollections(),
          getPublications(),
          getAssetTexts(),
        ])
        const nextRelations: Record<number, AssetRelations> = {}

        loadedAssets.forEach((asset) => {
          nextRelations[asset.id] = {
            publications: publicationRelations.filter((relation) => relation.asset.id === asset.id),
            collections: collectionRelations.filter((relation) => relation.asset.id === asset.id),
          }
        })

        if (isCurrent) {
          setAssets(loadedAssets)
          setPublications(loadedPublications)
          setAssetTexts(groupAssetTexts(loadedAssetTexts))
          setRelations(nextRelations)
          setFailedPreviews(new Set())
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(getErrorMessage(loadError, 'Could not load assets.'))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadAssets()

    return () => {
      isCurrent = false
    }
  }, [retryCount])

  const assetTypes = Array.from(new Set(assets.map((asset) => asset.type))).sort()
  const publicationRoles = Array.from(new Set(
    Object.values(relations).flatMap(({ publications: items }) => items.map(({ role }) => role)),
  )).sort()
  const collectionRoles = Array.from(new Set(
    Object.values(relations).flatMap(({ collections: items }) => items.map(({ role }) => role)),
  )).sort()
  const assetTextRoles = Array.from(new Set(
    Object.values(assetTexts).flatMap((items) => items.map(({ type }) => type)),
  )).sort()
  const normalizedQuery = query.trim().toLowerCase()
  const visibleAssets = assets.filter((asset) => {
    const assetRelations = relations[asset.id] ?? { publications: [], collections: [] }
    const relationLabels = [
      ...assetRelations.publications.map(getRelationLabel),
      ...assetRelations.collections.map(getRelationLabel),
    ]
    const searchValues = [
      getAssetName(asset),
      asset.url,
      asset.type,
      ...relationLabels,
    ]
    const matchesQuery = searchValues.some((value) => value.toLowerCase().includes(normalizedQuery))

    return matchesQuery && (selectedType === 'all' || asset.type === selectedType)
  })

  const openAssetDetails = (asset: Asset, editMode = false) => {
    setSelectedAsset(asset)
    setActionAsset(null)
    setIsEditingAsset(editMode)
    setEditedAssetName(getAssetName(asset))
    setEditedPublicationRoles(Object.fromEntries(
      (relations[asset.id]?.publications ?? []).map((relation) => [relation.id, relation.role]),
    ))
    setNewPublicationRelations([])
    setAssetTextDrafts((assetTexts[asset.id] ?? []).map(
      (assetText) => toTextDraft(assetText, nextAssetTextKey.current++),
    ))
    setAssetEditError('')
  }

  const cancelAssetEdit = () => {
    setSelectedAsset(null)
    setIsEditingAsset(false)
    setNewPublicationRelations([])
    setAssetTextDrafts([])
    setAssetEditError('')
  }

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

  const saveAssetEdit = async () => {
    if (!selectedAsset) {
      return
    }

    const trimmedName = editedAssetName.trim()
    if (!trimmedName || trimmedName.length > 255) {
      setAssetEditError('Enter a file name of 1 to 255 characters.')
      return
    }

    const publicationRelations = relations[selectedAsset.id]?.publications ?? []
    const trimmedRoles = Object.fromEntries(
      publicationRelations.map((relation) => [relation.id, editedPublicationRoles[relation.id]?.trim() ?? '']),
    )

    if (Object.values(trimmedRoles).some((role) => !role)) {
      setAssetEditError('Every publication association must have a role.')
      return
    }

    if (Object.values(trimmedRoles).some((role) => role.length > 50)) {
      setAssetEditError('Roles can contain up to 50 characters.')
      return
    }

    if (newPublicationRelations.some((relation) => (
      !relation.publicationId || !relation.role.trim() || relation.role.trim().length > 50
    ))) {
      setAssetEditError('Choose a publication and a role for each new relation.')
      return
    }

    const activeTextDrafts = assetTextDrafts.filter((draft) => !draft.isRemoved)
    if (activeTextDrafts.some((draft) => !draft.role.trim() || !draft.text.trim())) {
      setAssetEditError('Every text needs a role and some content.')
      return
    }

    if (activeTextDrafts.some((draft) => draft.role.trim().length > 50)) {
      setAssetEditError('Text roles can contain up to 50 characters.')
      return
    }

    const relationKeys = new Set<string>()
    for (const relation of publicationRelations) {
      const key = `${relation.publication.id}:${trimmedRoles[relation.id].toLowerCase()}`
      if (relationKeys.has(key)) {
        setAssetEditError('This publication cannot have duplicate roles for the same asset.')
        return
      }
      relationKeys.add(key)
    }

    for (const relation of newPublicationRelations) {
      const key = `${relation.publicationId}:${relation.role.trim().toLowerCase()}`
      if (relationKeys.has(key)) {
        setAssetEditError('This publication already has an association with that role.')
        return
      }
      relationKeys.add(key)
    }

    setIsSavingAsset(true)
    setAssetEditError('')

    try {
      const updatedAsset = await updateAssetName(selectedAsset.id, trimmedName)
      const changedRoles = publicationRelations.filter(
        (relation) => trimmedRoles[relation.id] !== relation.role,
      )
      const roleResults = await Promise.allSettled(changedRoles.map((relation) => (
        updatePublicationAssetRole(relation.id, trimmedRoles[relation.id])
      )))
      const relationResults = await Promise.allSettled(newPublicationRelations.map((relation) => (
        createPublicationAsset(
          selectedAsset.id,
          Number(relation.publicationId),
          relation.role.trim(),
        )
      )))
      const assetWithDetails = { ...selectedAsset, ...updatedAsset }
      const savedRoles: Record<number, string> = {}
      changedRoles.forEach((relation, index) => {
        if (roleResults[index].status === 'fulfilled') {
          savedRoles[relation.id] = trimmedRoles[relation.id]
        }
      })
      const savedRelations: PublicationAssetRelation[] = []
      const failedDraftKeys = new Set<number>()
      relationResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedDraftKeys.add(newPublicationRelations[index].key)
          return
        }

        const createdRelation = result.value as PublicationAssetRelation
        const publication = publications.find(
          (item) => item.id === Number(newPublicationRelations[index].publicationId),
        )
        if (publication) {
          savedRelations.push({
            ...createdRelation,
            publication: { ...createdRelation.publication, ...publication },
          })
        }
      })
      const currentAssetTexts = assetTexts[selectedAsset.id] ?? []
      const textFailures = await saveAssetTextDrafts(
        selectedAsset.id,
        assetTextDrafts,
        currentAssetTexts,
      )
      let refreshedAssetTexts: AssetText[] | null = null
      try {
        refreshedAssetTexts = (await getAssetTexts())
          .filter((item) => item.asset.id === selectedAsset.id)
      } catch {
        // The saved texts stay in the editor; the list refreshes on the next load.
      }
      const hasTextFailures = textFailures.size > 0 || refreshedAssetTexts === null
      const hasSaveFailures = hasTextFailures
        || roleResults.some((result) => result.status === 'rejected')
        || relationResults.some((result) => result.status === 'rejected')

      setAssets((currentAssets) => currentAssets.map((asset) => (
        asset.id === selectedAsset.id ? assetWithDetails : asset
      )))
      setRelations((currentRelations) => {
        const currentAssetRelations = currentRelations[selectedAsset.id]
          ?? { publications: [], collections: [] }

        return {
          ...currentRelations,
          [selectedAsset.id]: {
            ...currentAssetRelations,
            publications: [
              ...publicationRelations.map((relation) => ({
                ...relation,
                role: savedRoles[relation.id] ?? relation.role,
              })),
              ...savedRelations,
            ],
          },
        }
      })
      setSelectedAsset(assetWithDetails)
      setEditedAssetName(trimmedName)
      setEditedPublicationRoles((currentRoles) => ({ ...currentRoles, ...savedRoles }))
      setNewPublicationRelations((currentDrafts) => currentDrafts.filter(
        (draft) => failedDraftKeys.has(draft.key),
      ))
      if (refreshedAssetTexts) {
        const failedDrafts = assetTextDrafts
          .filter((draft) => textFailures.has(draft.key))
          .map((draft) => ({ ...draft, error: textFailures.get(draft.key) }))
        const failedIds = new Set(failedDrafts.map((draft) => draft.id))
        setAssetTexts((currentTexts) => ({ ...currentTexts, [selectedAsset.id]: refreshedAssetTexts }))
        setAssetTextDrafts([
          ...refreshedAssetTexts
            .filter((item) => !failedIds.has(item.id))
            .map((item) => toTextDraft(item, nextAssetTextKey.current++)),
          ...failedDrafts,
        ])
      } else {
        // Without a refresh the saved state is unknown, so report failures on the unsaved drafts.
        setAssetTextDrafts((drafts) => drafts.map((draft) => (
          textFailures.has(draft.key) ? { ...draft, error: textFailures.get(draft.key) } : draft
        )))
      }
      if (refreshedAssetTexts === null) {
        setAssetEditError('Texts were saved, but the list could not be refreshed. Reload the gallery before editing them again.')
      } else if (hasSaveFailures) {
        setAssetEditError('Some changes were saved. Review the remaining fields and save again.')
      } else {
        setIsEditingAsset(false)
        setSelectedAsset(null)
        setNewPublicationRelations([])
        setAssetTextDrafts([])
      }
    } catch (saveError) {
      setAssetEditError(getErrorMessage(saveError, 'Could not save asset changes. You can retry.'))
    } finally {
      setIsSavingAsset(false)
    }
  }

  const isAssetsTab = activeGalleryTab === 'assets'

  const handleGalleryTabChange = (tab: string) => {
    setActiveGalleryTab(tab)
    // Collections can change the associations shown on each asset.
    if (tab === 'assets') {
      setRetryCount((count) => count + 1)
    }
  }

  const downloadFilteredAssets = () => {
    const rows = [
      ['id', 'file name', 'type', 'url', 'publication ids', 'collection ids'],
      ...visibleAssets.map((asset) => {
        const assetRelations = relations[asset.id] ?? { publications: [], collections: [] }
        return [
          String(asset.id),
          getAssetName(asset),
          asset.type,
          asset.url,
          assetRelations.publications.map(({ publication }) => publication.id).join('; '),
          assetRelations.collections.map(({ collection }) => collection.id).join('; '),
        ]
      }),
    ]
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
    const fileUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = 'publicator-assets.csv'
    link.click()
    URL.revokeObjectURL(fileUrl)
  }

  return (
    <main className="gallery-page">
      <header className="gallery-header">
        <SectionTabs
          value={activeGalleryTab}
          onChange={handleGalleryTabChange}
          items={[
            { label: 'Collections', value: 'collections', icon: <CollectionsIcon /> },
            { label: 'Assets', value: 'assets', icon: <ImageOutlinedIcon /> },
          ]}
          createLabels={{ assets: 'Create Asset', collections: 'Create Collection' }}
          onCreate={() => {
            if (isAssetsTab) {
              setSelectedAsset(null)
              setIsCreateAssetOpen((isOpen) => !isOpen)
            } else {
              setIsCreateCollectionOpen(true)
            }
          }}
        />
        {isAssetsTab && isCreateAssetOpen && (
          <AssetUploadForm
            collectionRoles={collectionRoles}
            onCancel={() => setIsCreateAssetOpen(false)}
            onComplete={() => setRetryCount((count) => count + 1)}
            publicationRoles={publicationRoles}
          />
        )}
        {isAssetsTab && (
        <div className="gallery-controls">
          <label className="gallery-search">
            <SearchIcon aria-hidden="true" />
            <input
              aria-label="Search assets"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets"
              type="search"
              value={query}
            />
          </label>
          <label className="gallery-type-filter">
            <span>Type</span>
            <select
              aria-label="Filter by asset type"
              onChange={(event) => setSelectedType(event.target.value)}
              value={selectedType}
            >
              <option value="all">All types</option>
              {assetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <button
            aria-label="Download filtered assets as CSV"
            className="gallery-icon-button"
            disabled={visibleAssets.length === 0}
            onClick={downloadFilteredAssets}
            title="Download filtered inventory as CSV"
            type="button"
          >
            <DownloadIcon aria-hidden="true" />
          </button>
        </div>
        )}
      </header>

      {activeGalleryTab === 'collections' && (
        <Collections
          isCreateFormOpen={isCreateCollectionOpen}
          onCreateFormClose={() => setIsCreateCollectionOpen(false)}
          onCreateFormOpen={() => setIsCreateCollectionOpen(true)}
        />
      )}

      {isAssetsTab && selectedAsset && (
        <section aria-labelledby="asset-detail-title" className="asset-detail-panel">
          <header className="asset-detail-header">
            <div>
              <p>Asset details</p>
              <h2 id="asset-detail-title">{getAssetName(selectedAsset)}</h2>
            </div>
            <button
              aria-label="Close asset details"
              className="gallery-icon-button"
              onClick={cancelAssetEdit}
              type="button"
            >
              <CloseIcon aria-hidden="true" />
            </button>
          </header>
          <form
            className="asset-detail-form"
            onSubmit={(event) => {
              event.preventDefault()
              void saveAssetEdit()
            }}
          >
          <div className="asset-detail-content">
            <div className="asset-detail-preview">
              {isPreviewableImage(selectedAsset.url)
                && !failedPreviews.has(selectedAsset.id) ? (
                  <img
                    alt={getAssetName(selectedAsset)}
                    onError={() => setFailedPreviews((current) => new Set(current).add(selectedAsset.id))}
                    src={getPreviewUrl(selectedAsset.url)}
                  />
                ) : <InsertDriveFileOutlinedIcon aria-hidden="true" />}
            </div>
            <dl className="asset-detail-facts">
              <div>
                <dt>File name</dt>
                <dd>{isEditingAsset ? (
                  <input
                    aria-label="File name"
                    autoComplete="off"
                    maxLength={255}
                    onChange={(event) => setEditedAssetName(event.target.value)}
                    required
                    value={editedAssetName}
                  />
                ) : getAssetName(selectedAsset)}</dd>
              </div>
              <div><dt>URL</dt><dd><a href={getPreviewUrl(selectedAsset.url)} rel="noreferrer" target="_blank">{selectedAsset.url}</a></dd></div>
              <div><dt>MIME type</dt><dd>{selectedAsset.mimeType || 'Not available'}</dd></div>
              <div><dt>Dimensions</dt><dd>{selectedAsset.dimensions
                ? `${selectedAsset.dimensions.width} × ${selectedAsset.dimensions.height}`
                : 'Not available'}</dd></div>
              <div><dt>File size</dt><dd>{selectedAsset.sizeBytes !== undefined && selectedAsset.sizeBytes !== null
                ? formatFileSize(selectedAsset.sizeBytes)
                : 'Not available'}</dd></div>
              <div><dt>Date</dt><dd>{formatUploadDate(selectedAsset.uploadedAt)}</dd></div>
            </dl>
            <section className="asset-detail-relations">
              <h3>Publication relations</h3>
              {relations[selectedAsset.id]?.publications.length ? (
                <ul>
                  {relations[selectedAsset.id].publications.map((relation) => (
                    <li key={relation.id}>
                      <span>{getRelationLabel(relation)}</span>
                      {isEditingAsset ? (
                          <RoleCombobox
                            id={`asset-role-${relation.id}`}
                            label={`Role for ${getRelationLabel(relation)}`}
                            onChange={(value) => setEditedPublicationRoles((currentRoles) => ({
                              ...currentRoles,
                              [relation.id]: value,
                            }))}
                            options={publicationRoles}
                            value={editedPublicationRoles[relation.id] ?? relation.role}
                        />
                      ) : <span>{relation.role}</span>}
                    </li>
                  ))}
                </ul>
              ) : <p>No publication associations.</p>}
              {isEditingAsset && (
                <PublicationRelationDrafts
                  drafts={newPublicationRelations}
                  onAdd={() => setNewPublicationRelations((currentRelations) => ([
                    ...currentRelations,
                    {
                      key: nextPublicationRelationKey.current++,
                      publicationId: '',
                      role: '',
                    },
                  ]))}
                  onChange={(key, changes) => setNewPublicationRelations((currentRelations) => (
                    currentRelations.map((relation) => (
                      relation.key === key ? { ...relation, ...changes } : relation
                    ))
                  ))}
                  onRemove={(key) => setNewPublicationRelations((currentRelations) => (
                    currentRelations.filter((relation) => relation.key !== key)
                  ))}
                  publications={publications}
                  roles={publicationRoles}
                />
              )}
              <h3>Collection relations</h3>
              {relations[selectedAsset.id]?.collections.length ? (
                <ul>
                  {relations[selectedAsset.id].collections.map((relation) => (
                    <li key={relation.id}>
                      <span>{getRelationLabel(relation)}</span>
                        <span>{relation.role}</span>
                    </li>
                  ))}
                </ul>
              ) : <p>No collection associations.</p>}
            </section>
            <AssetTextsEditor
              drafts={assetTextDrafts}
              isEditing={isEditingAsset}
              onAdd={() => setAssetTextDrafts((drafts) => [
                ...drafts,
                {
                  key: nextAssetTextKey.current++,
                  id: null,
                  role: '',
                  text: '',
                  isRemoved: false,
                },
              ])}
              onChange={changeAssetTextDraft}
              onRemove={removeAssetTextDraft}
              onRestore={restoreAssetTextDraft}
              roles={assetTextRoles}
            />
          </div>
          {assetEditError && <p className="asset-detail-error" role="alert">{assetEditError}</p>}
          {isEditingAsset && (
            <footer className="asset-detail-actions">
              <button className="asset-detail-cancel" onClick={cancelAssetEdit} type="button">Cancel</button>
              <button className="asset-detail-save" disabled={isSavingAsset} type="submit">
                {isSavingAsset ? 'Saving...' : 'Save'}
              </button>
            </footer>
          )}
          </form>
        </section>
      )}

      {isAssetsTab && error && (
        <div className="gallery-message gallery-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
        </div>
      )}

      {!isAssetsTab ? null : isLoading ? (
        <div className="gallery-message" role="status">Loading assets...</div>
      ) : !error && assets.length === 0 ? (
        <div className="gallery-message gallery-empty" role="status">
          <ImageOutlinedIcon aria-hidden="true" />
          <h2>No assets yet</h2>
          <p>Uploaded assets will appear here.</p>
        </div>
      ) : !error && visibleAssets.length === 0 ? (
        <div className="gallery-message gallery-empty" role="status">
          <SearchIcon aria-hidden="true" />
          <h2>No assets found</h2>
          <p>Try a different search or type filter.</p>
        </div>
      ) : !error && (
        <section className="asset-grid" aria-label="Assets">
          {visibleAssets.map((asset) => {
            const assetRelations = relations[asset.id] ?? { publications: [], collections: [] }
            const allRelations = [...assetRelations.publications, ...assetRelations.collections]
            const isImage = isPreviewableImage(asset.url)

            return (
              <article className="asset-card" key={asset.id}>
                <button
                  aria-label={`Show actions for ${getAssetName(asset)}`}
                  className="asset-card-open"
                  onClick={() => setActionAsset(asset)}
                  type="button"
                >
                  <span className="asset-preview">
                    {isImage && !failedPreviews.has(asset.id) ? (
                      <img
                        alt=""
                        loading="lazy"
                        onError={() => setFailedPreviews((current) => new Set(current).add(asset.id))}
                        src={getPreviewUrl(asset.url)}
                      />
                    ) : <InsertDriveFileOutlinedIcon aria-hidden="true" />}
                  </span>
                  <span className="asset-card-meta">
                    <span className="asset-card-topline">
                      <span className="asset-file-name" title={getAssetName(asset)}>
                        {getAssetName(asset)}
                      </span>
                      <span className="asset-format">{getFileFormat(asset.url)}</span>
                    </span>
                    <span className="asset-type">{asset.type}</span>
                    <span className="asset-relations">
                      {allRelations.length > 0
                        ? `${allRelations.length} ${allRelations.length === 1 ? 'association' : 'associations'}`
                        : 'No associations'}
                    </span>
                  </span>
                </button>
                <button
                  aria-label={`Show actions for ${getAssetName(asset)}`}
                  className="asset-card-menu-trigger"
                  onClick={() => setActionAsset(asset)}
                  type="button"
                >
                    <MoreVertIcon aria-hidden="true" />
                </button>
                {actionAsset?.id === asset.id && (
                  <div className="asset-action-overlay">
                    <div aria-label={`Actions for ${getAssetName(asset)}`} className="asset-action-menu" role="menu">
                      <button
                        onClick={() => openAssetDetails(asset, true)}
                        role="menuitem"
                        type="button"
                      >
                        <EditOutlinedIcon aria-hidden="true" /> Edit
                      </button>
                      <button
                        onClick={() => openAssetDetails(asset)}
                        role="menuitem"
                        type="button"
                      >
                        <VisibilityOutlinedIcon aria-hidden="true" /> View
                      </button>
                      <button
                        disabled
                        role="menuitem"
                        title="Retirement needs a dedicated API operation"
                        type="button"
                      >
                        <DeleteIcon aria-hidden="true" /> Remove
                      </button>
                      <button
                        onClick={() => setActionAsset(null)}
                        role="menuitem"
                        type="button"
                      >
                        <ArrowBackIcon aria-hidden="true" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}

    </main>
  )
}

export default Gallery