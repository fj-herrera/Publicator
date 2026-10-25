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

type TagDeleteDialogProps = {
  open: boolean
  tagName: string
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function TagDeleteDialog({
  open,
  tagName,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: TagDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-tag-dialog-title">
      <DialogTitle id="delete-tag-dialog-title">Delete tag?</DialogTitle>
      <DialogContent>
        {error && <Alert className="tag-api-error" severity="error">{error}</Alert>}
        <DialogContentText>
          Are you sure you want to delete &quot;{tagName}&quot;?
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

export default TagDeleteDialog