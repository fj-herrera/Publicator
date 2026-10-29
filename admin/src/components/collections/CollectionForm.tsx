import { useState, type FormEvent } from 'react'
import { Autocomplete, Button, TextField } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import type { PublicationAssetTarget } from '../../entities/asset'
import { getErrorMessage } from '../../services/api-error'
import { apiMessages } from '../../constants/api-messages'
import RoleCombobox from '../assets/RoleCombobox'
import './collections.css'

type CollectionFormProps = {
  publications: PublicationAssetTarget[]
  typeOptions: string[]
  onSubmit: (publicationId: number, type: string) => Promise<void>
  onCancel: () => void
}

function CollectionForm({ publications, typeOptions, onSubmit, onCancel }: CollectionFormProps) {
  const [publication, setPublication] = useState<PublicationAssetTarget | null>(null)
  const [type, setType] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedType = type.trim()

    if (!publication) {
      setError('Select the publication of the collection.')
      return
    }

    if (!trimmedType || trimmedType.length > 50) {
      setError('Enter a collection type of 1 to 50 characters.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await onSubmit(publication.id, trimmedType)
    } catch (submitError) {
      // The form keeps everything typed so the administrator can retry.
      setError(getErrorMessage(submitError, apiMessages.collections.createFailed))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="collection-create-form" onSubmit={handleSubmit}>
      <Autocomplete
        className="collection-create-publication"
        getOptionLabel={(option) => `${option.meta.title} (${option.meta.slug})`}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        onChange={(_event, selected) => setPublication(selected)}
        options={publications}
        renderInput={(params) => <TextField {...params} label="Publication" required />}
        value={publication}
      />
      <div className="collection-create-row">
        <div className="collection-create-type">
          <label htmlFor="collection-create-type-input">Collection type *</label>
          <RoleCombobox
            createLabel="Create new type"
            id="collection-create-type-input"
            label="Collection type"
            onChange={setType}
            options={typeOptions}
            value={type}
          />
        </div>
        <div className="collection-form-actions">
          <Button
            disabled={isSaving}
            startIcon={<CheckIcon />}
            type="submit"
            variant="contained"
          >
            Save
          </Button>
          <Button
            disabled={isSaving}
            onClick={onCancel}
            startIcon={<CloseIcon />}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
        </div>
      </div>
      {error && <p className="collection-form-error" role="alert">{error}</p>}
    </form>
  )
}

export default CollectionForm
