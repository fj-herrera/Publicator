import { useState } from 'react'
import { Alert } from '@mui/material'
import type { Skill } from '../entities/skill'
import type { SkillGroup } from '../entities/skill-group'
import SkillGroupDeleteDialog from '../components/skills/SkillGroupDeleteDialog'
import SkillGroupForm from '../components/skills/SkillGroupForm'
import SkillGroupList from '../components/skills/SkillGroupList'
import SkillGroupMembershipManager from '../components/skills/SkillGroupMembershipManager'
import useSkillGroupsView from '../hooks/useSkillGroupsView'

type SkillGroupsProps = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
  skills: Skill[]
  isSkillsLoading: boolean
  skillsError: string
}

function SkillGroups({
  isCreateFormOpen,
  onCreateFormClose,
  skills,
  isSkillsLoading,
  skillsError,
}: SkillGroupsProps) {
  const [managingSkillGroupId, setManagingSkillGroupId] = useState<number | null>(null)
  const {
    skillGroups,
    isSkillGroupsLoading,
    skillGroupError,
    editingSkillGroup,
    skillGroupPendingDelete,
    isDeleting,
    successMessage,
    isFormOpen,
    handleSaveSkillGroup,
    handleCancelForm,
    handleEditSkillGroup,
    handleDeleteSkillGroup,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage,
    refreshSkillGroups,
  } = useSkillGroupsView({ isCreateFormOpen, onCreateFormClose })
  const managingSkillGroup = skillGroups.find(
    (group) => group.id === managingSkillGroupId,
  ) ?? null
  const visibleSkillGroups = managingSkillGroup ? [managingSkillGroup] : skillGroups

  return (
    <>
      {skillGroupError && !skillGroupPendingDelete && (
        <Alert severity="error">{skillGroupError}</Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}
      {isFormOpen && (
        <SkillGroupForm
          key={editingSkillGroup?.id ?? 'create'}
          initialGroup={{
            name: editingSkillGroup?.name ?? '',
            description: editingSkillGroup?.description ?? null,
          }}
          submitLabel={editingSkillGroup ? 'Update' : 'Save'}
          onSubmit={handleSaveSkillGroup}
          onCancel={handleCancelForm}
        />
      )}
      {!isSkillGroupsLoading && !skillGroupError && (
        <>
          {managingSkillGroup && (
            <SkillGroupMembershipManager
              key={managingSkillGroup.id}
              skillGroup={managingSkillGroup}
              allSkills={skills}
              isSkillsLoading={isSkillsLoading}
              skillsError={skillsError}
              onMembershipChange={refreshSkillGroups}
            />
          )}
          <SkillGroupList
            skillGroups={visibleSkillGroups}
            selectedSkillGroupId={managingSkillGroupId}
            onManage={(group: SkillGroup) => setManagingSkillGroupId(
              (currentId) => currentId === group.id ? null : group.id,
            )}
            onEdit={handleEditSkillGroup}
            onDelete={handleDeleteSkillGroup}
          />
        </>
      )}
      <SkillGroupDeleteDialog
        open={skillGroupPendingDelete !== null}
        skillGroupName={skillGroupPendingDelete?.name ?? ''}
        error={skillGroupPendingDelete ? skillGroupError : ''}
        isDeleting={isDeleting}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

export default SkillGroups