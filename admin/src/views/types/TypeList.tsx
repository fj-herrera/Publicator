import {
  IconButton,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { Type } from '../../entities/type'
import DataGrid, { type DataGridColumn } from '../../components/data-display/DataGrid'
import ObjectChips from '../../components/data-display/ObjectChips'

type TypeListProps = {
  types: Type[]
  selectedTypeId: number | null
  onTypeSelect: (id: number | null) => void
  onEdit: (type: Type) => void
  onDelete: (type: Type) => void
}

function TypeList({
  types,
  selectedTypeId,
  onTypeSelect,
  onEdit,
  onDelete,
}: TypeListProps) {
  const visibleTypes = selectedTypeId === null
    ? types
    : types.filter((type) => type.id === selectedTypeId)

  const columns: DataGridColumn<Type>[] = [
    { field: 'name', header: 'Name', className: 'data-grid-name-column' },
    {
      field: 'inPublications',
      header: 'In publications',
      className: 'data-grid-publications-column',
    },
    {
      header: 'Actions',
      className: 'data-grid-actions-column',
      render: (type) => (
        <span
          className="data-grid-actions"
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Tooltip title={`Edit ${type.name}`}>
            <IconButton
              aria-label={`Edit ${type.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(type)
              }}
            >
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={type.inPublications > 0
              ? 'This item cannot be deleted while it is used in publications. Remove it from all publications first.'
              : `Delete ${type.name}`}
          >
            <span tabIndex={type.inPublications > 0 ? 0 : undefined}>
              <IconButton
                aria-label={`Delete ${type.name}`}
                disabled={type.inPublications > 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(type)
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

  const handleTypeSelect = (id: number) => {
    onTypeSelect(selectedTypeId === id ? null : id)
  }

  return (
    <>
      <ObjectChips
        items={types.map(({ id, name }) => ({ id, label: name }))}
        selectedId={selectedTypeId}
        onSelect={(id) => handleTypeSelect(Number(id))}
      />
      <DataGrid<Type>
        key={selectedTypeId ?? 'all-types'}
        columns={columns}
        rows={visibleTypes}
        selectedRowId={selectedTypeId}
        onRowClick={(type) => handleTypeSelect(type.id)}
      />
    </>
  )
}

export default TypeList