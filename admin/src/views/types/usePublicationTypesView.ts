import { useState } from 'react'
import type { PublicationType } from '../../entities/types/publication-type'
import usePublicationTypes from '../../hooks/usePublicationTypes'

type UsePublicationTypesViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function usePublicationTypesView({
  isCreateFormOpen,
  onCreateFormClose,
}: UsePublicationTypesViewOptions) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [editingType, setEditingType] = useState<PublicationType | null>(null)
  const [typePendingDelete, setTypePendingDelete] = useState<PublicationType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const {
    types,
    isLoading: isTypesLoading,
    error: typeError,
    createType,
    updateType,
    deleteType,
    clearError,
  } = usePublicationTypes()

  const handleSaveType = async (name: string): Promise<void> => {
    setSuccessMessage('')
    clearError()

    if (editingType) {
      const wasUpdated = await updateType(editingType.id, name)
      if (wasUpdated) {
        setEditingType(null)
        onCreateFormClose()
      }
      return
    }

    const wasCreated = await createType(name)
    if (wasCreated) {
      setSelectedTypeId(null)
      setSuccessMessage('Type created successfully.')
      onCreateFormClose()
    }
  }

  const handleCancelForm = () => {
    setSuccessMessage('')
    clearError()
    setEditingType(null)
    onCreateFormClose()
  }

  const handleEditType = (type: PublicationType) => {
    setSuccessMessage('')
    clearError()
    setEditingType(type)
  }

  const handleDeleteType = (type: PublicationType) => {
    setSuccessMessage('')
    clearError()
    setTypePendingDelete(type)
  }

  const handleConfirmDelete = async () => {
    if (!typePendingDelete) {
      return
    }

    setIsDeleting(true)
    try {
      const wasDeleted = await deleteType(typePendingDelete.id)
      if (wasDeleted) {
        setSelectedTypeId((currentId) => (
          currentId === typePendingDelete.id ? null : currentId
        ))
        setSuccessMessage('Type deleted successfully.')
        setTypePendingDelete(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    if (isDeleting) {
      return
    }

    clearError()
    setTypePendingDelete(null)
  }

  const clearSuccessMessage = () => setSuccessMessage('')

  return {
    types,
    isTypesLoading,
    typeError,
    selectedTypeId,
    editingType,
    typePendingDelete,
    isDeleting,
    successMessage,
    isFormOpen: isCreateFormOpen || editingType !== null,
    setSelectedTypeId,
    handleSaveType,
    handleCancelForm,
    handleEditType,
    handleDeleteType,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage,
  }
}

export default usePublicationTypesView