import {
  IconButton,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { PublicationType } from '../../entities/types/publication-type'
import DataGrid, { type DataGridColumn } from '../../components/DataGrid'
import ObjectChips from '../../components/ObjectChips'

type PublicationTypeListProps = {
  types: PublicationType[]
  selectedTypeId: number | null
  onTypeSelect: (id: number | null) => void
  onEdit: (type: PublicationType) => void
  onDelete: (type: PublicationType) => void
}

function PublicationTypeList({
  types,
  selectedTypeId,
  onTypeSelect,
  onEdit,
  onDelete,
}: PublicationTypeListProps) {
  const visibleTypes = selectedTypeId === null
    ? types
    : types.filter((type) => type.id === selectedTypeId)

  const columns: DataGridColumn<PublicationType>[] = [
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
          <Tooltip title={`Delete ${type.name}`}>
            <IconButton
              aria-label={`Delete ${type.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onDelete(type)
              }}
            >
              <DeleteIcon aria-hidden="true" />
            </IconButton>
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
      <DataGrid<PublicationType>
        key={selectedTypeId ?? 'all-types'}
        columns={columns}
        rows={visibleTypes}
        selectedRowId={selectedTypeId}
        onRowClick={(type) => handleTypeSelect(type.id)}
      />
    </>
  )
}

export default PublicationTypeList