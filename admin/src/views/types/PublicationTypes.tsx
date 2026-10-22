import { Alert } from '@mui/material'
import PublicationTypeDeleteDialog from './PublicationTypeDeleteDialog'
import PublicationTypeForm from './PublicationTypeForm'
import PublicationTypeList from './PublicationTypeList'
import usePublicationTypesView from './usePublicationTypesView.ts'

type PublicationTypesProps = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function PublicationTypes({ isCreateFormOpen, onCreateFormClose }: PublicationTypesProps) {
  const {
    types,
    isTypesLoading,
    typeError,
    selectedTypeId,
    editingType,
    typePendingDelete,
    isDeleting,
    successMessage,
    isFormOpen,
    setSelectedTypeId,
    handleSaveType,
    handleCancelForm,
    handleEditType,
    handleDeleteType,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage,
  } = usePublicationTypesView({ isCreateFormOpen, onCreateFormClose })

  return (
    <>
      {typeError && !typePendingDelete && (
        <Alert className="type-api-error" severity="error">{typeError}</Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}
      {isFormOpen ? (
        <PublicationTypeForm
          key={editingType?.id ?? 'create'}
          initialName={editingType?.name ?? 'New Type'}
          submitLabel={editingType ? 'Update' : 'Save'}
          onSubmit={handleSaveType}
          onCancel={handleCancelForm}
        />
      ) : (
        !isTypesLoading && !typeError && types.length > 0 && (
          <PublicationTypeList
            types={types}
            selectedTypeId={selectedTypeId}
            onTypeSelect={setSelectedTypeId}
            onEdit={handleEditType}
            onDelete={handleDeleteType}
          />
        )
      )}
      <PublicationTypeDeleteDialog
        open={typePendingDelete !== null}
        typeName={typePendingDelete?.name ?? ''}
        error={typePendingDelete ? typeError : ''}
        isDeleting={isDeleting}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

export default PublicationTypes