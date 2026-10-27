import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import AssetUploadForm from '../components/assets/AssetUploadForm'
import RoleCombobox from '../components/assets/RoleCombobox'
import type {
  Asset,
  AssetCollectionRelation,
  PublicationAssetRelation,
} from '../entities/asset'
import {
  getAssetCollections,
  getAssets,
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

function getFileName(url: string) {
  const path = url.split(/[?#]/, 1)[0]
  const fileName = path.split('/').pop() || url

  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

function getFileFormat(url: string) {
  const fileName = getFileName(url)
  const extension = fileName.split('.').pop()
  return extension && extension !== fileName ? extension.toUpperCase() : 'FILE'
}

function getAssetName(asset: Asset) {
  return asset.name?.trim() || getFileName(asset.url)
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

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getPreviewUrl(url: string) {
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('/')) {
    return url
  }

  return `/media/${url}`
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

function Gallery() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [relations, setRelations] = useState<Record<number, AssetRelations>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isEditingAsset, setIsEditingAsset] = useState(false)
  const [editedAssetName, setEditedAssetName] = useState('')
  const [editedPublicationRoles, setEditedPublicationRoles] = useState<Record<number, string>>({})
  const [isSavingAsset, setIsSavingAsset] = useState(false)
  const [assetEditError, setAssetEditError] = useState('')
  const [actionAsset, setActionAsset] = useState<Asset | null>(null)
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false)
  const [failedPreviews, setFailedPreviews] = useState<Set<number>>(() => new Set())
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    const loadAssets = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [loadedAssets, publicationRelations, collectionRelations] = await Promise.all([
          getAssets(),
          getPublicationAssets(),
          getAssetCollections(),
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
    setAssetEditError('')
  }

  const cancelAssetEdit = () => {
    setSelectedAsset(null)
    setIsEditingAsset(false)
    setAssetEditError('')
  }

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

    setIsSavingAsset(true)
    setAssetEditError('')

    try {
      const updatedAsset = await updateAssetName(selectedAsset.id, trimmedName)
      const changedRoles = publicationRelations.filter(
        (relation) => trimmedRoles[relation.id] !== relation.role,
      )
      await Promise.all(changedRoles.map((relation) => (
        updatePublicationAssetRole(relation.id, trimmedRoles[relation.id])
      )))
      const assetWithDetails = { ...selectedAsset, ...updatedAsset }

      setAssets((currentAssets) => currentAssets.map((asset) => (
        asset.id === selectedAsset.id ? assetWithDetails : asset
      )))
      setRelations((currentRelations) => ({
        ...currentRelations,
        [selectedAsset.id]: {
          ...currentRelations[selectedAsset.id],
          publications: publicationRelations.map((relation) => ({
            ...relation,
            role: trimmedRoles[relation.id],
          })),
        },
      }))
      setSelectedAsset(assetWithDetails)
      setEditedAssetName(trimmedName)
      setIsEditingAsset(false)
    } catch (saveError) {
      setAssetEditError(getErrorMessage(saveError, 'Could not save asset changes. You can retry.'))
    } finally {
      setIsSavingAsset(false)
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
        <div className="gallery-tab-row">
          <nav className="gallery-tabs" aria-label="Gallery sections">
            <button className="gallery-tab" type="button" disabled>
              <span className="gallery-tab-grid" aria-hidden="true">▦</span>
              Collections
            </button>
            <button className="gallery-tab gallery-tab-active" type="button" aria-current="page">
              <ImageOutlinedIcon aria-hidden="true" />
              Assets
            </button>
          </nav>
          <button
            className="gallery-create-button"
            onClick={() => {
              setSelectedAsset(null)
              setIsCreateAssetOpen((isOpen) => !isOpen)
            }}
            type="button"
          >
            <AddIcon aria-hidden="true" />
            Create Asset
          </button>
        </div>
        {isCreateAssetOpen && (
          <AssetUploadForm
            collectionRoles={collectionRoles}
            onCancel={() => setIsCreateAssetOpen(false)}
            onComplete={() => setRetryCount((count) => count + 1)}
            publicationRoles={publicationRoles}
          />
        )}
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
      </header>

      {selectedAsset && (
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
              {/\.(avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(selectedAsset.url)
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

      {error && (
        <div className="gallery-message gallery-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
        </div>
      )}

      {isLoading ? (
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
            const isImage = /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(asset.url)

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