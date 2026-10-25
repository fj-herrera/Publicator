import type { Tag } from '../entities/tag'
import usePublicationTags from './usePublicationTags'
import useCatalogView from './useCatalogView'

type UseTagsViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function useTagsView({
  isCreateFormOpen,
  onCreateFormClose,
}: UseTagsViewOptions) {
  const {
    tags,
    isLoading: isTagsLoading,
    error: tagError,
    createTag,
    updateTag,
    deleteTag,
    clearError,
  } = usePublicationTags()
  const catalog = useCatalogView<Tag>({
    items: tags,
    isLoading: isTagsLoading,
    error: tagError,
    createItem: createTag,
    updateItem: updateTag,
    deleteItem: deleteTag,
    clearError,
    isCreateFormOpen,
    onCreateFormClose,
    itemLabel: 'Tag',
  })

  return {
    tags: catalog.items,
    isTagsLoading: catalog.isLoading,
    tagError: catalog.error,
    selectedTagId: catalog.selectedItemId,
    editingTag: catalog.editingItem,
    tagPendingDelete: catalog.itemPendingDelete,
    isDeleting: catalog.isDeleting,
    successMessage: catalog.successMessage,
    isFormOpen: catalog.isFormOpen,
    setSelectedTagId: catalog.setSelectedItemId,
    handleSaveTag: catalog.handleSaveItem,
    handleCancelForm: catalog.handleCancelForm,
    handleEditTag: catalog.handleEditItem,
    handleDeleteTag: catalog.handleDeleteItem,
    handleConfirmDelete: catalog.handleConfirmDelete,
    handleCancelDelete: catalog.handleCancelDelete,
    clearSuccessMessage: catalog.clearSuccessMessage,
  }
}

export default useTagsView