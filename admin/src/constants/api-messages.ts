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
  catalog: {
    created: (itemLabel: string) => `${itemLabel} created successfully.`,
    deleted: (itemLabel: string) => `${itemLabel} deleted successfully.`,
  },
}