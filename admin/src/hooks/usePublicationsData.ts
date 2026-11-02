import { useMemo } from 'react'
import type { PublicationListData } from '../entities/publication'
import {
  getListClients,
  getListCollectionAssets,
  getListCollections,
  getListContexts,
  getListTags,
  getListTypes,
  getPublicationAssetRecords,
  getPublicationContextRecords,
  getPublicationRecords,
  getPublicationSkillGroupRecords,
  getPublicationTagRecords,
  getSkillGroupSkillRecords,
} from '../services/publications.service'
import useResource from './useResource'

const loadFailed = 'Could not load publications.'

// Every part of the list is its own resource, so a write only reloads the
// parts it affects, and all of them stay in sync with the other tabs.
function usePublicationsData() {
  const records = useResource('publications', getPublicationRecords, loadFailed)
  const contexts = useResource('contexts', getListContexts, loadFailed)
  const types = useResource('types', getListTypes, loadFailed)
  const clients = useResource('clients', getListClients, loadFailed)
  const tags = useResource('tags', getListTags, loadFailed)
  const publicationContexts = useResource('publicationContexts', getPublicationContextRecords, loadFailed)
  const publicationTags = useResource('publicationTags', getPublicationTagRecords, loadFailed)
  const publicationSkillGroups = useResource('publicationSkillGroups', getPublicationSkillGroupRecords, loadFailed)
  const skillGroupSkills = useResource('skillGroupSkills', getSkillGroupSkillRecords, loadFailed)
  const publicationAssets = useResource('publicationAssets', getPublicationAssetRecords, loadFailed)
  const collections = useResource('collections', getListCollections, loadFailed)
  const collectionAssets = useResource('collectionAssets', getListCollectionAssets, loadFailed)
  const parts = [
    records, contexts, types, clients, tags, publicationContexts, publicationTags,
    publicationSkillGroups, skillGroupSkills, publicationAssets, collections, collectionAssets,
  ]

  const data = useMemo<PublicationListData | null>(() => {
    if (
      !records.data || !contexts.data || !types.data || !clients.data || !tags.data
      || !publicationContexts.data || !publicationTags.data || !publicationSkillGroups.data
      || !skillGroupSkills.data || !publicationAssets.data || !collections.data
      || !collectionAssets.data
    ) {
      return null
    }

    return {
      ...records.data,
      contexts: contexts.data,
      types: types.data,
      clients: clients.data,
      tags: tags.data,
      publicationContexts: publicationContexts.data,
      publicationTags: publicationTags.data,
      publicationSkillGroups: publicationSkillGroups.data,
      skillGroupSkills: skillGroupSkills.data,
      publicationAssets: publicationAssets.data,
      collections: collections.data,
      collectionAssets: collectionAssets.data,
    }
  }, [
    records.data, contexts.data, types.data, clients.data, tags.data,
    publicationContexts.data, publicationTags.data, publicationSkillGroups.data,
    skillGroupSkills.data, publicationAssets.data, collections.data, collectionAssets.data,
  ])

  return {
    data,
    isLoading: parts.some((part) => part.isLoading),
    error: parts.find((part) => part.error)?.error ?? '',
    retry: () => parts.forEach((part) => {
      if (part.error) part.retry()
    }),
  }
}

export default usePublicationsData
