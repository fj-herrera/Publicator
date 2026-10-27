import { useEffect, useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import RoleCombobox from './RoleCombobox'
import type {
  Asset,
  CollectionAssetTarget,
  PublicationAssetTarget,
} from '../../entities/asset'
import {
  createAssetCollection,
  createPublicationAsset,
  getCollections,
  getPublications,
  uploadAssets,
} from '../../services/assets.service'
import { getErrorMessage } from '../../services/api-error'
import './asset-upload-form.css'

type AssociationKind = 'none' | 'publication' | 'collection'

interface AssetUploadFormProps {
  publicationRoles: string[]
  collectionRoles: string[]
  onCancel: () => void
  onComplete: (assets: Asset[]) => void
}

const acceptedExtensions = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
  'mp4', 'webm', 'mp3', 'wav', 'ogg', 'pdf',
])
const maxFileSize = 100 * 1024 * 1024
const acceptedFileTypes = '.svg,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.ogg,.mp4,.webm,.pdf'

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function validateFiles(files: File[]) {
  return files.filter((file) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    return acceptedExtensions.has(extension) && file.size <= maxFileSize
  })
}

function AssetUploadForm({
  publicationRoles,
  collectionRoles,
  onCancel,
  onComplete,
}: AssetUploadFormProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [associationKind, setAssociationKind] = useState<AssociationKind>('none')
  const [associationId, setAssociationId] = useState('')
  const [role, setRole] = useState('')
  const [publications, setPublications] = useState<PublicationAssetTarget[]>([])
  const [collections, setCollections] = useState<CollectionAssetTarget[]>([])
  const [isLoadingTargets, setIsLoadingTargets] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    Promise.all([getPublications(), getCollections()])
      .then(([loadedPublications, loadedCollections]) => {
        if (isCurrent) {
          setPublications(loadedPublications)
          setCollections(loadedCollections)
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(getErrorMessage(loadError, 'Could not load association options.'))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingTargets(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const roleOptions = associationKind === 'publication'
    ? publicationRoles
    : collectionRoles

  const addFiles = (selectedFiles: File[]) => {
    const acceptedFiles = validateFiles(selectedFiles)
    const rejectedFiles = selectedFiles.filter((file) => !acceptedFiles.includes(file))

    setFiles((currentFiles) => {
      const currentKeys = new Set(currentFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`))
      return [
        ...currentFiles,
        ...acceptedFiles.filter((file) => !currentKeys.has(`${file.name}:${file.size}:${file.lastModified}`)),
      ]
    })

    setError(rejectedFiles.length
      ? `Unsupported format or file larger than 100 MB: ${rejectedFiles.map((file) => file.name).join(', ')}`
      : '')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (files.length === 0) {
      setError('Select at least one file to upload.')
      return
    }

    if (associationKind !== 'none' && (!associationId || !role.trim())) {
      setError('Choose an association and a role, or select no association.')
      return
    }

    setIsSubmitting(true)

    try {
      const uploadedAssets = await uploadAssets(files)

      if (associationKind !== 'none' && associationId) {
        const associationResults = await Promise.allSettled(uploadedAssets.map((asset) => (
          associationKind === 'publication'
            ? createPublicationAsset(asset.id, Number(associationId), role.trim())
            : createAssetCollection(asset.id, Number(associationId), role.trim())
        )))
        const hasAssociationErrors = associationResults.some((result) => result.status === 'rejected')

        onComplete(uploadedAssets)
        setFiles([])

        if (hasAssociationErrors) {
          setError('Assets were uploaded, but one or more associations failed. The assets remain in the global gallery.')
          return
        }
      } else {
        onComplete(uploadedAssets)
      }

      onCancel()
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Could not upload assets.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="asset-upload-panel">
      <form className="asset-upload-form" onSubmit={handleSubmit}>
        <label
          className={`asset-upload-dropzone${isDragging ? ' asset-upload-dropzone-active' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsDragging(false)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            addFiles(Array.from(event.dataTransfer.files))
          }}
        >
          <input
            accept={acceptedFileTypes}
            className="asset-upload-file-input"
            multiple
            onChange={(event) => {
              addFiles(Array.from(event.currentTarget.files ?? []))
              event.currentTarget.value = ''
            }}
            ref={fileInput}
            type="file"
          />
          <CloudUploadOutlinedIcon aria-hidden="true" />
          <span><span className="asset-upload-open-link">Open</span> or drag and drop</span>
          <span className="asset-upload-hint">SVG, PNG, JPG, WebP, GIF, MP3, WAV, OGG, MP4, WebM, or PDF (max. 100 MB per file)</span>
        </label>

        <div className="asset-upload-fields">
          <div className="asset-upload-field">
            <label htmlFor="asset-association-kind">Association</label>
            <select
              id="asset-association-kind"
              onChange={(event) => {
                setAssociationKind(event.target.value as AssociationKind)
                setAssociationId('')
                setRole('')
              }}
              value={associationKind}
            >
              <option value="none">No association</option>
              <option value="publication">Publication</option>
              <option value="collection">Collection</option>
            </select>
            {associationKind !== 'none' && (
              <select
                id="asset-association-target"
                aria-label={`Select ${associationKind}`}
                disabled={isLoadingTargets}
                onChange={(event) => setAssociationId(event.target.value)}
                value={associationId}
              >
                <option value="">Select</option>
                {associationKind === 'publication'
                  ? publications.map((publication) => (
                    <option key={publication.id} value={publication.id}>
                      {publication.meta.title} ({publication.meta.slug})
                    </option>
                  ))
                  : collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.type} (#{collection.id})
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div className="asset-upload-field">
            <label htmlFor="asset-association-role">Type</label>
            <RoleCombobox
              id="asset-association-role"
              label="Type"
              options={roleOptions}
              onChange={setRole}
              disabled={associationKind === 'none'}
              value={role}
            />
          </div>
        </div>

        {files.length > 0 && (
          <ul className="asset-upload-file-list" aria-label="Selected files">
            {files.map((file) => (
              <li key={`${file.name}:${file.size}:${file.lastModified}`}>
                <InsertDriveFileOutlinedIcon aria-hidden="true" />
                <span className="asset-upload-file-name" title={file.name}>{file.name}</span>
                <span className="asset-upload-file-size">{formatFileSize(file.size)}</span>
                <button
                  aria-label={`Remove ${file.name}`}
                  className="asset-upload-remove-file"
                  onClick={() => setFiles((currentFiles) => currentFiles.filter((currentFile) => currentFile !== file))}
                  type="button"
                >
                  <CloseIcon aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="asset-upload-error" role="alert">{error}</p>}

        <div className="asset-upload-actions">
          <button className="asset-upload-cancel" onClick={onCancel} type="button">Cancel</button>
          <button
            className="asset-upload-submit"
            disabled={isSubmitting || (associationKind !== 'none' && isLoadingTargets)}
            type="submit"
          >
            {isSubmitting ? 'Uploading...' : `Upload ${files.length || ''} ${files.length === 1 ? 'asset' : 'assets'}`}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AssetUploadForm