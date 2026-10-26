import type { SkillGroup, SkillGroupInput } from '../entities/skill-group'
import useSkillGroups from './useSkillGroups'
import useCatalogView from './useCatalogView'

type UseSkillGroupsViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function useSkillGroupsView({
  isCreateFormOpen,
  onCreateFormClose,
}: UseSkillGroupsViewOptions) {
  const {
    skillGroups,
    isLoading: isSkillGroupsLoading,
    error: skillGroupError,
    createSkillGroup,
    updateSkillGroup,
    deleteSkillGroup,
    refreshSkillGroups,
    clearError,
  } = useSkillGroups()
  const catalog = useCatalogView<SkillGroup, SkillGroupInput>({
    items: skillGroups,
    isLoading: isSkillGroupsLoading,
    error: skillGroupError,
    createItem: createSkillGroup,
    updateItem: updateSkillGroup,
    deleteItem: deleteSkillGroup,
    clearError,
    isCreateFormOpen,
    onCreateFormClose,
    itemLabel: 'Skill Group',
  })

  return {
    skillGroups: catalog.items,
    isSkillGroupsLoading: catalog.isLoading,
    skillGroupError: catalog.error,
    selectedSkillGroupId: catalog.selectedItemId,
    editingSkillGroup: catalog.editingItem,
    skillGroupPendingDelete: catalog.itemPendingDelete,
    isDeleting: catalog.isDeleting,
    successMessage: catalog.successMessage,
    isFormOpen: catalog.isFormOpen,
    setSelectedSkillGroupId: catalog.setSelectedItemId,
    handleSaveSkillGroup: catalog.handleSaveItem,
    handleCancelForm: catalog.handleCancelForm,
    handleEditSkillGroup: catalog.handleEditItem,
    handleDeleteSkillGroup: catalog.handleDeleteItem,
    handleConfirmDelete: catalog.handleConfirmDelete,
    handleCancelDelete: catalog.handleCancelDelete,
    clearSuccessMessage: catalog.clearSuccessMessage,
    refreshSkillGroups,
  }
}

export default useSkillGroupsView