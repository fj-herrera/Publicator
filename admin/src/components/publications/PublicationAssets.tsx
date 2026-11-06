import { useState } from 'react'
import {
  Autocomplete,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import VideoFileOutlinedIcon from '@mui/icons-material/VideoFileOutlined'
import type { Asset } from '../../entities/asset'
import type {
  AssetsValues,
  DirectAssetUploadDraft,
  DirectPublicationAssetDraft,
} from '../../entities/publication-form'
import type { Collection } from '../../entities/collection'
import { deleteCollectionRequest } from '../../services/collections.service'
import { deletePublicationAssetRequest } from '../../services/publication-form.service'
import {
  createPublicationAsset,
  updatePublicationAssetRole,
  uploadAssets,
} from '../../services/assets.service'
import { getErrorMessage } from '../../services/api-error'
import { invalidate, type ResourceName } from '../../state/resource-invalidation'
import {
  formatFileSize,
  getAssetName,
  getFileFormat,
  getPreviewUrl,
  isPreviewableImage,
} from '../assets/asset-utils'
import RoleCombobox from '../assets/RoleCombobox'
import PublicationDirectAssetEditDialog from './PublicationDirectAssetEditDialog'
import './publication-form.css'

type PublicationAssetsProps = {
  publicationId: number
  values: AssetsValues
  collections: Collection[]
  publicationRoles: string[]
  onCreateCollection: () => void
  onEditCollection: (collectionId: number) => void
  onContinue: () => void
  onValuesChange: (changes: Partial<AssetsValues>) => void
  onFilesSelected: (files: File[]) => void
  onPendingUploadChange: (key: number, changes: Partial<DirectAssetUploadDraft>) => void
  onPendingUploadRemove: (key: number) => void
  onDirectAssetAdded: (relation: DirectPublicationAssetDraft) => void
  onDirectAssetChange: (id: number, changes: Partial<DirectPublicationAssetDraft>) => void
  onDirectAssetRemove: (id: number) => void
  onAssetOperationChange: (change: number) => void
  completionError?: string
}

type CreateCollectionOption = {
  id: 'create-collection'
  name: 'Create Collection'
}

type CollectionSelectOption = Collection | CreateCollectionOption

const createCollectionOption: CreateCollectionOption = {
  id: 'create-collection',
  name: 'Create Collection',
}

function formatUploadDate(value?: string | null) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function getPreviewIcon(type: string) {
  if (type === 'Video') return <VideoFileOutlinedIcon aria-hidden="true" />
  if (type === 'Audio') return <AudioFileOutlinedIcon aria-hidden="true" />
  if (type === 'Document') return <PictureAsPdfOutlinedIcon aria-hidden="true" />
  return <InsertDriveFileOutlinedIcon aria-hidden="true" />
}

type RoleCellProps = {
  relation: DirectPublicationAssetDraft
  roles: string[]
  onSaved: (role: string) => void
  onWorkingChange: (working: boolean) => void
}

function PublicationAssetRoleCell({ relation, roles, onSaved, onWorkingChange }: RoleCellProps) {
  const [role, setRole] = useState(relation.role)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isDirty = role.trim() !== relation.role

  const save = async () => {
    const nextRole = role.trim()
    if (!nextRole || nextRole.length > 50) {
      setError('Asset Role is required and must be 50 characters or fewer.')
      return
    }
    setIsSaving(true)
    setError('')
    onWorkingChange(true)
    try {
      await updatePublicationAssetRole(relation.id, nextRole)
      invalidate('publicationAssets')
      setRole(nextRole)
      onSaved(nextRole)
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Could not update Asset Role.'))
    } finally {
      setIsSaving(false)
      onWorkingChange(false)
    }
  }

  return (
    <div className="publication-assets-role-cell">
      <RoleCombobox
        id={`publication-assets-role-${relation.id}`}
        label={`Asset Role for ${getAssetName(relation.asset)}`}
        onChange={setRole}
        options={roles}
        portalOptions
        value={role}
      />
      {isDirty && (
        <Tooltip title="Save Asset Role">
          <span>
            <IconButton aria-label="Save Asset Role" disabled={isSaving} onClick={() => void save()} size="small">
              <SaveOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {error && <span className="publication-assets-error" role="alert">{error}</span>}
    </div>
  )
}

function PublicationAssets({
  publicationId,
  values,
  collections,
  publicationRoles,
  onCreateCollection,
  onEditCollection,
  onContinue,
  onValuesChange,
  onFilesSelected,
  onPendingUploadChange,
  onPendingUploadRemove,
  onDirectAssetAdded,
  onDirectAssetChange,
  onDirectAssetRemove,
  onAssetOperationChange,
  completionError,
}: PublicationAssetsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [tableError, setTableError] = useState<Record<number, string>>({})
  const [editingAsset, setEditingAsset] = useState<DirectPublicationAssetDraft | null>(null)
  const [failedPreviews, setFailedPreviews] = useState<Set<number>>(() => new Set())
  const [busyDirectOperations, setBusyDirectOperations] = useState(0)
  const [collectionPendingDelete, setCollectionPendingDelete] = useState<Collection | null>(null)
  const [isDeletingCollection, setIsDeletingCollection] = useState(false)
  const [collectionDeleteError, setCollectionDeleteError] = useState('')
  const [collectionDeleteSuccess, setCollectionDeleteSuccess] = useState('')
  const [deletedCollectionIds, setDeletedCollectionIds] = useState<Set<number>>(() => new Set())

  const selectedCollections = values.collectionIds
    .map((id) => collections.find((collection) => collection.id === id))
    .filter((collection): collection is Collection => (
      collection !== undefined && !deletedCollectionIds.has(collection.id)
    ))
  const availableCollections = collections.filter(
    (collection) => !deletedCollectionIds.has(collection.id),
  )
  const isCollectionActionDisabled = busyDirectOperations > 0
    || values.pendingUploads.some((draft) => draft.isUploading)
  const roleOptions = [...new Set([
    ...publicationRoles,
    ...values.directAssets.map((relation) => relation.role),
  ])]

  const addFiles = (files: File[]) => {
    const currentKeys = new Set(values.pendingUploads.map(
      ({ file }) => `${file.name}:${file.size}:${file.lastModified}`,
    ))
    onFilesSelected(files.filter((file) => (
      !currentKeys.has(`${file.name}:${file.size}:${file.lastModified}`)
    )))
  }

  const confirmDeleteCollection = async () => {
    if (!collectionPendingDelete) return

    setIsDeletingCollection(true)
    setCollectionDeleteError('')
    try {
      await deleteCollectionRequest(collectionPendingDelete.id)
      invalidate('collections')
      setDeletedCollectionIds((current) => new Set(current).add(collectionPendingDelete.id))
      onValuesChange({
        collectionIds: values.collectionIds.filter((id) => id !== collectionPendingDelete.id),
      })
      setCollectionDeleteSuccess(`Collection "${collectionPendingDelete.name}" deleted successfully.`)
      setCollectionPendingDelete(null)
    } catch (deleteError) {
      setCollectionDeleteError(getErrorMessage(deleteError, 'Could not delete collection.'))
    } finally {
      setIsDeletingCollection(false)
    }
  }

  const submitUpload = async (draft: DirectAssetUploadDraft, role: string) => {
    const trimmedRole = role.trim()
    if (!trimmedRole || trimmedRole.length > 50) {
      onPendingUploadChange(draft.key, {
        role: trimmedRole,
        error: 'Asset Role is required and must be 50 characters or fewer.',
      })
      return
    }

    onPendingUploadChange(draft.key, { role: trimmedRole, error: '', isUploading: true })
    let asset: Asset | null = draft.asset
    const written = new Set<ResourceName>()
    try {
      if (!asset) {
        const uploaded = await uploadAssets([draft.file])
        if (uploaded.length > 0) written.add('assets')
        asset = uploaded[0] ?? null
        if (!asset) throw new Error('The upload returned no asset.')
        onPendingUploadChange(draft.key, { asset })
      }

      const created = await createPublicationAsset(asset.id, publicationId, trimmedRole) as {
        id: number
        role: string
        publication: { id: number }
        asset: { id: number }
      }
      written.add('publicationAssets')
      onDirectAssetAdded({ ...created, asset })
      onPendingUploadRemove(draft.key)
    } catch (uploadError) {
      onPendingUploadChange(draft.key, {
        role: trimmedRole,
        asset,
        error: getErrorMessage(uploadError, 'Could not upload or associate this file.'),
        isUploading: false,
      })
    } finally {
      if (written.size > 0) invalidate(...written)
    }
  }

  const uploadQueuedFiles = async () => {
    const queued = values.pendingUploads.filter((draft) => !draft.error && !draft.isUploading)
    if (!values.uploadRole.trim()) {
      queued.forEach((draft) => onPendingUploadChange(draft.key, {
        error: 'Choose an Asset Role before uploading.',
      }))
      return
    }
    await Promise.all(queued.map((draft) => submitUpload(draft, values.uploadRole)))
  }

  const removeDirectAsset = async (relation: DirectPublicationAssetDraft) => {
    setTableError((current) => ({ ...current, [relation.id]: '' }))
    setBusyDirectOperations((count) => count + 1)
    onAssetOperationChange(1)
    try {
      await deletePublicationAssetRequest(relation.id)
      invalidate('publicationAssets')
      onDirectAssetRemove(relation.id)
    } catch (removeError) {
      setTableError((current) => ({
        ...current,
        [relation.id]: getErrorMessage(removeError, 'Could not remove asset from publication.'),
      }))
    } finally {
      setBusyDirectOperations((count) => count - 1)
      onAssetOperationChange(-1)
    }
  }

  return (
    <div className="publication-assets">
      {completionError && <Alert severity="error">{completionError}</Alert>}
      <section className="publication-assets-collections" aria-labelledby="publication-collections-heading">
        {collectionDeleteSuccess && (
          <Alert onClose={() => setCollectionDeleteSuccess('')} severity="success">
            {collectionDeleteSuccess}
          </Alert>
        )}
        <div className="publication-assets-section-heading">
          <h3 id="publication-collections-heading">Collections</h3>
        </div>
        <Autocomplete
          filterSelectedOptions
          getOptionLabel={(option) => `${option.name} (#${option.id})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          multiple
          getOptionDisabled={(option) => (
            'id' in option
            && option.id === createCollectionOption.id
            && isCollectionActionDisabled
          )}
          onChange={(_event, next) => {
            const createCollectionSelected = next.some(
              (option) => option.id === createCollectionOption.id,
            )
            onValuesChange({
              collectionIds: next
                .filter((option): option is Collection => typeof option.id === 'number')
                .map(({ id }) => id),
            })
            if (createCollectionSelected && !isCollectionActionDisabled) onCreateCollection()
          }}
          options={[...availableCollections, createCollectionOption] satisfies CollectionSelectOption[]}
          renderOption={(props, option) => (
            <li
              {...props}
              className={[
                props.className,
                option.id === createCollectionOption.id ? 'publication-create-collection-option' : '',
              ].filter(Boolean).join(' ')}
            >
              {option.id === createCollectionOption.id && <AddIcon aria-hidden="true" />}
              {option.name}
            </li>
          )}
          renderValue={(selected, getItemProps) => selected
            .filter((option): option is Collection => typeof option.id === 'number')
            .map((collection, index) => {
            const { key, ...itemProps } = getItemProps({ index })
            return (
              <span className="publication-collection-chip" key={key}>
                <Tooltip title={`Delete ${collection.name}`}>
                  <Chip
                    {...itemProps}
                    aria-label={`Delete collection ${collection.name}`}
                    deleteIcon={<DeleteIcon />}
                    label={collection.name}
                    onDelete={() => {
                      setCollectionDeleteError('')
                      setCollectionPendingDelete(collection)
                    }}
                  />
                </Tooltip>
                <Tooltip title={`Edit ${collection.name}`}>
                  <IconButton
                    aria-label={`Edit collection ${collection.name}`}
                    className="publication-collection-chip-edit"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      onEditCollection(collection.id)
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    size="small"
                  >
                    <EditIcon aria-hidden="true" />
                  </IconButton>
                </Tooltip>
              </span>
            )
            })}
          renderInput={(params) => <TextField {...params} label="Collections" />}
          value={selectedCollections}
        />
        <Dialog
          aria-labelledby="publication-delete-collection-title"
          onClose={() => {
            if (!isDeletingCollection) setCollectionPendingDelete(null)
          }}
          open={collectionPendingDelete !== null}
        >
          <DialogTitle id="publication-delete-collection-title">Delete collection?</DialogTitle>
          <DialogContent>
            {collectionDeleteError && <Alert severity="error">{collectionDeleteError}</Alert>}
            <DialogContentText>
              {collectionPendingDelete
                ? `Delete "${collectionPendingDelete.name}"? Its assets will stay in the gallery.`
                : ''}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              disabled={isDeletingCollection}
              onClick={() => setCollectionPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              color="error"
              disabled={isDeletingCollection}
              onClick={() => void confirmDeleteCollection()}
              startIcon={<DeleteIcon />}
              variant="contained"
            >
              {isDeletingCollection ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </section>

      <section className="publication-assets-direct" aria-labelledby="publication-direct-assets-heading">
        <h3 id="publication-direct-assets-heading">Direct Assets</h3>
        <div
          className={`publication-assets-dropzone${isDragging ? ' publication-assets-dropzone-active' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsDragging(false)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            addFiles(Array.from(event.dataTransfer.files))
          }}
        >
          <label className="publication-assets-dropzone-label">
            <input
              accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.ogg,.mp4,.webm,.pdf"
              multiple
              onChange={(event) => {
                addFiles(Array.from(event.currentTarget.files ?? []))
                event.currentTarget.value = ''
              }}
              type="file"
            />
            <CloudUploadOutlinedIcon aria-hidden="true" />
            <span>Open or drag and drop</span>
            <span>SVG, PNG, JPG, WebP, GIF, MP3, WAV, OGG, MP4, WebM, or PDF. Max 100 MB per file.</span>
          </label>
        </div>
        <div className="publication-assets-upload-role">
          <label htmlFor="publication-assets-upload-role">Asset Role *</label>
          <RoleCombobox
            id="publication-assets-upload-role"
            label="Asset Role"
            onChange={(uploadRole) => onValuesChange({ uploadRole })}
            options={roleOptions}
            value={values.uploadRole}
          />
          <Button
            disabled={!values.pendingUploads.some((draft) => !draft.error && !draft.isUploading)}
            onClick={() => void uploadQueuedFiles()}
            startIcon={<CloudUploadOutlinedIcon />}
            variant="contained"
          >
            Upload selected
          </Button>
        </div>

        {values.pendingUploads.length > 0 && (
          <ul className="publication-assets-upload-list" aria-label="Files queued for direct upload">
            {values.pendingUploads.map((draft) => (
              <li key={draft.key}>
                <InsertDriveFileOutlinedIcon aria-hidden="true" />
                <span className="publication-assets-upload-name" title={draft.file.name}>{draft.file.name}</span>
                <span>{formatFileSize(draft.file.size)}</span>
                {draft.asset && <span>Uploaded, association pending</span>}
                {draft.error && <span className="publication-assets-error" role="alert">{draft.error}</span>}
                <div className="publication-assets-upload-actions">
                  {draft.error && (
                    <Button disabled={draft.isUploading} onClick={() => void submitUpload(draft, values.uploadRole)} size="small">
                      Retry
                    </Button>
                  )}
                  <Tooltip title="Remove file from this form">
                    <span>
                      <IconButton
                        aria-label={`Remove ${draft.file.name}`}
                        disabled={draft.isUploading}
                        onClick={() => onPendingUploadRemove(draft.key)}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="publication-assets-table-wrap">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell className="publication-assets-preview-column">Preview</TableCell>
                <TableCell className="publication-assets-info-column">Main Info</TableCell>
                <TableCell className="publication-assets-role-column">Asset Role</TableCell>
                <TableCell className="publication-assets-actions-column">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {values.directAssets.map((relation) => {
                const asset = relation.asset
                const previewUrl = getPreviewUrl(asset.url)
                const isImage = isPreviewableImage(asset.url) && !failedPreviews.has(asset.id)
                return (
                  <TableRow key={relation.id}>
                    <TableCell className="publication-assets-preview-column">
                      <a
                        aria-label={`Open ${getAssetName(asset)}`}
                        className="publication-assets-preview-link"
                        href={previewUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {isImage ? (
                          <img
                            alt=""
                            onError={() => setFailedPreviews((current) => new Set(current).add(asset.id))}
                            src={previewUrl}
                          />
                        ) : getPreviewIcon(asset.type)}
                      </a>
                    </TableCell>
                    <TableCell className="publication-assets-info-column">
                      <div className="publication-assets-main-info">
                        <strong>{asset.id} | {asset.type} | {getFileFormat(asset.url)} | {getAssetName(asset)}</strong>
                        <a href={previewUrl} rel="noreferrer" target="_blank">{asset.url}</a>
                        <span>
                          {asset.mimeType || 'MIME type unavailable'}
                          {' | '}
                          {asset.dimensions
                            ? `${asset.dimensions.width} × ${asset.dimensions.height} | `
                            : ''}
                          {asset.sizeBytes !== undefined && asset.sizeBytes !== null
                            ? formatFileSize(asset.sizeBytes)
                            : 'Size unavailable'}
                          {asset.uploadedAt ? ` | ${formatUploadDate(asset.uploadedAt)}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="publication-assets-role-column">
                      <PublicationAssetRoleCell
                        key={`${relation.id}-${relation.role}`}
                        onSaved={(role) => onDirectAssetChange(relation.id, { role })}
                        onWorkingChange={(working) => {
                          setBusyDirectOperations((count) => count + (working ? 1 : -1))
                          onAssetOperationChange(working ? 1 : -1)
                        }}
                        relation={relation}
                        roles={roleOptions}
                      />
                    </TableCell>
                    <TableCell className="publication-assets-actions-column">
                      <span className="data-grid-actions">
                        <Tooltip title="Edit asset">
                          <IconButton aria-label={`Edit ${getAssetName(asset)}`} onClick={() => setEditingAsset(relation)}>
                            <EditIcon aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove association from publication">
                          <IconButton
                            aria-label={`Remove ${getAssetName(asset)} from publication`}
                            onClick={() => void removeDirectAsset(relation)}
                          >
                            <DeleteIcon aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                        {tableError[relation.id] && (
                          <span className="publication-assets-error" role="alert">{tableError[relation.id]}</span>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
              {values.directAssets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="publication-assets-empty">No direct assets.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="publication-form-section-actions">
        <Button endIcon={<ArrowDownwardIcon />} onClick={onContinue} variant="contained">
          Continue
        </Button>
      </div>

      {editingAsset && (
        <PublicationDirectAssetEditDialog
          onClose={() => setEditingAsset(null)}
          onSaved={(relation) => onDirectAssetChange(relation.id, relation)}
          relation={editingAsset}
          roles={roleOptions}
        />
      )}
    </div>
  )
}

export default PublicationAssets
