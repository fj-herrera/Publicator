import type { Skill, SkillInput } from '../entities/skill'
import useSkills from './useSkills'
import useCatalogView from './useCatalogView'

type UseSkillsViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function useSkillsView({ isCreateFormOpen, onCreateFormClose }: UseSkillsViewOptions) {
  const {
    skills,
    isLoading: isSkillsLoading,
    error: skillError,
    createSkill,
    updateSkill,
    deleteSkill,
    clearError,
  } = useSkills()
  const catalog = useCatalogView<Skill, SkillInput>({
    items: skills,
    isLoading: isSkillsLoading,
    error: skillError,
    createItem: createSkill,
    updateItem: updateSkill,
    deleteItem: deleteSkill,
    clearError,
    isCreateFormOpen,
    onCreateFormClose,
    itemLabel: 'Skill',
  })

  return {
    skills: catalog.items,
    isSkillsLoading: catalog.isLoading,
    skillError: catalog.error,
    selectedSkillId: catalog.selectedItemId,
    editingSkill: catalog.editingItem,
    skillPendingDelete: catalog.itemPendingDelete,
    isDeleting: catalog.isDeleting,
    successMessage: catalog.successMessage,
    isFormOpen: catalog.isFormOpen,
    setSelectedSkillId: catalog.setSelectedItemId,
    handleSaveSkill: catalog.handleSaveItem,
    handleCancelForm: catalog.handleCancelForm,
    handleEditSkill: catalog.handleEditItem,
    handleDeleteSkill: catalog.handleDeleteItem,
    handleConfirmDelete: catalog.handleConfirmDelete,
    handleCancelDelete: catalog.handleCancelDelete,
    clearSuccessMessage: catalog.clearSuccessMessage,
  }
}

export default useSkillsView