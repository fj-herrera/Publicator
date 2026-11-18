import { useMemo, useState, type ReactNode } from 'react'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SearchIcon from '@mui/icons-material/Search'
import AssetControls from '../components/assets/AssetControls'
import AssetDetailPanel from '../components/assets/AssetDetailPanel'
import AssetDeleteDialog from '../components/assets/AssetDeleteDialog'
import AssetGrid from '../components/assets/AssetGrid'
import EmptyState from '../components/data-display/EmptyState'
import AssetUploadForm from '../components/assets/AssetUploadForm'
import {
  getAssetAssociationCount as countAssetRelations,
  getAssetName,
  hasAssetAssociations as assetHasAssociations,
} from '../components/assets/asset-utils'
import type {
  Asset,
  AssetCollectionRelation,
  PublicationAssetRelation,
} from '../entities/asset'
import { getErrorMessage } from '../services/api-error'
import useGalleryData from '../hooks/useGalleryData'
import useGalleryAssetSelection from '../hooks/useGalleryAssetSelection'
import useGalleryAssetFilters from '../hooks/useGalleryAssetFilters'
import useGalleryAssetTextDrafts from '../hooks/useGalleryAssetTextDrafts'
import useGalleryPublicationRelationDrafts from '../hooks/useGalleryPublicationRelationDrafts'
import { getAssetEditValidationError } from '../components/assets/gallery-asset-validation'
import { saveGalleryAssetEdit } from '../services/gallery-asset-save.service'

type GalleryAssetsProps = {
  active: boolean
  onTabChange: (value: string) => void
  renderTabs: (onChange: (value: string) => void, onCreate: () => void) => ReactNode
}

function getRelationLabel(relation: PublicationAssetRelation | AssetCollectionRelation) {
  if ('publication' in relation) {
    return relation.publication.meta
      ? `${relation.publication.meta.title} / ${relation.publication.meta.slug}`
      : `Publication #${relation.publication.id}`
  }

  return relation.collection.name
    ? `${relation.collection.name} (${relation.collection.type ?? 'Collection'}, #${relation.collection.id})`
    : `Collection #${relation.collection.id}`
}

function GalleryAssets({ active, onTabChange, renderTabs }: GalleryAssetsProps) {
  const {
    assets,
    publications,
    relations,
    assetTexts,
    isLoading,
    isRefreshing,
    error,
    retry,
  } = useGalleryData()
  const { query, setQuery, selectedType, setSelectedType, assetTypes, visibleAssets } =
    useGalleryAssetFilters({ assets, relations, getRelationLabel })
  const [selectedAssetSnapshot, setSelectedAsset] = useState<Asset | null>(null)
  // The open asset follows the shared data, so edits made elsewhere show up.
  const selectedAsset = useMemo(
    () => (selectedAssetSnapshot
      ? assets.find((asset) => asset.id === selectedAssetSnapshot.id) ?? null
      : null),
    [assets, selectedAssetSnapshot],
  )
  const [isEditingAsset, setIsEditingAsset] = useState(false)
  const [editedAssetName, setEditedAssetName] = useState('')
  const {
    editedPublicationRoles,
    setEditedPublicationRoles,
    newPublicationRelations,
    setNewPublicationRelations,
    initializePublicationRelationDrafts,
    clearPublicationRelationDrafts,
    addPublicationRelationDraft,
    changePublicationRelationDraft,
    removePublicationRelationDraft,
    changePublicationRole,
  } = useGalleryPublicationRelationDrafts()
  const [isSavingAsset, setIsSavingAsset] = useState(false)
  const [assetEditError, setAssetEditError] = useState('')
  const {
    assetTextDrafts,
    initializeAssetTextDrafts,
    clearAssetTextDrafts,
    addAssetTextDraft,
    changeAssetTextDraft,
    removeAssetTextDraft,
    restoreAssetTextDraft,
    reconcileAssetTextDrafts,
  } = useGalleryAssetTextDrafts({ assetTexts, isRefreshing, error, onReconcileError: setAssetEditError })
  const [actionAsset, setActionAsset] = useState<Asset | null>(null)
  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false)
  const [failedPreviews, setFailedPreviews] = useState<Set<number>>(() => new Set())

  const publicationRoles = Array.from(new Set(
    Object.values(relations).flatMap(({ publications: items }) => items.map(({ role }) => role)),
  )).sort()
  const collectionRoles = Array.from(new Set(
    Object.values(relations).flatMap(({ collections: items }) => items.map(({ role }) => role)),
  )).sort()
  const assetTextRoles = Array.from(new Set(
    Object.values(assetTexts).flatMap((items) => items.map(({ type }) => type)),
  )).sort()
  const getAssetRelations = (asset: Asset) => (
    relations[asset.id] ?? { publications: [], collections: [] }
  )
  const getAssetAssociationCount = (asset: Asset) => (
    countAssetRelations(getAssetRelations(asset))
  )
  const hasAssetAssociations = (asset: Asset) => (
    assetHasAssociations(getAssetRelations(asset), assetTexts[asset.id] ?? [])
  )
  const openAssetDetails = (asset: Asset, editMode = false) => {
    setSelectedAsset(asset)
    setActionAsset(null)
    setIsEditingAsset(editMode)
    setEditedAssetName(getAssetName(asset))
    initializePublicationRelationDrafts(relations[asset.id]?.publications ?? [])
    initializeAssetTextDrafts(asset.id)
    setAssetEditError('')
  }

  const cancelAssetEdit = () => {
    setSelectedAsset(null)
    setIsEditingAsset(false)
    clearPublicationRelationDrafts()
    clearAssetTextDrafts()
    setAssetEditError('')
  }

  const {
    allVisibleDeletableAssetsSelected,
    cancelAssetSelection,
    closeDeleteAssetDialog,
    confirmDeleteAssets,
    deleteAssetError,
    deletableVisibleAssets,
    isDeletingAsset,
    isSelectingAssets,
    pendingDeleteAssets,
    requestDeleteAssets,
    requestDeleteSelectedAssets,
    selectedAssetIds,
    selectedDeletableAssets,
    setAssetSelected,
    setIsSelectingAssets,
    toggleVisibleAssetSelection,
  } = useGalleryAssetSelection({
    assets,
    visibleAssets,
    hasAssetAssociations,
    selectedAssetId: selectedAsset?.id ?? null,
    onSelectedAssetDeleted: cancelAssetEdit,
  })

  const saveAssetEdit = async () => {
    if (!selectedAsset) {
      return
    }

    const publicationRelations = relations[selectedAsset.id]?.publications ?? []
    const validationError = getAssetEditValidationError({
      assetName: editedAssetName,
      publicationRoles: publicationRelations.map((relation) => ({
        id: relation.id,
        publicationId: relation.publication.id,
        role: relation.role,
      })),
      editedPublicationRoles,
      newPublicationRelations,
      assetTextDrafts,
    })
    if (validationError) {
      setAssetEditError(validationError)
      return
    }

    setIsSavingAsset(true)
    setAssetEditError('')

    try {
      const result = await saveGalleryAssetEdit({
        assetId: selectedAsset.id,
        originalName: selectedAsset.name,
        assetName: editedAssetName,
        publicationRoles: publicationRelations.map((relation) => ({
          id: relation.id,
          role: relation.role,
        })),
        editedPublicationRoles,
        newPublicationRelations,
        assetTextDrafts,
        currentAssetTexts: assetTexts[selectedAsset.id] ?? [],
      })

      if (!result.hasSaveFailures) {
        setIsEditingAsset(false)
        setSelectedAsset(null)
        clearPublicationRelationDrafts()
        clearAssetTextDrafts()
        return
      }

      setEditedAssetName(result.trimmedName)
      setEditedPublicationRoles((currentRoles) => ({ ...currentRoles, ...result.savedRoles }))
      setNewPublicationRelations((currentDrafts) => currentDrafts.filter(
        (draft) => result.failedDraftKeys.has(draft.key),
      ))
      // The reloaded texts give the saved drafts their ids; the failed ones stay as drafts.
      reconcileAssetTextDrafts(selectedAsset.id, result.textResult.failures)
      setAssetEditError('Some changes were saved. Review the remaining fields and save again.')
    } catch (saveError) {
      setAssetEditError(getErrorMessage(saveError, 'Could not save asset changes. You can retry.'))
    } finally {
      setIsSavingAsset(false)
    }
  }

  return (
    <>
      {active && !selectedAsset && (
      <header className="gallery-header">
        {renderTabs(
          (value) => {
            setIsCreateAssetOpen(false)
            onTabChange(value)
          },
          () => {
            setSelectedAsset(null)
            setIsCreateAssetOpen((isOpen) => !isOpen)
          },
        )}
        {isCreateAssetOpen && (
          <AssetUploadForm
            collectionRoles={collectionRoles}
            onCancel={() => setIsCreateAssetOpen(false)}
            publicationRoles={publicationRoles}
          />
        )}
        {assets.length > 0 && (
          <AssetControls
            allVisibleDeletableAssetsSelected={allVisibleDeletableAssetsSelected}
            assetTypes={assetTypes}
            isDeletingAsset={isDeletingAsset}
            isSelectingAssets={isSelectingAssets}
            onCancelSelection={cancelAssetSelection}
            onDeleteSelected={requestDeleteSelectedAssets}
            onQueryChange={setQuery}
            onStartSelection={() => setIsSelectingAssets(true)}
            onToggleVisibleSelection={toggleVisibleAssetSelection}
            onTypeChange={setSelectedType}
            query={query}
            selectedDeletableCount={selectedDeletableAssets.length}
            selectedType={selectedType}
            visibleDeletableCount={deletableVisibleAssets.length}
          />
        )}
      </header>
      )}

      {active && selectedAsset && (
        <AssetDetailPanel
          asset={selectedAsset}
          assetTextDrafts={assetTextDrafts}
          assetTextRoles={assetTextRoles}
          collectionRelations={relations[selectedAsset.id]?.collections ?? []}
          editedAssetName={editedAssetName}
          editedPublicationRoles={editedPublicationRoles}
          error={assetEditError}
          getRelationLabel={getRelationLabel}
          isEditing={isEditingAsset}
          isPreviewFailed={failedPreviews.has(selectedAsset.id)}
          isRefreshing={isRefreshing}
          isSaving={isSavingAsset}
          newPublicationRelations={newPublicationRelations}
          onAddAssetText={addAssetTextDraft}
          onAddPublicationRelation={addPublicationRelationDraft}
          onAssetNameChange={setEditedAssetName}
          onCancelEdit={cancelAssetEdit}
          onChangeAssetText={changeAssetTextDraft}
          onChangePublicationRelation={changePublicationRelationDraft}
          onClose={cancelAssetEdit}
          onPreviewError={() => setFailedPreviews((current) => new Set(current).add(selectedAsset.id))}
          onPublicationRoleChange={changePublicationRole}
          onRemoveAssetText={removeAssetTextDraft}
          onRemovePublicationRelation={removePublicationRelationDraft}
          onRestoreAssetText={restoreAssetTextDraft}
          onSubmit={(event) => {
            event.preventDefault()
            void saveAssetEdit()
          }}
          publicationRelations={relations[selectedAsset.id]?.publications ?? []}
          publicationRoles={publicationRoles}
          publications={publications}
        />
      )}

      {active && error && (
        <div className="gallery-message gallery-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setFailedPreviews(new Set()); retry() }}>Retry</button>
        </div>
      )}

      {!active ? null : isLoading ? (
        <div className="gallery-message" role="status">Loading assets...</div>
      ) : !error && assets.length === 0 ? (
        <EmptyState
          icon={<ImageOutlinedIcon />}
          title="No assets yet"
          description="Uploaded assets will appear here."
        />
      ) : !error && visibleAssets.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No assets found"
          description="Try a different search or type filter."
        />
      ) : !error && (
        <AssetGrid
          actionAssetId={actionAsset?.id ?? null}
          assets={visibleAssets}
          failedPreviews={failedPreviews}
          getAssetAssociationCount={getAssetAssociationCount}
          hasAssetAssociations={hasAssetAssociations}
          isSelectingAssets={isSelectingAssets}
          onAssetSelectionChange={setAssetSelected}
          onCloseActions={() => setActionAsset(null)}
          onEdit={(asset) => openAssetDetails(asset, true)}
          onPreviewError={(asset) => setFailedPreviews((current) => new Set(current).add(asset.id))}
          onRemove={(asset) => {
            requestDeleteAssets([asset])
            setActionAsset(null)
          }}
          onShowActions={setActionAsset}
          onView={openAssetDetails}
          selectedAssetIds={selectedAssetIds}
        />
      )}

      <AssetDeleteDialog
        assetNames={pendingDeleteAssets.map(getAssetName)}
        error={deleteAssetError}
        isDeleting={isDeletingAsset}
        onClose={closeDeleteAssetDialog}
        onConfirm={() => void confirmDeleteAssets()}
        open={pendingDeleteAssets.length > 0}
      />
    </>
  )
}

export default GalleryAssets