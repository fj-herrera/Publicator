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

type ContextDeleteDialogProps = {
  open: boolean
  contextName: string
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function ContextDeleteDialog({
  open,
  contextName,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: ContextDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-context-dialog-title">
      <DialogTitle id="delete-context-dialog-title">Delete context?</DialogTitle>
      <DialogContent>
        {error && <Alert className="context-api-error" severity="error">{error}</Alert>}
        <DialogContentText>
          Are you sure you want to delete &quot;{contextName}&quot;?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
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

export default ContextDeleteDialog