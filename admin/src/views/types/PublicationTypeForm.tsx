import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import './publication-types.css'

type PublicationTypeFormProps = {
  initialName: string
  submitLabel: string
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
}

function PublicationTypeForm({
  initialName,
  submitLabel,
  onSubmit,
  onCancel,
}: PublicationTypeFormProps) {
  const [typeName, setTypeName] = useState(initialName)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = typeName.trim()

    if (name) {
      await onSubmit(name)
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  return (
    <form className="type-create-form" onSubmit={handleSubmit}>
      <TextField
        className="type-create-name"
        label="Name"
        required
        value={typeName}
        onChange={(event) => setTypeName(event.target.value)}
      />
      <div className="type-create-actions">
        <Button
          className="type-create-save"
          type="submit"
          variant="contained"
          startIcon={<CheckIcon />}
        >
          {submitLabel}
        </Button>
        <Button
          className="type-create-cancel"
          type="button"
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default PublicationTypeForm