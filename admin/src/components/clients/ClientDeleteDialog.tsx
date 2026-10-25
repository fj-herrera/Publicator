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

type ClientDeleteDialogProps = {
  open: boolean
  clientName: string
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function ClientDeleteDialog({
  open,
  clientName,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: ClientDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-client-dialog-title">
      <DialogTitle id="delete-client-dialog-title">Delete client?</DialogTitle>
      <DialogContent>
        {error && <Alert className="client-api-error" severity="error">{error}</Alert>}
        <DialogContentText>
          Are you sure you want to delete &quot;{clientName}&quot;?
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

export default ClientDeleteDialog