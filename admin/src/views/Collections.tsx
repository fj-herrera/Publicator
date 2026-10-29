import { useMemo, useState } from 'react'
import { Alert, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CollectionsIcon from '@mui/icons-material/Collections'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import CollectionDeleteDialog from '../components/collections/CollectionDeleteDialog'
import CollectionEditor from '../components/collections/CollectionEditor'
import CollectionFilters from '../components/collections/CollectionFilters'
import {
  emptyCollectionFilters,
  type CollectionFilterValues,
  type FilterOption,
} from '../components/collections/collection-filter-types'
import CollectionForm from '../components/collections/CollectionForm'
import CollectionList from '../components/collections/CollectionList'
import { downloadCsv } from '../components/data-display/download-csv'
import { apiMessages } from '../constants/api-messages'
import type { CollectionAsset, CollectionRow } from '../entities/collection'
import useCollectionsData from '../hooks/useCollectionsData'
import { getErrorMessage } from '../services/api-error'
import {
  createCollectionRequest,
  deleteCollectionRequest,
  reorderCollectionsRequest,
} from '../services/collections.service'

type CollectionsProps = {
  isCreateFormOpen: boolean
  onCreateFormOpen: () => void
  onCreateFormClose: () => void
}

function uniqueOptions(options: FilterOption[]) {
  return Array.from(new Map(options.map((option) => [option.id, option])).values())
    .sort((a, b) => a.label.localeCompare(b.label))
}

function Collections({ isCreateFormOpen, onCreateFormOpen, onCreateFormClose }: CollectionsProps) {
  const { data, isLoading, error, reload } = useCollectionsData()
  const [filters, setFilters] = useState<CollectionFilterValues>(emptyCollectionFilters)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CollectionRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isMoving, setIsMoving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const rows = useMemo<CollectionRow[]>(() => {
    if (!data) {
      return []
    }

    const contextsByPublication = new Map<number, { id: number; name: string }[]>()
    data.contexts.forEach((link) => {
      const current = contextsByPublication.get(link.publication.id) ?? []
      contextsByPublication.set(link.publication.id, [...current, link.context])
    })

    const assetsByCollection = new Map<number, CollectionAsset[]>()
    data.collectionAssets.forEach((item) => {
      const current = assetsByCollection.get(item.collection.id) ?? []
      assetsByCollection.set(item.collection.id, [...current, item])
    })

    const sorted = [...data.collections].sort((a, b) => (
      a.publication.id - b.publication.id || a.position - b.position
    ))
    const positionsByPublication = new Map<number, number[]>()
    sorted.forEach((collection) => {
      const current = positionsByPublication.get(collection.publication.id) ?? []
      positionsByPublication.set(collection.publication.id, [...current, collection.position])
    })

    return sorted.map((collection) => {
      const positions = positionsByPublication.get(collection.publication.id) ?? []

      return {
        ...collection,
        contexts: contextsByPublication.get(collection.publication.id) ?? [],
        assets: [...(assetsByCollection.get(collection.id) ?? [])]
          .sort((a, b) => a.position - b.position),
        isFirst: collection.position === positions[0],
        isLast: collection.position === positions[positions.length - 1],
      }
    })
  }, [data])

  const filterOptions = useMemo(() => ({
    publications: uniqueOptions(rows.map((row) => ({
      id: String(row.publication.id),
      label: row.publication.meta.title,
    }))),
    contexts: uniqueOptions((data?.contexts ?? []).map((link) => ({
      id: String(link.context.id),
      label: link.context.name,
    }))),
    types: uniqueOptions(rows.map((row) => ({ id: row.type, label: row.type }))),
    clients: uniqueOptions(rows.flatMap((row) => (
      row.publication.meta.client
        ? [{ id: String(row.publication.meta.client.id), label: row.publication.meta.client.name }]
        : []
    ))),
  }), [data, rows])

  const visibleRows = rows.filter((row) => {
    const client = row.publication.meta.client

    return (filters.publications.length === 0 || filters.publications.includes(String(row.publication.id)))
      && (filters.contexts.length === 0 || row.contexts.some((context) => filters.contexts.includes(String(context.id))))
      && (filters.types.length === 0 || filters.types.includes(row.type))
      && (filters.clients.length === 0 || (client !== null && filters.clients.includes(String(client.id))))
  })
  const roles = useMemo(
    () => Array.from(new Set((data?.collectionAssets ?? []).map((item) => item.role))).sort(),
    [data],
  )
  const typeOptions = filterOptions.types.map((option) => option.label)
  const editingRow = rows.find((row) => row.id === editingId) ?? null
  const showEditor = editingRow !== null && !isCreateFormOpen

  const handleCreate = async (publicationId: number, type: string) => {
    await createCollectionRequest(publicationId, type)
    setSuccessMessage(apiMessages.catalog.created('Collection'))
    onCreateFormClose()
    reload()
  }

  const handleMove = async (row: CollectionRow, direction: -1 | 1) => {
    const siblings = rows.filter((item) => item.publication.id === row.publication.id)
    const index = siblings.findIndex((item) => item.id === row.id)
    const target = index + direction

    if (isMoving || target < 0 || target >= siblings.length) {
      return
    }

    const ids = siblings.map((item) => item.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setIsMoving(true)
    setActionError('')

    try {
      await reorderCollectionsRequest(row.publication.id, ids)
      reload()
    } catch (moveError) {
      setActionError(getErrorMessage(moveError, apiMessages.collections.reorderFailed))
    } finally {
      setIsMoving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteCollectionRequest(pendingDelete.id)
      if (editingId === pendingDelete.id) {
        setEditingId(null)
      }
      setPendingDelete(null)
      setSuccessMessage(apiMessages.catalog.deleted('Collection'))
      reload()
    } catch (removeError) {
      setDeleteError(getErrorMessage(removeError, apiMessages.collections.deleteFailed))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    downloadCsv('publicator-collections.csv', [
      ['id', 'position', 'publication', 'slug', 'client', 'type', 'contexts', 'assets'],
      ...visibleRows.map((row) => [
        String(row.id),
        String(row.position),
        row.publication.meta.title,
        row.publication.meta.slug,
        row.publication.meta.client?.name ?? '',
        row.type,
        row.contexts.map((context) => context.name).join('; '),
        String(row.assets.length),
      ]),
    ])
  }

  return (
    <section className="collections-view">
      {error && <Alert severity="error">{error}</Alert>}
      {actionError && <Alert onClose={() => setActionError('')} severity="error">{actionError}</Alert>}
      {successMessage && (
        <Alert onClose={() => setSuccessMessage('')} severity="success">{successMessage}</Alert>
      )}

      {isCreateFormOpen && data && (
        <CollectionForm
          onCancel={onCreateFormClose}
          onSubmit={handleCreate}
          publications={data.publications}
          typeOptions={typeOptions}
        />
      )}

      {showEditor && data && (
        <CollectionEditor
          collection={editingRow}
          inventory={data.assets}
          key={editingRow.id}
          onChanged={reload}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null)
            setSuccessMessage('Collection updated successfully.')
            reload()
          }}
          roles={roles}
          typeOptions={typeOptions}
        />
      )}

      {isLoading && <p className="collections-message" role="status">Loading collections...</p>}

      {!isLoading && !error && data && (
        rows.length === 0 ? (
          <div className="collections-message collections-empty" role="status">
            <CollectionsIcon aria-hidden="true" />
            <h2>No collections yet</h2>
            <p>Create the first collection of a publication.</p>
            {!isCreateFormOpen && (
              <Button onClick={onCreateFormOpen} startIcon={<AddIcon />} variant="contained">
                Create collection
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="collections-toolbar">
              <button
                aria-label="Download filtered collections as CSV"
                className="collection-icon-button"
                disabled={visibleRows.length === 0}
                onClick={handleDownload}
                title="Download filtered collections as CSV"
                type="button"
              >
                <DownloadIcon aria-hidden="true" />
              </button>
              <button
                aria-expanded={isFilterOpen}
                aria-label="Show filters"
                className="collection-icon-button"
                onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
                title="Filter collections"
                type="button"
              >
                <SearchIcon aria-hidden="true" />
              </button>
            </div>
            {isFilterOpen && (
              <CollectionFilters
                clients={filterOptions.clients}
                contexts={filterOptions.contexts}
                onChange={setFilters}
                publications={filterOptions.publications}
                types={filterOptions.types}
                values={filters}
              />
            )}
            {visibleRows.length === 0 ? (
              <div className="collections-message collections-empty" role="status">
                <SearchIcon aria-hidden="true" />
                <h2>No collections found</h2>
                <p>Try different filters.</p>
              </div>
            ) : (
              <CollectionList
                onDelete={(row) => {
                  setDeleteError('')
                  setPendingDelete(row)
                }}
                onEdit={(row) => {
                  onCreateFormClose()
                  setEditingId(row.id)
                }}
                onMove={(row, direction) => void handleMove(row, direction)}
                rows={visibleRows}
              />
            )}
          </>
        )
      )}

      <CollectionDeleteDialog
        error={deleteError}
        isDeleting={isDeleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        open={pendingDelete !== null}
        position={pendingDelete?.position ?? 0}
        publicationTitle={pendingDelete?.publication.meta.title ?? ''}
      />
    </section>
  )
}

export default Collections
