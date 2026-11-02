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

type AssetDeleteDialogProps = {
  open: boolean
  assetNames: string[]
  error: string
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

function AssetDeleteDialog({
  open,
  assetNames,
  error,
  isDeleting,
  onClose,
  onConfirm,
}: AssetDeleteDialogProps) {
  const isBulkDelete = assetNames.length > 1

  return (
    <Dialog
      aria-labelledby="delete-asset-dialog-title"
      onClose={onClose}
      open={open}
    >
      <DialogTitle id="delete-asset-dialog-title">Delete asset?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <DialogContentText>
          {isBulkDelete
            ? `Are you sure you want to delete these ${assetNames.length} assets?`
            : `Are you sure you want to delete "${assetNames[0] ?? ''}"?`}
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
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AssetDeleteDialog
