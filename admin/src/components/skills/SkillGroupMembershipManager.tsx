import { useState } from 'react'
import {
  Alert,
  Chip,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { Skill } from '../../entities/skill'
import type { SkillGroup } from '../../entities/skill-group'
import useSkillGroupMembership from '../../hooks/useSkillGroupMembership'
import './skill-group-membership-manager.css'

type SkillGroupMembershipManagerProps = {
  skillGroup: SkillGroup
  allSkills: Skill[]
  isSkillsLoading: boolean
  skillsError: string
  onMembershipChange: () => Promise<void>
}

function SkillGroupMembershipManager({
  skillGroup,
  allSkills,
  isSkillsLoading,
  skillsError,
  onMembershipChange,
}: SkillGroupMembershipManagerProps) {
  const {
    assignedSkills,
    isLoading: isMembershipLoading,
    error: membershipError,
    addSkills,
    removeSkills,
  } = useSkillGroupMembership(skillGroup.id)
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<Set<number>>(new Set())
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<Set<number>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const availableSkills = allSkills.filter(
    (skill) => !assignedSkills.some((assignedSkill) => assignedSkill.id === skill.id),
  )
  const error = membershipError || skillsError
  const isDataUnavailable = isMembershipLoading || isSkillsLoading || Boolean(error)

  const toggleId = (currentIds: Set<number>, id: number) => {
    const nextIds = new Set(currentIds)
    if (nextIds.has(id)) nextIds.delete(id)
    else nextIds.add(id)
    return nextIds
  }

  const handleAdd = async () => {
    setIsUpdating(true)
    const addedSkillIds = await addSkills([...selectedAvailableIds])
    setSelectedAvailableIds((current) => new Set(
      [...current].filter((id) => !addedSkillIds.includes(id)),
    ))
    if (addedSkillIds.length > 0) await onMembershipChange()
    setIsUpdating(false)
  }

  const handleRemove = async () => {
    setIsUpdating(true)
    const removedSkillIds = await removeSkills([...selectedAssignedIds])
    setSelectedAssignedIds((current) => new Set(
      [...current].filter((id) => !removedSkillIds.includes(id)),
    ))
    if (removedSkillIds.length > 0) await onMembershipChange()
    setIsUpdating(false)
  }

  const renderSkillList = (
    skills: Skill[],
    selectedIds: Set<number>,
    onToggle: (id: number) => void,
    emptyMessage: string,
  ) => (
    <div className="skill-membership-chip-list" role="group">
      {skills.length > 0 ? skills.map((skill) => (
        <Chip
          key={skill.id}
          className={`skill-membership-chip${selectedIds.has(skill.id) ? ' skill-membership-chip-selected' : ''}`}
          variant="outlined"
          icon={skill.icon ? <img src={skill.icon} alt="" /> : undefined}
          label={skill.name}
          clickable
          aria-pressed={selectedIds.has(skill.id)}
          onClick={() => onToggle(skill.id)}
          disabled={isUpdating || isDataUnavailable}
        />
      )) : (
        <Typography className="skill-membership-empty" variant="body2">
          {emptyMessage}
        </Typography>
      )}
    </div>
  )

  const isLoading = isMembershipLoading || isSkillsLoading

  return (
    <section className="skill-membership-manager" aria-label={`Manage skills in ${skillGroup.name}`}>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <Typography className="skill-membership-loading" variant="body2">
          Loading skills...
        </Typography>
      ) : (
        <div className="skill-membership-transfer">
          <Paper className="skill-membership-panel" variant="outlined">
            <div className="skill-membership-panel-heading">
              <Typography component="h3">{skillGroup.name}</Typography>
              <span>{assignedSkills.length}</span>
            </div>
            {renderSkillList(
              assignedSkills,
              selectedAssignedIds,
              (id) => setSelectedAssignedIds((current) => toggleId(current, id)),
              'No skills assigned.',
            )}
          </Paper>
          <div className="skill-membership-controls">
            <Tooltip title="Remove selected skills">
              <span>
                <IconButton
                  aria-label="Remove selected skills"
                  onClick={handleRemove}
                  disabled={isUpdating || isDataUnavailable || selectedAssignedIds.size === 0}
                >
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Add selected skills">
              <span>
                <IconButton
                  aria-label="Add selected skills"
                  onClick={handleAdd}
                  disabled={isUpdating || isDataUnavailable || selectedAvailableIds.size === 0}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>
          </div>
          <Paper className="skill-membership-panel" variant="outlined">
            <div className="skill-membership-panel-heading">
              <Typography component="h3">Available skills</Typography>
              <span>{availableSkills.length}</span>
            </div>
            {renderSkillList(
              availableSkills,
              selectedAvailableIds,
              (id) => setSelectedAvailableIds((current) => toggleId(current, id)),
              'All skills are assigned.',
            )}
          </Paper>
        </div>
      )}
    </section>
  )
}

export default SkillGroupMembershipManager