import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Alert, Button, IconButton, TextField, Tooltip } from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import type { ClientInput } from '../../entities/client'
import './client-form.css'

import { getErrorMessage } from '../../services/api-error'
import { uploadClientLogo } from '../../services/clients.service'
import { apiMessages } from '../../constants/api-messages'

type ClientFormProps = {
  initialClient: ClientInput
  submitLabel: string
  onSubmit: (client: ClientInput) => Promise<void>
  onCancel: () => void
}

function ClientForm({
  initialClient,
  submitLabel,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const [name, setName] = useState(initialClient.name)
  const [logo, setLogo] = useState(initialClient.logo ?? '')
  const [logoPreview, setLogoPreview] = useState(initialClient.logo ?? '')
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState('')
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoFileInput = useRef<HTMLInputElement>(null)

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedImageTypes = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ]

    if (!allowedImageTypes.includes(file.type)) {
      setLogoError('Choose a PNG, JPEG, WebP, GIF, or SVG image.')
      event.target.value = ''
      return
    }

    setLogoError('')
    setSelectedLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoPreview(reader.result)
      } else {
        setLogoError('Unable to preview the selected image.')
      }
    }
    reader.onerror = () => setLogoError('Unable to preview the selected image.')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleRemoveLogo = () => {
    setLogo('')
    setLogoPreview('')
    setSelectedLogoFile(null)
    setLogoError('')
    if (logoFileInput.current) {
      logoFileInput.current.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName || isUploadingLogo) return

    setIsUploadingLogo(true)
    setLogoError('')
    try {
      const logoUrl = selectedLogoFile
        ? await uploadClientLogo(selectedLogoFile)
        : logo.trim() || null
      setLogo(logoUrl ?? '')
      setLogoPreview(logoUrl ?? '')
      setSelectedLogoFile(null)
      await onSubmit({ name: trimmedName, logo: logoUrl })
    } catch (uploadError) {
      setLogoError(getErrorMessage(uploadError, apiMessages.clients.uploadLogoFailed))
    } finally {
      setIsUploadingLogo(false)
    }
  }

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <TextField
        className="client-form-field"
        label="Name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="client-form-logo-control">
        <Button
          className="client-form-logo-button"
          component="label"
          variant="outlined"
          startIcon={<AddPhotoAlternateIcon />}
          disabled={isUploadingLogo}
        >
          {isUploadingLogo ? 'Uploading logo' : logoPreview ? 'Change logo' : 'Choose logo'}
          <input
            ref={logoFileInput}
            className="client-form-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={handleLogoFileChange}
          />
        </Button>
        {logoPreview && (
          <>
            <img className="client-form-logo-preview" src={logoPreview} alt="Client logo preview" />
            <Tooltip title="Remove logo">
              <IconButton aria-label="Remove logo" onClick={handleRemoveLogo}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        {logoError && <Alert severity="error">{logoError}</Alert>}
      </div>
      <div className="client-form-actions">
        <Button
          className="client-form-save"
          type="submit"
          variant="contained"
          startIcon={<CheckIcon />}
          disabled={isUploadingLogo}
        >
          {submitLabel}
        </Button>
        <Button
          className="client-form-cancel"
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

export default ClientForm