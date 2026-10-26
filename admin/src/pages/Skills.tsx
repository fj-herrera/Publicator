import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import BubbleChartIcon from '@mui/icons-material/BubbleChart'
import { Alert } from '@mui/material'
import SectionTabs from '../components/navigation/SectionTabs'
import SkillDeleteDialog from '../components/skills/SkillDeleteDialog'
import SkillForm from '../components/skills/SkillForm'
import SkillList from '../components/skills/SkillList'
import SkillGroups from '../views/SkillGroups'
import useSkillsView from '../hooks/useSkillsView'

function Skills() {
  const [activeTab, setActiveTab] = useState('skill-groups')
  const [isSkillGroupFormOpen, setIsSkillGroupFormOpen] = useState(false)
  const [isSkillFormOpen, setIsSkillFormOpen] = useState(false)
  const {
    skills,
    isSkillsLoading,
    skillError,
    selectedSkillId,
    editingSkill,
    skillPendingDelete,
    isDeleting,
    successMessage,
    isFormOpen,
    setSelectedSkillId,
    handleSaveSkill,
    handleCancelForm,
    handleEditSkill,
    handleDeleteSkill,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage,
  } = useSkillsView({
    isCreateFormOpen: isSkillFormOpen,
    onCreateFormClose: () => setIsSkillFormOpen(false),
  })

  const handleCreate = () => {
    if (activeTab === 'skill-groups') {
      setIsSkillGroupFormOpen(true)
    } else if (activeTab === 'skills') {
      setIsSkillFormOpen(true)
    }
  }

  return (
    <>
      <SectionTabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { label: 'Skill Groups', value: 'skill-groups', icon: <BubbleChartIcon /> },
          { label: 'Skills', value: 'skills', icon: <AddIcon /> },
        ]}
        onCreate={handleCreate}
        createLabels={{
          'skill-groups': 'Create Skill Group',
          skills: 'Create Skill',
        }}
      />
      {activeTab === 'skill-groups' ? (
        <SkillGroups
          isCreateFormOpen={isSkillGroupFormOpen}
          onCreateFormClose={() => setIsSkillGroupFormOpen(false)}
          skills={skills}
          isSkillsLoading={isSkillsLoading}
          skillsError={skillError}
        />
      ) : (
        <>
          {skillError && !skillPendingDelete && <Alert severity="error">{skillError}</Alert>}
          {successMessage && (
            <Alert severity="success" onClose={clearSuccessMessage}>
              {successMessage}
            </Alert>
          )}
          {isFormOpen && (
            <SkillForm
              key={editingSkill?.id ?? 'create'}
              initialSkill={{
                name: editingSkill?.name ?? '',
                icon: editingSkill?.icon ?? null,
              }}
              submitLabel={editingSkill ? 'Update' : 'Save'}
              onSubmit={handleSaveSkill}
              onCancel={handleCancelForm}
            />
          )}
          {!isSkillsLoading && !skillError && (
            <SkillList
              skills={skills}
              selectedSkillId={selectedSkillId}
              onSkillSelect={setSelectedSkillId}
              onEdit={handleEditSkill}
              onDelete={handleDeleteSkill}
            />
          )}
          <SkillDeleteDialog
            open={skillPendingDelete !== null}
            skillName={skillPendingDelete?.name ?? ''}
            error={skillPendingDelete ? skillError : ''}
            isDeleting={isDeleting}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}
    </>
  )
}

export default Skills