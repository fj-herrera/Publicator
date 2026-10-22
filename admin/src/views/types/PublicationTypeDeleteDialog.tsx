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

type PublicationTypeDeleteDialogProps = {
  open: boolean
  typeName: string
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function PublicationTypeDeleteDialog({
  open,
  typeName,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: PublicationTypeDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-type-dialog-title"
    >
      <DialogTitle id="delete-type-dialog-title">Delete type?</DialogTitle>
      <DialogContent>
        {error && <Alert className="type-api-error" severity="error">{error}</Alert>}
        <DialogContentText>
          Are you sure you want to delete &quot;{typeName}&quot;?
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

export default PublicationTypeDeleteDialog