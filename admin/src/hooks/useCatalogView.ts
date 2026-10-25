import { useState } from 'react'
import { apiMessages } from '../constants/api-messages'

type CatalogItem = {
  id: number
}

type UseCatalogViewOptions<T extends CatalogItem, TSaveData> = {
  items: T[]
  isLoading: boolean
  error: string
  createItem: (data: TSaveData) => Promise<boolean>
  updateItem: (id: number, data: TSaveData) => Promise<boolean>
  deleteItem: (id: number) => Promise<boolean>
  clearError: () => void
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
  itemLabel: string
}

function useCatalogView<T extends CatalogItem, TSaveData = string>({
  items,
  isLoading,
  error,
  createItem,
  updateItem,
  deleteItem,
  clearError,
  isCreateFormOpen,
  onCreateFormClose,
  itemLabel,
}: UseCatalogViewOptions<T, TSaveData>) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [itemPendingDelete, setItemPendingDelete] = useState<T | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSaveItem = async (data: TSaveData): Promise<void> => {
    setSuccessMessage('')
    clearError()

    if (editingItem) {
      const wasUpdated = await updateItem(editingItem.id, data)
      if (wasUpdated) {
        setEditingItem(null)
        onCreateFormClose()
      }
      return
    }

    const wasCreated = await createItem(data)
    if (wasCreated) {
      setSelectedItemId(null)
      setSuccessMessage(apiMessages.catalog.created(itemLabel))
      onCreateFormClose()
    }
  }

  const handleCancelForm = () => {
    setSuccessMessage('')
    clearError()
    setEditingItem(null)
    onCreateFormClose()
  }

  const handleEditItem = (item: T) => {
    setSuccessMessage('')
    clearError()
    setEditingItem(item)
  }

  const handleDeleteItem = (item: T) => {
    setSuccessMessage('')
    clearError()
    setItemPendingDelete(item)
  }

  const handleConfirmDelete = async () => {
    if (!itemPendingDelete) return

    setIsDeleting(true)
    try {
      const wasDeleted = await deleteItem(itemPendingDelete.id)
      if (wasDeleted) {
        setSelectedItemId((currentId) =>
          currentId === itemPendingDelete.id ? null : currentId
        )
        setSuccessMessage(apiMessages.catalog.deleted(itemLabel))
        setItemPendingDelete(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    if (isDeleting) return

    clearError()
    setItemPendingDelete(null)
  }

  return {
    items,
    isLoading,
    error,
    selectedItemId,
    editingItem,
    itemPendingDelete,
    isDeleting,
    successMessage,
    isFormOpen: isCreateFormOpen || editingItem !== null,
    setSelectedItemId,
    handleSaveItem,
    handleCancelForm,
    handleEditItem,
    handleDeleteItem,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage: () => setSuccessMessage(''),
  }
}

export default useCatalogView