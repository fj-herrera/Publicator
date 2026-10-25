import { IconButton, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { Tag } from '../../entities/tag'
import DataGrid, { type DataGridColumn } from '../../components/DataGrid'
import ObjectChips from '../../components/ObjectChips'

type TagListProps = {
  tags: Tag[]
  selectedTagId: number | null
  onTagSelect: (id: number | null) => void
  onEdit: (tag: Tag) => void
  onDelete: (tag: Tag) => void
}

function TagList({ tags, selectedTagId, onTagSelect, onEdit, onDelete }: TagListProps) {
  const visibleTags = selectedTagId === null
    ? tags
    : tags.filter((tag) => tag.id === selectedTagId)

  const columns: DataGridColumn<Tag>[] = [
    { field: 'name', header: 'Name', className: 'data-grid-name-column' },
    {
      field: 'inPublications',
      header: 'In publications',
      className: 'data-grid-publications-column',
    },
    {
      header: 'Actions',
      className: 'data-grid-actions-column',
      render: (tag) => (
        <span
          className="data-grid-actions"
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Tooltip title={`Edit ${tag.name}`}>
            <IconButton
              aria-label={`Edit ${tag.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(tag)
              }}
            >
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={tag.inPublications > 0
              ? 'This item cannot be deleted while it is used in publications. Remove it from all publications first.'
              : `Delete ${tag.name}`}
          >
            <span tabIndex={tag.inPublications > 0 ? 0 : undefined}>
              <IconButton
                aria-label={`Delete ${tag.name}`}
                disabled={tag.inPublications > 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(tag)
                }}
              >
                <DeleteIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
        </span>
      ),
    },
  ]

  const handleTagSelect = (id: number) => {
    onTagSelect(selectedTagId === id ? null : id)
  }

  return (
    <>
      <ObjectChips
        items={tags.map(({ id, name }) => ({ id, label: name }))}
        variant="outlined"
        iconMode="none"
        selectedId={selectedTagId}
        onSelect={(id) => handleTagSelect(Number(id))}
      />
      <DataGrid<Tag>
        key={selectedTagId ?? 'all-tags'}
        columns={columns}
        rows={visibleTags}
        selectedRowId={selectedTagId}
        onRowClick={(tag) => handleTagSelect(tag.id)}
      />
    </>
  )
}

export default TagList