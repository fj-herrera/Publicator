import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import './tags.css'

type TagFormProps = {
  initialName: string
  submitLabel: string
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
}

function TagForm({ initialName, submitLabel, onSubmit, onCancel }: TagFormProps) {
  const [tagName, setTagName] = useState(initialName)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = tagName.trim()

    if (name) {
      await onSubmit(name)
    }
  }

  return (
    <form className="tag-form" onSubmit={handleSubmit}>
      <TextField
        className="tag-form-name"
        label="Name"
        required
        value={tagName}
        onChange={(event) => setTagName(event.target.value)}
      />
      <div className="tag-form-actions">
        <Button
          className="tag-form-save"
          type="submit"
          variant="contained"
          startIcon={<CheckIcon />}
        >
          {submitLabel}
        </Button>
        <Button
          className="tag-form-cancel"
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

export default TagForm