import { useState, type FormEvent } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import RoleCombobox from '../assets/RoleCombobox'
import type { DirectPublicationAssetDraft } from '../../entities/publication-form'
import { updateAssetName, updatePublicationAssetRole } from '../../services/assets.service'
import { getErrorMessage } from '../../services/api-error'
import { invalidate, type ResourceName } from '../../state/resource-invalidation'

type PublicationDirectAssetEditDialogProps = {
  relation: DirectPublicationAssetDraft
  roles: string[]
  onClose: () => void
  onSaved: (relation: DirectPublicationAssetDraft) => void
}

function PublicationDirectAssetEditDialog({
  relation,
  roles,
  onClose,
  onSaved,
}: PublicationDirectAssetEditDialogProps) {
  const [name, setName] = useState(relation.asset.name ?? '')
  const [role, setRole] = useState(relation.role)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextName = name.trim()
    const nextRole = role.trim()

    if (!nextName || nextName.length > 255) {
      setError('Enter a file name of 1 to 255 characters.')
      return
    }
    if (!nextRole || nextRole.length > 50) {
      setError('Enter an Asset Role of 1 to 50 characters.')
      return
    }

    setIsSaving(true)
    setError('')
    let nextRelation = relation
    const written = new Set<ResourceName>()
    try {
      if (nextName !== (relation.asset.name ?? '').trim()) {
        const asset = await updateAssetName(relation.asset.id, nextName)
        written.add('assets')
        nextRelation = { ...nextRelation, asset: { ...relation.asset, ...asset } }
        onSaved(nextRelation)
      }
      if (nextRole !== relation.role) {
        await updatePublicationAssetRole(relation.id, nextRole)
        written.add('publicationAssets')
        nextRelation = { ...nextRelation, role: nextRole }
        onSaved(nextRelation)
      }
      onClose()
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Could not update this asset.'))
    } finally {
      if (written.size > 0) invalidate(...written)
      setIsSaving(false)
    }
  }

  return (
    <Dialog onClose={() => !isSaving && onClose()} open>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit direct asset</DialogTitle>
        <DialogContent className="publication-direct-asset-edit-content">
          <TextField
            autoFocus
            fullWidth
            label="File name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
            slotProps={{ htmlInput: { maxLength: 255 } }}
          />
          <div className="publication-direct-asset-role-field">
            <label htmlFor={`publication-asset-role-${relation.id}`}>Asset Role *</label>
            <RoleCombobox
              id={`publication-asset-role-${relation.id}`}
              label="Asset Role"
              onChange={setRole}
              options={roles}
              value={role}
            />
          </div>
          {error && <p className="publication-assets-error" role="alert">{error}</p>}
        </DialogContent>
        <DialogActions>
          <Button disabled={isSaving} onClick={onClose}>Cancel</Button>
          <Button disabled={isSaving} type="submit" variant="contained">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PublicationDirectAssetEditDialog
