import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import './contexts.css'

type ContextFormProps = {
  initialName: string
  submitLabel: string
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
}

function ContextForm({ initialName, submitLabel, onSubmit, onCancel }: ContextFormProps) {
  const [contextName, setContextName] = useState(initialName)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = contextName.trim()

    if (name) {
      await onSubmit(name)
    }
  }

  return (
    <form className="context-form" onSubmit={handleSubmit}>
      <TextField
        className="context-form-name"
        label="Name"
        required
        value={contextName}
        onChange={(event) => setContextName(event.target.value)}
      />
      <div className="context-form-actions">
        <Button
          className="context-form-save"
          type="submit"
          variant="contained"
          startIcon={<CheckIcon />}
        >
          {submitLabel}
        </Button>
        <Button
          className="context-form-cancel"
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

export default ContextForm