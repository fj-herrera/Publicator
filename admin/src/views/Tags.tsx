import { Alert } from '@mui/material'
import TagDeleteDialog from '../components/tags/TagDeleteDialog'
import TagForm from '../components/tags/TagForm'
import TagList from '../components/tags/TagList'
import useTagsView from '../hooks/useTagsView'

type TagsProps = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

function Tags({ isCreateFormOpen, onCreateFormClose }: TagsProps) {
  const {
    tags,
    isTagsLoading,
    tagError,
    selectedTagId,
    editingTag,
    tagPendingDelete,
    isDeleting,
    successMessage,
    isFormOpen,
    setSelectedTagId,
    handleSaveTag,
    handleCancelForm,
    handleEditTag,
    handleDeleteTag,
    handleConfirmDelete,
    handleCancelDelete,
    clearSuccessMessage,
  } = useTagsView({ isCreateFormOpen, onCreateFormClose })

  return (
    <>
      {tagError && !tagPendingDelete && (
        <Alert className="tag-api-error" severity="error">{tagError}</Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}
      {isFormOpen ? (
        <TagForm
          key={editingTag?.id ?? 'create'}
          initialName={editingTag?.name ?? 'New Tag'}
          submitLabel={editingTag ? 'Update' : 'Save'}
          onSubmit={handleSaveTag}
          onCancel={handleCancelForm}
        />
      ) : (
        !isTagsLoading && !tagError && tags.length > 0 && (
          <TagList
            tags={tags}
            selectedTagId={selectedTagId}
            onTagSelect={setSelectedTagId}
            onEdit={handleEditTag}
            onDelete={handleDeleteTag}
          />
        )
      )}
      <TagDeleteDialog
        open={tagPendingDelete !== null}
        tagName={tagPendingDelete?.name ?? ''}
        error={tagPendingDelete ? tagError : ''}
        isDeleting={isDeleting}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

export default Tags