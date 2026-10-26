import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { apiMessages } from '../../constants/api-messages'

type SkillGroupDeleteDialogProps = {
  open: boolean
  skillGroupName: string
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function SkillGroupDeleteDialog({
  open,
  skillGroupName,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: SkillGroupDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-skill-group-title">
      <DialogTitle id="delete-skill-group-title">Delete skill group?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <DialogContentText>
          {apiMessages.skillGroups.deleteConfirmation(skillGroupName)}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          startIcon={<DeleteIcon />}
          onClick={onConfirm}
          disabled={isDeleting}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SkillGroupDeleteDialog