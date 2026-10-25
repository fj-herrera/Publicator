import { IconButton, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { Context } from '../../entities/context'
import DataGrid, { type DataGridColumn } from '../data-display/DataGrid'
import ContextCard from './ContextCard'
import './contexts.css'

type ContextListProps = {
  contexts: Context[]
  selectedContextId: number | null
  onContextSelect: (id: number | null) => void
  onEdit: (context: Context) => void
  onDelete: (context: Context) => void
}

function ContextList({
  contexts,
  selectedContextId,
  onContextSelect,
  onEdit,
  onDelete,
}: ContextListProps) {
  const visibleContexts = selectedContextId === null
    ? contexts
    : contexts.filter((context) => context.id === selectedContextId)

  const columns: DataGridColumn<Context>[] = [
    { field: 'name', header: 'Name', className: 'data-grid-name-column' },
    {
      field: 'inPublications',
      header: 'In publications',
      className: 'data-grid-publications-column',
    },
    {
      header: 'Actions',
      className: 'data-grid-actions-column',
      render: (context) => (
        <span
          className="data-grid-actions"
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Tooltip title={`Edit ${context.name}`}>
            <IconButton
              aria-label={`Edit ${context.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(context)
              }}
            >
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={context.inPublications > 0
              ? 'This item cannot be deleted while it is used in publications. Remove it from all publications first.'
              : `Delete ${context.name}`}
          >
            <span tabIndex={context.inPublications > 0 ? 0 : undefined}>
              <IconButton
                aria-label={`Delete ${context.name}`}
                disabled={context.inPublications > 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(context)
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

  const handleContextSelect = (id: number) => {
    onContextSelect(selectedContextId === id ? null : id)
  }

  return (
    <>
      <div className="context-cards" role="group" aria-label="Filter contexts">
        {contexts.map((context) => (
          <ContextCard
            key={context.id}
            context={context}
            isSelected={context.id === selectedContextId}
            onSelect={() => handleContextSelect(context.id)}
            onEdit={() => onEdit(context)}
          />
        ))}
      </div>
      <DataGrid<Context>
        key={selectedContextId ?? 'all-contexts'}
        columns={columns}
        rows={visibleContexts}
        selectedRowId={selectedContextId}
        onRowClick={(context) => handleContextSelect(context.id)}
      />
    </>
  )
}

export default ContextList