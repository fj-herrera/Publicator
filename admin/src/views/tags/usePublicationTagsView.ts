import { useState } from 'react'
import type { Tag } from '../../entities/tag'
import usePublicationTags from '../../hooks/usePublicationTags'

type UsePublicationTagsViewOptions = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function usePublicationTagsView({
  isCreateFormOpen,
  onCreateFormClose,
}: UsePublicationTagsViewOptions) {
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tagPendingDelete, setTagPendingDelete] = useState<Tag | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const {
    tags,
    isLoading: isTagsLoading,
    error: tagError,
    createTag,
    updateTag,
    deleteTag,
    clearError,
  } = usePublicationTags()

  const handleSaveTag = async (name: string): Promise<void> => {
    setSuccessMessage('')
    clearError()

    if (editingTag) {
      const wasUpdated = await updateTag(editingTag.id, name)
      if (wasUpdated) {
        setEditingTag(null)
        onCreateFormClose()
      }
      return
    }

    const wasCreated = await createTag(name)
    if (wasCreated) {
      setSelectedTagId(null)
      setSuccessMessage('Tag created successfully.')
      onCreateFormClose()
    }
  }

  const handleCancelForm = () => {
    setSuccessMessage('')
    clearError()
    setEditingTag(null)
    onCreateFormClose()
  }

  const handleEditTag = (tag: Tag) => {
    setSuccessMessage('')
    clearError()
    setEditingTag(tag)
  }

  const handleDeleteTag = (tag: Tag) => {
    setSuccessMessage('')
    clearError()
    setTagPendingDelete(tag)
  }

  const handleConfirmDelete = async () => {
    if (!tagPendingDelete) {
      return
    }

    setIsDeleting(true)
    try {
      const wasDeleted = await deleteTag(tagPendingDelete.id)
      if (wasDeleted) {
        setSelectedTagId((currentId) => (
          currentId === tagPendingDelete.id ? null : currentId
        ))
        setSuccessMessage('Tag deleted successfully.')
        setTagPendingDelete(null)
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
    setTagPendingDelete(null)
  }

  return {
    tags,
    isTagsLoading,
    tagError,
    selectedTagId,
    editingTag,
    tagPendingDelete,
    isDeleting,
    successMessage,
    isFormOpen: isCreateFormOpen || editingTag !== null,
    setSelectedTagId,
    handleSaveTag,
    handleCancelForm,
    handleEditTag,
    handleDeleteTag,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage: () => setSuccessMessage(''),
  }
}

export default usePublicationTagsView