import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import type { Asset } from '../../entities/asset'
import { getAssetName, getFileFormat, getPreviewUrl, isPreviewableImage } from './asset-utils'

type AssetGridProps = {
  assets: Asset[]
  isSelectingAssets: boolean
  selectedAssetIds: Set<number>
  failedPreviews: Set<number>
  actionAssetId: number | null
  getAssetAssociationCount: (asset: Asset) => number
  hasAssetAssociations: (asset: Asset) => boolean
  onAssetSelectionChange: (asset: Asset, selected: boolean) => void
  onPreviewError: (asset: Asset) => void
  onShowActions: (asset: Asset) => void
  onCloseActions: () => void
  onEdit: (asset: Asset) => void
  onView: (asset: Asset) => void
  onRemove: (asset: Asset) => void
}

function AssetGrid({
  assets,
  isSelectingAssets,
  selectedAssetIds,
  failedPreviews,
  actionAssetId,
  getAssetAssociationCount,
  hasAssetAssociations,
  onAssetSelectionChange,
  onPreviewError,
  onShowActions,
  onCloseActions,
  onEdit,
  onView,
  onRemove,
}: AssetGridProps) {
  return (
    <section className="asset-grid" aria-label="Assets">
      {assets.map((asset) => {
        const associationCount = getAssetAssociationCount(asset)
        const isImage = isPreviewableImage(asset.url)

        return (
          <article className="asset-card" key={asset.id}>
            {isSelectingAssets && (
              <input
                aria-label={`Select ${getAssetName(asset)}`}
                checked={selectedAssetIds.has(asset.id)}
                className="asset-card-select"
                disabled={hasAssetAssociations(asset)}
                onChange={(event) => onAssetSelectionChange(asset, event.target.checked)}
                title={hasAssetAssociations(asset)
                  ? 'Remove associations before deleting this asset.'
                  : undefined}
                type="checkbox"
              />
            )}
            <button
              aria-label={`Show actions for ${getAssetName(asset)}`}
              className="asset-card-open"
              onClick={() => onShowActions(asset)}
              type="button"
            >
              <span className="asset-preview">
                {isImage && !failedPreviews.has(asset.id) ? (
                  <img
                    alt=""
                    loading="lazy"
                    onError={() => onPreviewError(asset)}
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
                  {associationCount > 0
                    ? `${associationCount} ${associationCount === 1 ? 'association' : 'associations'}`
                    : 'No associations'}
                </span>
              </span>
            </button>
            <button
              aria-label={`Show actions for ${getAssetName(asset)}`}
              className="asset-card-menu-trigger"
              onClick={() => onShowActions(asset)}
              type="button"
            >
              <MoreVertIcon aria-hidden="true" />
            </button>
            {actionAssetId === asset.id && (
              <div className="asset-action-overlay">
                <div aria-label={`Actions for ${getAssetName(asset)}`} className="asset-action-menu" role="menu">
                  <button
                    onClick={() => onEdit(asset)}
                    role="menuitem"
                    type="button"
                  >
                    <EditOutlinedIcon aria-hidden="true" /> Edit
                  </button>
                  <button
                    onClick={() => onView(asset)}
                    role="menuitem"
                    type="button"
                  >
                    <VisibilityOutlinedIcon aria-hidden="true" /> View
                  </button>
                  <button
                    disabled={hasAssetAssociations(asset)}
                    onClick={() => onRemove(asset)}
                    role="menuitem"
                    title={hasAssetAssociations(asset)
                      ? 'Remove associations before deleting this asset.'
                      : undefined}
                    type="button"
                  >
                    <DeleteIcon aria-hidden="true" /> Remove
                  </button>
                  <button
                    onClick={onCloseActions}
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
  )
}

export default AssetGrid
