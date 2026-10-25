import { IconButton, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { Client } from '../../entities/client'
import DataGrid, { type DataGridColumn } from '../data-display/DataGrid'
import ClientCard from './ClientCard'
import './client-list.css'

type ClientListProps = {
  clients: Client[]
  selectedClientId: number | null
  onClientSelect: (id: number | null) => void
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

function ClientList({
  clients,
  selectedClientId,
  onClientSelect,
  onEdit,
  onDelete,
}: ClientListProps) {
  const visibleClients = selectedClientId === null
    ? clients
    : clients.filter((client) => client.id === selectedClientId)

  const columns: DataGridColumn<Client>[] = [
    { field: 'name', header: 'Name', className: 'data-grid-name-column' },
    {
      field: 'inPublications',
      header: 'In publications',
      className: 'data-grid-publications-column',
    },
    {
      header: 'Actions',
      className: 'data-grid-actions-column',
      render: (client) => (
        <span
          className="data-grid-actions"
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Tooltip title={`Edit ${client.name}`}>
            <IconButton
              aria-label={`Edit ${client.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(client)
              }}
            >
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={client.inPublications > 0
              ? 'This item cannot be deleted while it is used in publications. Remove it from all publications first.'
              : `Delete ${client.name}`}
          >
            <span tabIndex={client.inPublications > 0 ? 0 : undefined}>
              <IconButton
                aria-label={`Delete ${client.name}`}
                disabled={client.inPublications > 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(client)
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

  const handleClientSelect = (id: number) => {
    onClientSelect(selectedClientId === id ? null : id)
  }

  return (
    <>
      <div className="client-logo-grid" role="group" aria-label="Filter clients">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            isSelected={selectedClientId === client.id}
            onSelect={() => handleClientSelect(client.id)}
          />
        ))}
      </div>
      <DataGrid<Client>
        key={selectedClientId ?? 'all-clients'}
        columns={columns}
        rows={visibleClients}
        selectedRowId={selectedClientId}
        onRowClick={(client) => handleClientSelect(client.id)}
      />
    </>
  )
}

export default ClientList