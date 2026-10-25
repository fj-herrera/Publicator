import { useState } from 'react'
import { Alert, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ClientDeleteDialog from '../components/clients/ClientDeleteDialog'
import ClientForm from '../components/clients/ClientForm'
import ClientList from '../components/clients/ClientList'
import useClientsView from '../hooks/useClientsView'
import './clients.css'

function Clients() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const {
    clients,
    isClientsLoading,
    clientError,
    selectedClientId,
    editingClient,
    clientPendingDelete,
    isDeleting,
    successMessage,
    isFormOpen,
    setSelectedClientId,
    handleSaveClient,
    handleCancelForm,
    handleEditClient,
    handleDeleteClient,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage,
  } = useClientsView({
    isCreateFormOpen,
    onCreateFormClose: () => setIsCreateFormOpen(false),
  })

  return (
    <>
      <div className="client-page-header">
        <h1>Clients</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateFormOpen(true)}
        >
          Create Client
        </Button>
      </div>
      {clientError && !clientPendingDelete && (
        <Alert className="client-api-error" severity="error">{clientError}</Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}
      {isFormOpen ? (
        <ClientForm
          key={editingClient?.id ?? 'create'}
          initialClient={{
            name: editingClient?.name ?? '',
            logo: editingClient?.logo ?? null,
          }}
          submitLabel={editingClient ? 'Update' : 'Save'}
          onSubmit={handleSaveClient}
          onCancel={handleCancelForm}
        />
      ) : (
        !isClientsLoading && !clientError && clients.length > 0 && (
          <ClientList
            clients={clients}
            selectedClientId={selectedClientId}
            onClientSelect={setSelectedClientId}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />
        )
      )}
      <ClientDeleteDialog
        open={clientPendingDelete !== null}
        clientName={clientPendingDelete?.name ?? ''}
        error={clientPendingDelete ? clientError : ''}
        isDeleting={isDeleting}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

export default Clients