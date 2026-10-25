import type { Context } from '../entities/context'
import useContexts from './useContexts'
import useCatalogView from './useCatalogView'

type UseContextsViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function useContextsView({
  isCreateFormOpen,
  onCreateFormClose,
}: UseContextsViewOptions) {
  const {
    contexts,
    isLoading: isContextsLoading,
    error: contextError,
    createContext,
    updateContext,
    deleteContext,
    clearError,
  } = useContexts()
  const catalog = useCatalogView<Context>({
    items: contexts,
    isLoading: isContextsLoading,
    error: contextError,
    createItem: createContext,
    updateItem: updateContext,
    deleteItem: deleteContext,
    clearError,
    isCreateFormOpen,
    onCreateFormClose,
    itemLabel: 'Context',
  })

  return {
    contexts: catalog.items,
    isContextsLoading: catalog.isLoading,
    contextError: catalog.error,
    selectedContextId: catalog.selectedItemId,
    editingContext: catalog.editingItem,
    contextPendingDelete: catalog.itemPendingDelete,
    isDeleting: catalog.isDeleting,
    successMessage: catalog.successMessage,
    isFormOpen: catalog.isFormOpen,
    setSelectedContextId: catalog.setSelectedItemId,
    handleSaveContext: catalog.handleSaveItem,
    handleCancelForm: catalog.handleCancelForm,
    handleEditContext: catalog.handleEditItem,
    handleDeleteContext: catalog.handleDeleteItem,
    handleConfirmDelete: catalog.handleConfirmDelete,
    handleCancelDelete: catalog.handleCancelDelete,
    clearSuccessMessage: catalog.clearSuccessMessage,
  }
}

export default useContextsView