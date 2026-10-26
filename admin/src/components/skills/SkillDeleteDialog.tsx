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

type SkillDeleteDialogProps = {
  open: boolean
  skillName: string
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function SkillDeleteDialog({
  open,
  skillName,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: SkillDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-skill-dialog-title">
      <DialogTitle id="delete-skill-dialog-title">Delete skill?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <DialogContentText>
          Are you sure you want to delete &quot;{skillName}&quot;?
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

export default SkillDeleteDialog