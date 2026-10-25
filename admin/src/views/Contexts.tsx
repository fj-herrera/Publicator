import { Alert } from '@mui/material'
import ContextDeleteDialog from '../components/contexts/ContextDeleteDialog'
import ContextForm from '../components/contexts/ContextForm'
import ContextList from '../components/contexts/ContextList'
import useContextsView from '../hooks/useContextsView'

type ContextsProps = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function Contexts({ isCreateFormOpen, onCreateFormClose }: ContextsProps) {
  const {
    contexts,
    isContextsLoading,
    contextError,
    selectedContextId,
    editingContext,
    contextPendingDelete,
    isDeleting,
    successMessage,
    isFormOpen,
    setSelectedContextId,
    handleSaveContext,
    handleCancelForm,
    handleEditContext,
    handleDeleteContext,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage,
  } = useContextsView({ isCreateFormOpen, onCreateFormClose })

  return (
    <>
      {contextError && !contextPendingDelete && (
        <Alert className="context-api-error" severity="error">{contextError}</Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}
      {isFormOpen ? (
        <ContextForm
          key={editingContext?.id ?? 'create'}
          initialName={editingContext?.name ?? 'New Context'}
          submitLabel={editingContext ? 'Update' : 'Save'}
          onSubmit={handleSaveContext}
          onCancel={handleCancelForm}
        />
      ) : (
        !isContextsLoading && !contextError && contexts.length > 0 && (
          <ContextList
            contexts={contexts}
            selectedContextId={selectedContextId}
            onContextSelect={setSelectedContextId}
            onEdit={handleEditContext}
            onDelete={handleDeleteContext}
          />
        )
      )}
      <ContextDeleteDialog
        open={contextPendingDelete !== null}
        contextName={contextPendingDelete?.name ?? ''}
        error={contextPendingDelete ? contextError : ''}
        isDeleting={isDeleting}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

export default Contexts