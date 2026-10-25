import type { Type } from '../entities/type'
import useTypes from './useTypes'
import useCatalogView from './useCatalogView'

type UseTypesViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function useTypesView({
  isCreateFormOpen,
  onCreateFormClose,
}: UseTypesViewOptions) {
  const {
    types,
    isLoading: isTypesLoading,
    error: typeError,
    createType,
    updateType,
    deleteType,
    clearError,
  } = useTypes()
  const catalog = useCatalogView<Type>({
    items: types,
    isLoading: isTypesLoading,
    error: typeError,
    createItem: createType,
    updateItem: updateType,
    deleteItem: deleteType,
    clearError,
    isCreateFormOpen,
    onCreateFormClose,
    itemLabel: 'Type',
  })

  return {
    types: catalog.items,
    isTypesLoading: catalog.isLoading,
    typeError: catalog.error,
    selectedTypeId: catalog.selectedItemId,
    editingType: catalog.editingItem,
    typePendingDelete: catalog.itemPendingDelete,
    isDeleting: catalog.isDeleting,
    successMessage: catalog.successMessage,
    isFormOpen: catalog.isFormOpen,
    setSelectedTypeId: catalog.setSelectedItemId,
    handleSaveType: catalog.handleSaveItem,
    handleCancelForm: catalog.handleCancelForm,
    handleEditType: catalog.handleEditItem,
    handleDeleteType: catalog.handleDeleteItem,
    handleConfirmDelete: catalog.handleConfirmDelete,
    handleCancelDelete: catalog.handleCancelDelete,
    clearSuccessMessage: catalog.clearSuccessMessage,
  }
}

export default useTypesView