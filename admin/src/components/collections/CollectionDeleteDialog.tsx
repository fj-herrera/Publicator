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

type CollectionDeleteDialogProps = {
  open: boolean
  position: number
  publicationTitle: string
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function CollectionDeleteDialog({
  open,
  position,
  publicationTitle,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: CollectionDeleteDialogProps) {
  return (
    <Dialog
      aria-labelledby="delete-collection-dialog-title"
      onClose={onClose}
      open={open}
    >
      <DialogTitle id="delete-collection-dialog-title">Delete collection?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <DialogContentText>
          {apiMessages.collections.deleteConfirmation(position, publicationTitle)}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={isDeleting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="error"
          disabled={isDeleting}
          onClick={onConfirm}
          startIcon={<DeleteIcon />}
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CollectionDeleteDialog
