import { useRef, useState } from 'react'
import { Alert, Autocomplete, Button, Chip, IconButton, TextField, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import UndoIcon from '@mui/icons-material/Undo'
import { apiMessages } from '../../constants/api-messages'
import type { Asset, PublicationAssetTarget } from '../../entities/asset'
import type {
  CollectionAsset,
  CollectionAssetDraft,
  CollectionRow,
} from '../../entities/collection'
import { getErrorMessage } from '../../services/api-error'
import {
  saveCollectionAssetDrafts,
  updateCollectionRequest,
} from '../../services/collections.service'
import {
  formatFileSize,
  getAssetName,
  getPreviewUrl,
  isPreviewableImage,
} from '../assets/asset-utils'
import { invalidate, type ResourceName } from '../../state/resource-invalidation'
import CollectionTypeField from './CollectionTypeField'
import RoleCombobox from '../assets/RoleCombobox'
import DataGrid, { type DataGridColumn } from '../data-display/DataGrid'
import CollectionAssetPicker from './CollectionAssetPicker'
import './collections.css'

type CollectionEditorProps = {
  collection: CollectionRow
  inventory: Asset[]
  publications: PublicationAssetTarget[]
  roles: string[]
  typeOptions: string[]
  // The collection comes from shared data that is reloading after a write.
  isRefreshing: boolean
  // The shared data could not be loaded, so it may not match the server.
  isStale: boolean
  onSaved: () => void
  onClose: () => void
}

type DraftRow = {
  id: number
  draft: CollectionAssetDraft
  // Position among the assets that stay in the collection; null for removed ones.
  position: number | null
}

const uploadDateFormatter = new Intl.DateTimeFormat('es-ES')

function toDrafts(items: CollectionAsset[]): CollectionAssetDraft[] {
  return items.map((item, index) => ({
    key: index,
    id: item.id,
    asset: item.asset,
    role: item.role,
    isRemoved: false,
  }))
}

function CollectionEditor({
  collection,
  inventory,
  publications,
  roles,
  typeOptions,
  isRefreshing,
  isStale,
  onSaved,
  onClose,
}: CollectionEditorProps) {
  const nextKey = useRef(collection.assets.length)
  const [name, setName] = useState(collection.name)
  const [type, setType] = useState(collection.type)
  const [publication, setPublication] = useState(
    () => publications.find((item) => item.id === collection.publication.id) ?? null,
  )
  const [drafts, setDrafts] = useState(() => toDrafts(collection.assets))
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const activeDrafts = drafts.filter((draft) => !draft.isRemoved)
  const availableAssets = inventory.filter(
    (asset) => !activeDrafts.some((draft) => draft.asset.id === asset.id),
  )

  const changeDraft = (key: number, changes: Partial<CollectionAssetDraft>) => {
    setDrafts((current) => current.map((draft) => (
      draft.key === key ? { ...draft, ...changes, error: undefined } : draft
    )))
  }

  const removeDraft = (key: number) => setDrafts((current) => current
    .filter((draft) => draft.id !== null || draft.key !== key)
    .map((draft) => (draft.key === key ? { ...draft, isRemoved: true, error: undefined } : draft)))

  const moveDraft = (key: number, direction: -1 | 1) => setDrafts((current) => {
    const index = current.findIndex((draft) => draft.key === key)
    let target = index + direction

    while (target >= 0 && target < current.length && current[target].isRemoved) {
      target += direction
    }

    if (target < 0 || target >= current.length) {
      return current
    }

    const next = [...current]
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })

  const addAssets = (selected: Asset[], role: string) => {
    setDrafts((current) => [
      ...current,
      ...selected.map((asset) => ({
        key: nextKey.current++,
        id: null,
        asset,
        role,
        isRemoved: false,
      })),
    ])
    setIsPickerOpen(false)
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    const trimmedType = type.trim()

    if (!trimmedName) {
      setError('Enter a collection name.')
      return
    }

    if (!trimmedType || trimmedType.length > 50) {
      setError('Enter a collection type of 1 to 50 characters.')
      return
    }

    if (!publication) {
      setError('Select the publication of the collection.')
      return
    }

    if (activeDrafts.some((draft) => !draft.role.trim() || draft.role.trim().length > 50)) {
      setError('Every asset needs a role of 1 to 50 characters.')
      return
    }

    setIsSaving(true)
    setError('')
    const written = new Set<ResourceName>()

    try {
      const changes: { name?: string; type?: string; publicationId?: number } = {}
      if (trimmedName !== collection.name) changes.name = trimmedName
      if (trimmedType !== collection.type) changes.type = trimmedType
      if (publication.id !== collection.publication.id) {
        changes.publicationId = publication.id
      }

      if (Object.keys(changes).length > 0) {
        await updateCollectionRequest(collection.id, changes)
        written.add('collections')
      }

      const result = await saveCollectionAssetDrafts(collection.id, drafts, collection.assets)
      if (result.hasChanges) written.add('collectionAssets')

      if (result.failures.size === 0 && !result.orderError) {
        onSaved()
        return
      }

      setDrafts(drafts.flatMap((draft) => {
        const failure = result.failures.get(draft.key)

        if (failure) {
          return [{ ...draft, error: failure }]
        }

        if (draft.isRemoved) {
          return []
        }

        return [{ ...draft, id: draft.id ?? result.createdIds.get(draft.key) ?? null, error: undefined }]
      }))

      const messages: string[] = []
      if (result.failures.size > 0) {
        messages.push('Some changes could not be saved. Review the marked rows and save again.')
      }
      if (result.orderError) {
        messages.push(`The assets were saved but the order was not: ${result.orderError}`)
      }
      setError(messages.join(' '))
    } catch (saveError) {
      setError(getErrorMessage(saveError, apiMessages.collections.updateFailed))
    } finally {
      if (written.size > 0) invalidate(...written)
      setIsSaving(false)
    }
  }

  let activePosition = 0
  const rows: DraftRow[] = drafts.map((draft) => ({
    id: draft.key,
    draft,
    position: draft.isRemoved ? null : ++activePosition,
  }))
  const firstActiveKey = activeDrafts[0]?.key
  const lastActiveKey = activeDrafts[activeDrafts.length - 1]?.key

  const columns: DataGridColumn<DraftRow>[] = [
    {
      header: 'Preview',
      className: 'collection-image-column',
      render: ({ draft }) => (
        <span className="collection-asset-preview">
          {draft.asset.type === 'Image' && isPreviewableImage(draft.asset.url)
            ? <img alt="" loading="lazy" src={getPreviewUrl(draft.asset.url)} />
            : <InsertDriveFileOutlinedIcon aria-hidden="true" />}
        </span>
      ),
    },
    {
      header: 'Main info',
      className: 'collection-info-column',
      render: ({ draft, position }) => (
        <div className={`collection-main-info${draft.isRemoved ? ' collection-row-removed' : ''}`}>
          <div className="collection-main-line">
            <span className="collection-position">{position ?? '–'}</span>
            <span className="collection-asset-type">
              <ImageOutlinedIcon aria-hidden="true" /> {draft.asset.type}
            </span>
            <span className="collection-asset-name">{getAssetName(draft.asset)}</span>
          </div>
          <Chip
            className="collection-slug"
            icon={<FolderIcon />}
            label={draft.asset.url}
            size="small"
          />
          {draft.asset.sizeBytes != null && (
            <div className="collection-client">{formatFileSize(draft.asset.sizeBytes)}</div>
          )}
          {draft.asset.dimensions && (
            <div className="collection-type">
              {draft.asset.dimensions.width} x {draft.asset.dimensions.height}
            </div>
          )}
          {draft.asset.uploadedAt && (
            <div className="collection-date">
              {uploadDateFormatter.format(new Date(draft.asset.uploadedAt))}
            </div>
          )}
          {draft.error && <p className="collection-form-error" role="alert">{draft.error}</p>}
        </div>
      ),
    },
    {
      header: 'Asset Role',
      className: 'collection-role-column',
      render: ({ draft }) => (
        <RoleCombobox
          disabled={draft.isRemoved}
          id={`collection-asset-role-${draft.key}`}
          label={`Role of ${getAssetName(draft.asset)}`}
          onChange={(role) => changeDraft(draft.key, { role })}
          options={roles}
          value={draft.role}
        />
      ),
    },
    {
      header: 'Actions',
      className: 'collection-actions-column',
      render: ({ draft, position }) => (
        <span className="data-grid-actions collection-actions">
          <Tooltip key={`up-${draft.key}-${position ?? 'removed'}`} title="Move up">
            <span>
              <IconButton
                aria-label={`Move ${getAssetName(draft.asset)} up`}
                disabled={draft.isRemoved || draft.key === firstActiveKey}
                onClick={() => moveDraft(draft.key, -1)}
              >
                <ArrowUpwardIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip key={`down-${draft.key}-${position ?? 'removed'}`} title="Move down">
            <span>
              <IconButton
                aria-label={`Move ${getAssetName(draft.asset)} down`}
                disabled={draft.isRemoved || draft.key === lastActiveKey}
                onClick={() => moveDraft(draft.key, 1)}
              >
                <ArrowDownwardIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={draft.isRemoved ? 'Keep in the collection' : 'Remove from the collection'}>
            <IconButton
              aria-label={`${draft.isRemoved ? 'Keep' : 'Remove'} ${getAssetName(draft.asset)}`}
              onClick={() => (draft.isRemoved
                ? changeDraft(draft.key, { isRemoved: false })
                : removeDraft(draft.key))}
            >
              {draft.isRemoved
                ? <UndoIcon aria-hidden="true" />
                : <DeleteIcon aria-hidden="true" />}
            </IconButton>
          </Tooltip>
        </span>
      ),
    },
  ]

  return (
    <section
      aria-label={`Edit ${collection.name}`}
      className="collection-editor"
    >
      <header className="collection-editor-header">
        <div className="collection-editor-name">
          <TextField
            fullWidth
            label="Name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>
        <CollectionTypeField
          className="collection-editor-type"
          onChange={setType}
          options={typeOptions}
          value={type}
        />
        <Autocomplete
          className="collection-editor-publication"
          getOptionLabel={(option) => option.meta.title}
          isOptionEqualToValue={(option, selected) => option.id === selected.id}
          onChange={(_event, selected) => setPublication(selected)}
          options={publications}
          renderInput={(params) => <TextField {...params} label="Publication" required />}
          value={publication}
        />
        <div className="collection-form-actions">
          <Button
            disabled={isSaving || isRefreshing || isStale}
            onClick={() => void handleSave()}
            startIcon={<CheckIcon />}
            variant="contained"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            disabled={isSaving}
            onClick={onClose}
            startIcon={<CloseIcon />}
            variant="outlined"
          >
            Cancel
          </Button>
        </div>
      </header>

      {error && <Alert className="collection-editor-alert" severity="error">{error}</Alert>}

      <div className="collection-editor-toolbar">
        <Button
          disabled={isStale}
          onClick={() => setIsPickerOpen((isOpen) => !isOpen)}
          startIcon={<AddIcon />}
          variant="outlined"
        >
          Add assets
        </Button>
      </div>

      {isPickerOpen && (
        <CollectionAssetPicker
          assets={availableAssets}
          hasGalleryAssets={inventory.length > 0}
          onAdd={addAssets}
          onClose={() => setIsPickerOpen(false)}
          roles={roles}
        />
      )}

      {drafts.length === 0 ? (
        <p className="collection-editor-empty">This collection has no assets yet.</p>
      ) : (
        <div className="collection-list">
          <DataGrid columns={columns} rows={rows} />
        </div>
      )}
    </section>
  )
}

export default CollectionEditor
