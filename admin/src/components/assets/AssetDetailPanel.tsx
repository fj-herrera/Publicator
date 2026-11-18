import type { FormEvent } from 'react'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CloseIcon from '@mui/icons-material/Close'
import EventIcon from '@mui/icons-material/Event'
import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined'
import type {
  Asset,
  AssetCollectionRelation,
  PublicationAssetRelation,
  PublicationAssetTarget,
} from '../../entities/asset'
import type { AssetTextDraft } from '../../entities/asset-text'
import type { PublicationRelationDraft } from './PublicationRelationDrafts'
import { formatFileSize, getAssetName, getPreviewUrl, isPreviewableImage } from './asset-utils'
import AssetTextsEditor from './AssetTextsEditor'
import PublicationRelationDrafts from './PublicationRelationDrafts'
import RoleCombobox from './RoleCombobox'

type AssetDetailPanelProps = {
  asset: Asset
  publicationRelations: PublicationAssetRelation[]
  collectionRelations: AssetCollectionRelation[]
  publications: PublicationAssetTarget[]
  publicationRoles: string[]
  assetTextRoles: string[]
  assetTextDrafts: AssetTextDraft[]
  newPublicationRelations: PublicationRelationDraft[]
  editedAssetName: string
  editedPublicationRoles: Record<number, string>
  isEditing: boolean
  isSaving: boolean
  isRefreshing: boolean
  error: string
  isPreviewFailed: boolean
  getRelationLabel: (relation: PublicationAssetRelation | AssetCollectionRelation) => string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onPreviewError: () => void
  onAssetNameChange: (name: string) => void
  onPublicationRoleChange: (relationId: number, role: string) => void
  onAddPublicationRelation: () => void
  onChangePublicationRelation: (
    key: number,
    changes: Partial<Omit<PublicationRelationDraft, 'key'>>,
  ) => void
  onRemovePublicationRelation: (key: number) => void
  onAddAssetText: () => void
  onChangeAssetText: (
    key: number,
    changes: Partial<Pick<AssetTextDraft, 'role' | 'text'>>,
  ) => void
  onRemoveAssetText: (key: number) => void
  onRestoreAssetText: (key: number) => void
  onCancelEdit: () => void
}

function formatUploadDate(value: string | null | undefined, style: 'date' | 'time') {
  const date = value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('es-ES', style === 'date'
    ? { dateStyle: 'short' }
    : { timeStyle: 'short' }).format(date)
}

function AssetDetailPanel({
  asset,
  publicationRelations,
  collectionRelations,
  publications,
  publicationRoles,
  assetTextRoles,
  assetTextDrafts,
  newPublicationRelations,
  editedAssetName,
  editedPublicationRoles,
  isEditing,
  isSaving,
  isRefreshing,
  error,
  isPreviewFailed,
  getRelationLabel,
  onClose,
  onSubmit,
  onPreviewError,
  onAssetNameChange,
  onPublicationRoleChange,
  onAddPublicationRelation,
  onChangePublicationRelation,
  onRemovePublicationRelation,
  onAddAssetText,
  onChangeAssetText,
  onRemoveAssetText,
  onRestoreAssetText,
  onCancelEdit,
}: AssetDetailPanelProps) {
  return (
    <section aria-labelledby="asset-detail-title" className="asset-detail-panel">
      <header className="asset-detail-header">
        <div>
          <p>Asset details</p>
          <h2 id="asset-detail-title">{getAssetName(asset)}</h2>
        </div>
        <button
          aria-label="Close asset details"
          className="gallery-icon-button"
          onClick={onClose}
          type="button"
        >
          <CloseIcon aria-hidden="true" />
        </button>
      </header>
      <form className="asset-detail-form" onSubmit={onSubmit}>
        <div className="asset-detail-content">
          <div className="asset-detail-preview">
            {isPreviewableImage(asset.url) && !isPreviewFailed ? (
              <img
                alt={getAssetName(asset)}
                onError={onPreviewError}
                src={getPreviewUrl(asset.url)}
              />
            ) : <InsertDriveFileOutlinedIcon aria-hidden="true" />}
          </div>
          <div className="asset-detail-info">
            <div className="asset-detail-name">
              <label htmlFor="asset-detail-file-name">File name</label>
              {isEditing ? (
                <input
                  autoComplete="off"
                  id="asset-detail-file-name"
                  maxLength={255}
                  onChange={(event) => onAssetNameChange(event.target.value)}
                  required
                  value={editedAssetName}
                />
              ) : <span id="asset-detail-file-name">{getAssetName(asset)}</span>}
            </div>
            <a
              className="asset-detail-link"
              href={getPreviewUrl(asset.url)}
              rel="noreferrer"
              target="_blank"
            >
              <FolderIcon aria-hidden="true" />
              <span>{asset.url}</span>
            </a>
            <ul className="asset-detail-meta">
              <li title="Dimensions">
                <ViewInArOutlinedIcon aria-hidden="true" />
                {asset.dimensions
                  ? `${asset.dimensions.width} x ${asset.dimensions.height}`
                  : 'Not available'}
              </li>
              <li title="File size">
                <ShoppingBagIcon aria-hidden="true" />
                {asset.sizeBytes !== undefined && asset.sizeBytes !== null
                  ? formatFileSize(asset.sizeBytes)
                  : 'Not available'}
              </li>
              <li title="Date">
                <EventIcon aria-hidden="true" />
                {formatUploadDate(asset.uploadedAt, 'date')}
              </li>
              <li title="Time">
                <AccessTimeIcon aria-hidden="true" />
                {formatUploadDate(asset.uploadedAt, 'time')}
              </li>
            </ul>
          </div>
          <section className="asset-detail-relations">
            <h3>Publication relations</h3>
            {publicationRelations.length ? (
              <ul>
                {publicationRelations.map((relation) => (
                  <li key={relation.id}>
                    <span>{getRelationLabel(relation)}</span>
                    {isEditing ? (
                      <RoleCombobox
                        id={`asset-role-${relation.id}`}
                        label={`Role for ${getRelationLabel(relation)}`}
                        onChange={(value) => onPublicationRoleChange(relation.id, value)}
                        options={publicationRoles}
                        value={editedPublicationRoles[relation.id] ?? relation.role}
                      />
                    ) : <span>{relation.role}</span>}
                  </li>
                ))}
              </ul>
            ) : <p>No publication associations.</p>}
            {isEditing && (
              <PublicationRelationDrafts
                drafts={newPublicationRelations}
                onAdd={onAddPublicationRelation}
                onChange={onChangePublicationRelation}
                onRemove={onRemovePublicationRelation}
                publications={publications}
                roles={publicationRoles}
              />
            )}
            <h3>Collection relations</h3>
            {collectionRelations.length ? (
              <ul>
                {collectionRelations.map((relation) => (
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
            isEditing={isEditing}
            onAdd={onAddAssetText}
            onChange={onChangeAssetText}
            onRemove={onRemoveAssetText}
            onRestore={onRestoreAssetText}
            roles={assetTextRoles}
          />
        </div>
        {error && <p className="asset-detail-error" role="alert">{error}</p>}
        {isEditing && (
          <footer className="asset-detail-actions">
            <button className="asset-detail-cancel" onClick={onCancelEdit} type="button">Cancel</button>
            <button className="asset-detail-save" disabled={isSaving || isRefreshing} type="submit">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </footer>
        )}
      </form>
    </section>
  )
}

export default AssetDetailPanel
