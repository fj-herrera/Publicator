import { Alert } from '@mui/material'
import ContextDeleteDialog from '../components/contexts/ContextDeleteDialog'
import ContextForm from '../components/contexts/ContextForm'
import ApartmentIcon from '@mui/icons-material/Apartment'
import EmptyState from '../components/data-display/EmptyState'
import ContextList from '../components/contexts/ContextList'
import ContextPublications from '../components/contexts/ContextPublications'
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
  const selectedContext = contexts.find((context) => context.id === selectedContextId)

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
        <>
          <ContextForm
            key={editingContext?.id ?? 'create'}
            initialName={editingContext?.name ?? 'New Context'}
            submitLabel={editingContext ? 'Update' : 'Save'}
            onSubmit={handleSaveContext}
            onCancel={handleCancelForm}
          />
          {editingContext && (
            <ContextPublications
              key={editingContext.id}
              contextId={editingContext.id}
              contextName={editingContext.name}
            />
          )}
        </>
      ) : (
        !isContextsLoading && !contextError && (
          contexts.length > 0 ? (
            <>
              <ContextList
                contexts={contexts}
                selectedContextId={selectedContextId}
                onContextSelect={setSelectedContextId}
                onEdit={handleEditContext}
                onDelete={handleDeleteContext}
              />
              {selectedContext && (
                <ContextPublications
                  key={selectedContext.id}
                  contextId={selectedContext.id}
                  contextName={selectedContext.name}
                />
              )}
            </>
          ) : (
            <EmptyState
              icon={<ApartmentIcon />}
              title="No contexts yet"
              description="There are no contexts to show."
            />
          )
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