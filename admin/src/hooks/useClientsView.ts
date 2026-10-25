import type { Client, ClientInput } from '../entities/client'
import useClients from './useClients'
import useCatalogView from './useCatalogView'

type UseClientsViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function useClientsView({
  isCreateFormOpen,
  onCreateFormClose,
}: UseClientsViewOptions) {
  const {
    clients,
    isLoading: isClientsLoading,
    error: clientError,
    createClient,
    updateClient,
    deleteClient,
    clearError,
  } = useClients()
  const catalog = useCatalogView<Client, ClientInput>({
    items: clients,
    isLoading: isClientsLoading,
    error: clientError,
    createItem: createClient,
    updateItem: updateClient,
    deleteItem: deleteClient,
    clearError,
    isCreateFormOpen,
    onCreateFormClose,
    itemLabel: 'Client',
  })

  return {
    clients: catalog.items,
    isClientsLoading: catalog.isLoading,
    clientError: catalog.error,
    selectedClientId: catalog.selectedItemId,
    editingClient: catalog.editingItem,
    clientPendingDelete: catalog.itemPendingDelete,
    isDeleting: catalog.isDeleting,
    successMessage: catalog.successMessage,
    isFormOpen: catalog.isFormOpen,
    setSelectedClientId: catalog.setSelectedItemId,
    handleSaveClient: catalog.handleSaveItem,
    handleCancelForm: catalog.handleCancelForm,
    handleEditClient: catalog.handleEditItem,
    handleDeleteClient: catalog.handleDeleteItem,
    handleConfirmDelete: catalog.handleConfirmDelete,
    handleCancelDelete: catalog.handleCancelDelete,
    clearSuccessMessage: catalog.clearSuccessMessage,
  }
}

export default useClientsView