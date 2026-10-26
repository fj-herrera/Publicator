import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Alert, Button, Chip, TextField } from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import type { SkillInput } from '../../entities/skill'
import { getErrorMessage } from '../../services/api-error'
import { uploadSkillIcon } from '../../services/skills.service'
import { apiMessages } from '../../constants/api-messages'
import './skill-form.css'

type SkillFormProps = {
  initialSkill: SkillInput
  submitLabel: string
  onSubmit: (skill: SkillInput) => Promise<void>
  onCancel: () => void
}

function SkillForm({ initialSkill, submitLabel, onSubmit, onCancel }: SkillFormProps) {
  const [name, setName] = useState(initialSkill.name)
  const [icon, setIcon] = useState(initialSkill.icon ?? '')
  const [iconPreview, setIconPreview] = useState(initialSkill.icon ?? '')
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'image/svg+xml') {
      setError('Choose an SVG file.')
      event.target.value = ''
      return
    }

    setError('')
    setSelectedIconFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setIconPreview(reader.result)
      } else {
        setError('Unable to preview the selected SVG.')
      }
    }
    reader.onerror = () => setError('Unable to preview the selected SVG.')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleRemoveIcon = () => {
    setIcon('')
    setIconPreview('')
    setSelectedIconFile(null)
    setError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || isSaving) return

    setIsSaving(true)
    setError('')
    try {
      const iconUrl = selectedIconFile
        ? await uploadSkillIcon(selectedIconFile)
        : icon.trim() || null
      setIcon(iconUrl ?? '')
      setIconPreview(iconUrl ?? '')
      setSelectedIconFile(null)
      await onSubmit({ name: trimmedName, icon: iconUrl })
    } catch (saveError) {
      setError(getErrorMessage(saveError, apiMessages.skills.uploadIconFailed))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="skill-form" onSubmit={handleSubmit}>
      <label className="skill-icon-picker">
        <input
          className="skill-icon-file-input"
          type="file"
          accept="image/svg+xml,.svg"
          onChange={handleIconChange}
        />
        <AddPhotoAlternateIcon className="skill-icon-picker-symbol" aria-hidden="true" />
        <span><span className="skill-icon-picker-link">Open</span> or drag and drop</span>
        <span className="skill-icon-picker-hint">SVG ONLY</span>
      </label>
      {error && <Alert className="skill-form-error" severity="error">{error}</Alert>}
      <div className="skill-preview">
        <span className="skill-preview-label">Skill Preview</span>
        <Chip
          className="skill-preview-chip"
          variant="outlined"
          icon={iconPreview ? <img src={iconPreview} alt="" /> : undefined}
          label={name.trim() || 'Skill'}
        />
      </div>
      <TextField
        className="skill-form-name"
        label="Skill name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="skill-form-actions">
        <Button
          className="skill-form-save"
          type="submit"
          variant="contained"
          startIcon={<CheckIcon />}
          disabled={isSaving}
        >
          {isSaving ? 'Saving' : submitLabel}
        </Button>
        <Button
          className="skill-form-cancel"
          type="button"
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
      {iconPreview && (
        <Button
          className="skill-form-remove-icon"
          type="button"
          onClick={handleRemoveIcon}
          disabled={isSaving}
        >
          Remove icon
        </Button>
      )}
    </form>
  )
}

export default SkillForm