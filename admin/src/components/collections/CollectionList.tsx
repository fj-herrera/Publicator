import { Chip, IconButton, Tooltip } from '@mui/material'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PushPinIcon from '@mui/icons-material/PushPin'
import type { CollectionRow } from '../../entities/collection'
import { getPreviewUrl, isPreviewableImage } from '../assets/asset-utils'
import DataGrid, { type DataGridColumn } from '../data-display/DataGrid'
import CollectionThumbnail from './CollectionThumbnail'
import { formatCollectionDate } from './collection-format'
import './collections.css'

type CollectionListProps = {
  rows: CollectionRow[]
  onEdit: (row: CollectionRow) => void
  onDelete: (row: CollectionRow) => void
  onMove: (row: CollectionRow, direction: -1 | 1) => void
}

function getThumbnailUrls(row: CollectionRow) {
  return row.assets
    .filter(({ asset }) => asset.type === 'Image' && isPreviewableImage(asset.url))
    .slice(0, 4)
    .map(({ asset }) => getPreviewUrl(asset.url))
}

function CollectionList({ rows, onEdit, onDelete, onMove }: CollectionListProps) {
  const label = (row: CollectionRow) => `${row.type} ${row.position} of ${row.publication.meta.title}`

  const columns: DataGridColumn<CollectionRow>[] = [
    {
      header: 'Image',
      className: 'collection-image-column',
      render: (row) => <CollectionThumbnail urls={getThumbnailUrls(row)} />,
    },
    {
      header: 'Main info',
      className: 'collection-info-column',
      render: (row) => (
        <div className="collection-main-info">
          <div className="collection-main-line">
            <span className="collection-position" title="Position in the publication">
              {row.position}
            </span>
            {row.contexts.length > 0 && (
              <span className="collection-context">
                {row.contexts.map((context) => context.name).join(', ')}
              </span>
            )}
            <Chip
              className="collection-slug"
              icon={<OpenInNewIcon />}
              label={row.publication.meta.slug}
              size="small"
              variant="outlined"
            />
          </div>
          <div className="collection-publication">
            <PushPinIcon aria-hidden="true" />
            <span>{row.publication.meta.title}</span>
          </div>
          {row.publication.meta.client && (
            <div className="collection-client">{row.publication.meta.client.name}</div>
          )}
          <div className="collection-type">{row.type}</div>
          <div className="collection-date">{formatCollectionDate(row.publication.meta.date)}</div>
        </div>
      ),
    },
    {
      header: 'Assets',
      className: 'collection-assets-column',
      render: (row) => (
        <Chip
          className="collection-assets-count"
          icon={<ImageOutlinedIcon />}
          label={row.assets.length}
          size="small"
        />
      ),
    },
    {
      header: 'Actions',
      className: 'collection-actions-column',
      render: (row) => (
        <span className="data-grid-actions collection-actions">
          <Tooltip title="Move up">
            <span>
              <IconButton
                aria-label={`Move ${label(row)} up`}
                disabled={row.isFirst}
                onClick={() => onMove(row, -1)}
              >
                <ArrowUpwardIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down">
            <span>
              <IconButton
                aria-label={`Move ${label(row)} down`}
                disabled={row.isLast}
                onClick={() => onMove(row, 1)}
              >
                <ArrowDownwardIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton aria-label={`Edit ${label(row)}`} onClick={() => onEdit(row)}>
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton aria-label={`Delete ${label(row)}`} onClick={() => onDelete(row)}>
              <DeleteIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </span>
      ),
    },
  ]

  return (
    <div className="collection-list">
      <DataGrid columns={columns} rows={rows} />
    </div>
  )
}

export default CollectionList
