import { IconButton, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { Skill } from '../../entities/skill'
import { apiMessages } from '../../constants/api-messages'
import DataGrid, { type DataGridColumn } from '../data-display/DataGrid'
import ObjectChips from '../data-display/ObjectChips'
import './skill-list.css'

type SkillListProps = {
  skills: Skill[]
  selectedSkillId: number | null
  onSkillSelect: (id: number | null) => void
  onEdit: (skill: Skill) => void
  onDelete: (skill: Skill) => void
}

function SkillList({
  skills,
  selectedSkillId,
  onSkillSelect,
  onEdit,
  onDelete,
}: SkillListProps) {
  const visibleSkills = selectedSkillId === null
    ? skills
    : skills.filter((skill) => skill.id === selectedSkillId)

  const columns: DataGridColumn<Skill>[] = [
    { field: 'name', header: 'Name', className: 'data-grid-name-column' },
    {
      field: 'inSkillGroups',
      header: 'In groups',
      className: 'data-grid-publications-column',
    },
    {
      header: 'Actions',
      className: 'data-grid-actions-column',
      render: (skill) => (
        <span
          className="data-grid-actions"
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Tooltip title={`Edit ${skill.name}`}>
            <IconButton
              aria-label={`Edit ${skill.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(skill)
              }}
            >
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={skill.inSkillGroups > 0
              ? apiMessages.skills.deleteInUse
              : `Delete ${skill.name}`}
          >
            <span tabIndex={skill.inSkillGroups > 0 ? 0 : undefined}>
              <IconButton
                aria-label={`Delete ${skill.name}`}
                disabled={skill.inSkillGroups > 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(skill)
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

  const handleSkillSelect = (id: number) => {
    onSkillSelect(selectedSkillId === id ? null : id)
  }

  return (
    <>
      <div className="skill-chip-shelf">
        {skills.length > 0 ? (
          <ObjectChips
            items={skills.map(({ id, name, icon }) => ({
              id,
              label: name,
              iconUrl: icon,
            }))}
            variant="outlined"
            iconMode="url"
            selectedId={selectedSkillId}
            onSelect={(id) => handleSkillSelect(Number(id))}
          />
        ) : (
          <p className="skill-chip-empty">No skills yet.</p>
        )}
      </div>
      <DataGrid<Skill>
        key={selectedSkillId ?? 'all-skills'}
        columns={columns}
        rows={visibleSkills}
        selectedRowId={selectedSkillId}
        onRowClick={(skill) => handleSkillSelect(skill.id)}
      />
    </>
  )
}

export default SkillList