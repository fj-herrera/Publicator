import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import type { SkillGroupInput } from '../../entities/skill-group'
import './skill-group-form.css'

type SkillGroupFormProps = {
  initialGroup: SkillGroupInput
  submitLabel: string
  onSubmit: (group: SkillGroupInput) => Promise<void>
  onCancel: () => void
}

function SkillGroupForm({
  initialGroup,
  submitLabel,
  onSubmit,
  onCancel,
}: SkillGroupFormProps) {
  const [name, setName] = useState(initialGroup.name)
  const [description, setDescription] = useState(initialGroup.description ?? '')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    await onSubmit({
      name: trimmedName,
      description: description.trim() || null,
    })
  }

  return (
    <form className="skill-group-form" onSubmit={handleSubmit}>
      <TextField
        className="skill-group-form-name"
        label="Group name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <TextField
        className="skill-group-form-description"
        label="Description"
        multiline
        minRows={2}
        maxRows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="skill-group-form-actions">
        <Button
          className="skill-group-form-save"
          type="submit"
          variant="contained"
          startIcon={<CheckIcon />}
        >
          {submitLabel}
        </Button>
        <Button
          className="skill-group-form-cancel"
          type="button"
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default SkillGroupForm