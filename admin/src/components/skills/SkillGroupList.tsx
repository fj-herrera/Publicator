import { IconButton, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { SkillGroup } from '../../entities/skill-group'
import { apiMessages } from '../../constants/api-messages'
import DataGrid, { type DataGridColumn } from '../data-display/DataGrid'
import ObjectChips from '../data-display/ObjectChips'
import './skill-group-list.css'

type SkillGroupListProps = {
  skillGroups: SkillGroup[]
  selectedSkillGroupId: number | null
  onManage: (group: SkillGroup) => void
  onEdit: (group: SkillGroup) => void
  onDelete: (group: SkillGroup) => void
}

function SkillGroupList({
  skillGroups,
  selectedSkillGroupId,
  onManage,
  onEdit,
  onDelete,
}: SkillGroupListProps) {
  const columns: DataGridColumn<SkillGroup>[] = [
    {
      header: 'Group name',
      className: 'skill-group-name-column',
      render: (group) => (
        <div className="skill-group-name-cell">
          <strong>{group.name}</strong>
          {group.description && <span>{group.description}</span>}
        </div>
      ),
    },
    {
      header: 'Skills',
      className: 'skill-group-skills-column',
      render: (group) => (
        group.skills.length > 0 ? (
          <div className="skill-group-skills">
            <ObjectChips
              items={group.skills.map(({ id, name, icon }) => ({ id, label: name, iconUrl: icon }))}
              variant="outlined"
              iconMode="url"
            />
          </div>
        ) : (
          <span className="skill-group-empty-skills">No skills</span>
        )
      ),
    },
    {
      field: 'inPublications',
      header: 'In publications',
      className: 'data-grid-publications-column',
    },
    {
      header: 'Actions',
      className: 'data-grid-actions-column',
      render: (group) => (
        <span
          className="data-grid-actions skill-group-actions"
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Tooltip title={`Edit ${group.name}`}>
            <IconButton
              aria-label={`Edit ${group.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onEdit(group)
              }}
            >
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={group.inPublications > 0
              ? apiMessages.skillGroups.deleteInUse
              : `Delete ${group.name}`}
          >
            <span tabIndex={group.inPublications > 0 ? 0 : undefined}>
              <IconButton
                aria-label={`Delete ${group.name}`}
                disabled={group.inPublications > 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(group)
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

  return (
    <div className="skill-group-data-grid">
      <DataGrid<SkillGroup>
        key={selectedSkillGroupId ?? 'all'}
        columns={columns}
        rows={skillGroups}
        selectedRowId={selectedSkillGroupId}
        onRowClick={onManage}
      />
    </div>
  )
}

export default SkillGroupList