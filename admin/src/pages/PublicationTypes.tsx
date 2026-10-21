import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, TextField } from '@mui/material'
import type { TypeRow } from '../Mooks.tsx'
import DataGrid, { type DataGridColumn } from '../components/DataGrid'
import ObjectChips from '../components/ObjectChips'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import './publication-types.css'

type PublicationTypesProps = {
  isCreateFormOpen: boolean
  onCreateFormClose: () => void
}

const typeColumns: DataGridColumn<TypeRow>[] = [
  { field: 'name', header: 'Name', className: 'data-grid-name-column' },
  {
    field: 'inPublications',
    header: 'In publications',
    className: 'data-grid-publications-column',
  },
  {
    header: 'Actions',
    className: 'data-grid-actions-column',
    render: () => (
      <span className="data-grid-actions" aria-label="Row actions">
        <EditIcon aria-hidden="true" />
        <DeleteIcon aria-hidden="true" />
      </span>
    ),
  },
]

async function getApiMessage(response: Response): Promise<string> {
  const errorBody = await response.json().catch(() => null) as {
    message?: unknown
  } | null

  if (typeof errorBody?.message === 'string') {
    return errorBody.message
  }

  if (
    Array.isArray(errorBody?.message) &&
    errorBody.message.every((message): message is string => typeof message === 'string')
  ) {
    return errorBody.message.join(', ')
  }

  return ''
}

function PublicationTypes({
  isCreateFormOpen,
  onCreateFormClose,
}: PublicationTypesProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [types, setTypes] = useState<TypeRow[]>([])
  const [isTypesLoading, setIsTypesLoading] = useState(true)
  const [typeError, setTypeError] = useState('')
  const [typeName, setTypeName] = useState('New Type')
  const visibleTypes = selectedTypeId === null
    ? types
    : types.filter((type) => type.id === selectedTypeId)

  useEffect(() => {
    let isCurrent = true

    const loadTypes = async () => {
      try {
        const response = await fetch('/api/types')

        if (!response.ok) {
          const apiMessage = await getApiMessage(response)
          if (isCurrent && apiMessage) {
            setTypeError(apiMessage)
          }
          return
        }

        const loadedTypes = await response.json() as TypeRow[]
        if (isCurrent) {
          setTypes(loadedTypes)
          setTypeError('')
        }
      } catch (error) {
        if (isCurrent) {
          console.error(error)
        }
      } finally {
        if (isCurrent) {
          setIsTypesLoading(false)
        }
      }
    }

    void loadTypes()

    return () => {
      isCurrent = false
    }
  }, [])

  const handleSaveType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = typeName.trim()

    if (!name) {
      return
    }

    setTypeError('')

    try {
      const response = await fetch('/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const apiMessage = await getApiMessage(response)
        if (apiMessage) {
          setTypeError(apiMessage)
        }
        return
      }

      const createdType = await response.json() as Omit<TypeRow, 'inPublications'>
      setTypes((currentTypes) => [
        ...currentTypes,
        { ...createdType, inPublications: 0 },
      ])
      setSelectedTypeId(null)
      setTypeName('New Type')
      setTypeError('')
      onCreateFormClose()
    } catch (error) {
      console.error(error)
    }
  }

  const handleCancel = () => {
    setTypeName('New Type')
    setTypeError('')
    onCreateFormClose()
  }

  return (
    <>
      {isCreateFormOpen ? (
        <>
          {typeError && <Alert className="type-api-error" severity="error">{typeError}</Alert>}
          <form className="type-create-form" onSubmit={handleSaveType}>
            <TextField
              className="type-create-name"
              label="Name"
              required
              value={typeName}
              onChange={(event) => setTypeName(event.target.value)}
            />
            <div className="type-create-actions">
              <Button
                className="type-create-save"
                type="submit"
                variant="contained"
                startIcon={<CheckIcon />}
              >
                Save
              </Button>
              <Button
                className="type-create-cancel"
                type="button"
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </>
      ) : (
        <>
          {typeError && <Alert className="type-api-error" severity="error">{typeError}</Alert>}
          {!isTypesLoading && !typeError && types.length > 0 && (
            <>
              <ObjectChips
                items={types.map(({ id, name }) => ({ id, label: name }))}
                selectedId={selectedTypeId}
                onSelect={(id) => {
                  setSelectedTypeId((currentId) =>
                    currentId === id ? null : Number(id),
                  )
                }}
              />
              <DataGrid<TypeRow>
                key={selectedTypeId ?? 'all-types'}
                columns={typeColumns}
                rows={visibleTypes}
                selectedRowId={selectedTypeId}
                onRowClick={(row) => {
                  setSelectedTypeId((currentId) =>
                    currentId === row.id ? null : row.id,
                  )
                }}
              />
            </>
          )}
        </>
      )}
    </>
  )
}

export default PublicationTypes