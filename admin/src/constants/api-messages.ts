export const apiMessages = {
  clients: {
    loadFailed: 'Unable to load clients.',
    createFailed: 'Unable to create client.',
    updateFailed: 'Unable to update client.',
    deleteFailed: 'Unable to delete client.',
    uploadLogoFailed: 'Unable to upload client logo.',
  },
  contexts: {
    loadFailed: 'Unable to load contexts.',
    createFailed: 'Unable to create context.',
    updateFailed: 'Unable to update context.',
    deleteFailed: 'Unable to delete context.',
  },
  tags: {
    loadFailed: 'Unable to load tags.',
    createFailed: 'Unable to create tag.',
    updateFailed: 'Unable to update tag.',
    deleteFailed: 'Unable to delete tag.',
  },
  types: {
    loadFailed: 'Unable to load types.',
    createFailed: 'Unable to create type.',
    updateFailed: 'Unable to update type.',
    deleteFailed: 'Unable to delete type.',
  },
  skills: {
    loadFailed: 'Unable to load skills.',
    createFailed: 'Unable to create skill.',
    updateFailed: 'Unable to update skill.',
    deleteFailed: 'Unable to delete skill.',
    uploadIconFailed: 'Unable to upload skill icon.',
    deleteInUse: 'This skill cannot be deleted while it belongs to a skill group.',
  },
  skillGroups: {
    loadFailed: 'Unable to load skill groups.',
    createFailed: 'Unable to create skill group.',
    updateFailed: 'Unable to update skill group.',
    deleteFailed: 'Unable to delete skill group.',
    deleteInUse: 'This skill group cannot be deleted while it is used in publications.',
    deleteConfirmation: (name: string) => `Are you sure you want to delete "${name}"?`,
  },
  skillGroupSkills: {
    loadFailed: 'Unable to load skills for this group.',
    addFailed: 'Unable to add skill to group.',
    removeFailed: 'Unable to remove skill from group.',
  },
  assetTexts: {
    loadFailed: 'Unable to load asset texts.',
    createFailed: 'Unable to create text.',
    updateFailed: 'Unable to update text.',
    deleteFailed: 'Unable to delete text.',
    usageCheckFailed: 'Unable to check whether this text is shared.',
  },
  collections: {
    loadFailed: 'Unable to load collections.',
    createFailed: 'Unable to create collection.',
    updateFailed: 'Unable to update collection.',
    deleteFailed: 'Unable to delete collection.',
    reorderFailed: 'Unable to change the order.',
    assetFailed: 'Unable to update the collection assets.',
    deleteConfirmation: (position: number, publication: string) => (
      `Are you sure you want to delete collection ${position} of "${publication}"? Its assets will stay in the gallery.`
    ),
  },
  catalog: {
    created: (itemLabel: string) => `${itemLabel} created successfully.`,
    deleted: (itemLabel: string) => `${itemLabel} deleted successfully.`,
  },
}