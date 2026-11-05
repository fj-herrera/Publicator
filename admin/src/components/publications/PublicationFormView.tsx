import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Alert, Button, CircularProgress } from '@mui/material'
import usePublicationFormData from '../../hooks/usePublicationFormData'
import PublicationForm from './PublicationForm'
import {
  clearPublicationFormSession,
  getPublicationFormSession,
  savePublicationFormSession,
} from '../../services/publication-form-session'
import type { PublicationFormSession } from '../../services/publication-form-session'
import './publication-form.css'

type PublicationFormViewProps = {
  // null opens an empty form for a new publication.
  publicationId: number | null
  onClose: () => void
}

function PublicationFormView({ publicationId, onClose }: PublicationFormViewProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const returnState = location.state as {
    publicationCollectionReturn?: boolean
    createdCollectionId?: number
  } | null
  const [resume] = useState(() => (
    returnState?.publicationCollectionReturn ? getPublicationFormSession() : null
  ))
  const { data, isLoading, error } = usePublicationFormData(
    resume?.publicationId ?? publicationId,
  )

  useEffect(() => {
    if (resume) clearPublicationFormSession()
  }, [resume])

  if (isLoading) {
    return (
      <div className="publication-form-status" role="status">
        <CircularProgress size={28} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="publication-form-status">
        <Alert
          action={<Button color="inherit" onClick={onClose} size="small">Back</Button>}
          severity="error"
        >
          {error || 'Could not load the publication form.'}
        </Alert>
      </div>
    )
  }

  const resumedForm: PublicationFormSession | null = resume
    ? {
      ...resume,
      values: {
        ...resume.values,
        assets: {
          ...resume.values.assets,
          directAssets: data.initialValues.assets.directAssets,
          collectionIds: [...new Set([
            ...resume.values.assets.collectionIds,
            ...(returnState?.createdCollectionId ? [returnState.createdCollectionId] : []),
          ])].filter((id) => data.catalogs.collections.some((collection) => collection.id === id)),
        },
      },
    }
    : null

  const handleCreateCollection = (session: PublicationFormSession) => {
    savePublicationFormSession(session)
    navigate('/gallery', {
      state: {
        publicationCollectionFlow: {
          publicationId: session.publicationId,
          returnPath: location.pathname,
        },
      },
    })
  }

  const handleEditCollection = (session: PublicationFormSession, collectionId: number) => {
    savePublicationFormSession(session)
    navigate('/gallery', {
      state: {
        publicationCollectionEditFlow: {
          collectionId,
          returnPath: location.pathname,
        },
      },
    })
  }

  return (
    <PublicationForm
      data={data}
      onCancel={onClose}
      onCreateCollection={handleCreateCollection}
      onEditCollection={handleEditCollection}
      resume={resumedForm}
    />
  )
}

export default PublicationFormView
