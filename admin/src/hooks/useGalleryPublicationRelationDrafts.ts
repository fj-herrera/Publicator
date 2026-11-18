import { useRef, useState } from 'react'
import type { PublicationRelationDraft } from '../components/assets/PublicationRelationDrafts'
import type { PublicationAssetRelation } from '../entities/asset'

function useGalleryPublicationRelationDrafts() {
  const [editedPublicationRoles, setEditedPublicationRoles] = useState<Record<number, string>>({})
  const [newPublicationRelations, setNewPublicationRelations] = useState<PublicationRelationDraft[]>([])
  const nextPublicationRelationKey = useRef(0)

  const initializePublicationRelationDrafts = (relations: PublicationAssetRelation[]) => {
    setEditedPublicationRoles(Object.fromEntries(
      relations.map((relation) => [relation.id, relation.role]),
    ))
    setNewPublicationRelations([])
  }

  const clearPublicationRelationDrafts = () => {
    setEditedPublicationRoles({})
    setNewPublicationRelations([])
  }

  const addPublicationRelationDraft = () => {
    const key = nextPublicationRelationKey.current++
    setNewPublicationRelations((currentRelations) => [
      ...currentRelations,
      { key, publicationId: '', role: '' },
    ])
  }

  const changePublicationRelationDraft = (
    key: number,
    changes: Partial<Omit<PublicationRelationDraft, 'key'>>,
  ) => setNewPublicationRelations((currentRelations) => (
    currentRelations.map((relation) => (
      relation.key === key ? { ...relation, ...changes } : relation
    ))
  ))

  const removePublicationRelationDraft = (key: number) => setNewPublicationRelations(
    (currentRelations) => currentRelations.filter((relation) => relation.key !== key),
  )

  const changePublicationRole = (relationId: number, value: string) => (
    setEditedPublicationRoles((currentRoles) => ({ ...currentRoles, [relationId]: value }))
  )

  return {
    editedPublicationRoles,
    setEditedPublicationRoles,
    newPublicationRelations,
    setNewPublicationRelations,
    initializePublicationRelationDrafts,
    clearPublicationRelationDrafts,
    addPublicationRelationDraft,
    changePublicationRelationDraft,
    removePublicationRelationDraft,
    changePublicationRole,
  }
}

export default useGalleryPublicationRelationDrafts
