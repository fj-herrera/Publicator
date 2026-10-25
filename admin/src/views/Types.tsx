import { Alert } from '@mui/material'
import TypeDeleteDialog from '../components/types/TypeDeleteDialog'
import TypeForm from '../components/types/TypeForm'
import TypeList from '../components/types/TypeList'
import useTypesView from '../hooks/useTypesView'

type TypesProps = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function Types({ isCreateFormOpen, onCreateFormClose }: TypesProps) {
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
  } = useTypesView({ isCreateFormOpen, onCreateFormClose })

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
        <TypeForm
          key={editingType?.id ?? 'create'}
          initialName={editingType?.name ?? 'New Type'}
          submitLabel={editingType ? 'Update' : 'Save'}
          onSubmit={handleSaveType}
          onCancel={handleCancelForm}
        />
      ) : (
        !isTypesLoading && !typeError && types.length > 0 && (
          <TypeList
            types={types}
            selectedTypeId={selectedTypeId}
            onTypeSelect={setSelectedTypeId}
            onEdit={handleEditType}
            onDelete={handleDeleteType}
          />
        )
      )}
      <TypeDeleteDialog
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

export default Types