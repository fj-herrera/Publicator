import { lazy, Suspense, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { PublicationTextFormat, PublicationTextRecord, PublicationTextValues } from '../../entities/publication-text'
import { getErrorMessage } from '../../services/api-error'
import {
  createPublicationText,
  deletePublicationText,
  updatePublicationText,
} from '../../services/publication-texts.service'
import RoleCombobox from '../assets/RoleCombobox'
import './publication-form.css'
import '@uiw/react-md-editor/markdown-editor.css'

const MDEditor = lazy(() => import('@uiw/react-md-editor'))

type PublicationTextsProps = {
  publicationId: number
  values: PublicationTextValues
  onValuesChange: (changes: Partial<PublicationTextValues>) => void
  completionError?: string
}

function getContent(values: PublicationTextValues): string {
  return values.format === 'PLAIN' ? values.plainContent : values.markdownContent
}

function PublicationTexts({
  publicationId,
  values,
  onValuesChange,
  completionError,
}: PublicationTextsProps) {
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingText, setDeletingText] = useState<PublicationTextRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const content = getContent(values)
  const visibleTexts = values.associations.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
  const changeContent = (nextContent: string) => {
    onValuesChange(values.format === 'PLAIN'
      ? { plainContent: nextContent }
      : { markdownContent: nextContent })
  }

  const resetEditor = () => {
    onValuesChange({
      textType: '',
      format: 'PLAIN',
      plainContent: '',
      markdownContent: '',
      editingAssociationId: null,
    })
    setError('')
  }

  const startEditing = (association: PublicationTextRecord) => {
    if (!association.text) return
    onValuesChange({
      textType: association.type,
      format: association.text.format,
      plainContent: association.text.format === 'PLAIN' ? association.text.text : '',
      markdownContent: association.text.format === 'MD' ? association.text.text : '',
      editingAssociationId: association.id,
    })
    setError('')
  }

  const save = async () => {
    const textType = values.textType.trim()
    if (!textType) {
      setError('Choose or enter a Text Type.')
      return
    }
    if (!content.trim()) {
      setError('Enter some text content.')
      return
    }

    setIsSaving(true)
    setError('')
    onValuesChange({ pendingOperation: true })
    const input = { type: textType, text: content, format: values.format }
    try {
      if (values.editingAssociationId === null) {
        const created = await createPublicationText({ publicationId, ...input })
        const nextAssociations = [...values.associations, created]
        onValuesChange({
          associations: nextAssociations,
          typeOptions: [...new Set([...values.typeOptions, textType])].sort(),
        })
        setPage(Math.max(0, Math.ceil(nextAssociations.length / rowsPerPage) - 1))
      } else {
        const updated = await updatePublicationText(values.editingAssociationId, input)
        onValuesChange({
          associations: values.associations.map((item) => (
            item.id === updated.id ? updated : item
          )),
          typeOptions: [...new Set([...values.typeOptions, textType])].sort(),
        })
      }
      resetEditor()
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Could not save this text.'))
    } finally {
      onValuesChange({ pendingOperation: false })
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingText) return
    setIsDeleting(true)
    setError('')
    onValuesChange({ pendingOperation: true })
    try {
      await deletePublicationText(deletingText.id)
      const remaining = values.associations.filter((item) => item.id !== deletingText.id)
      onValuesChange({
        associations: remaining,
        ...(values.editingAssociationId === deletingText.id ? {
          textType: '',
          format: 'PLAIN' as const,
          plainContent: '',
          markdownContent: '',
          editingAssociationId: null,
        } : {}),
      })
      setPage((current) => Math.min(current, Math.max(0, Math.ceil(remaining.length / rowsPerPage) - 1)))
      setDeletingText(null)
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Could not remove this text from the publication.'))
    } finally {
      onValuesChange({ pendingOperation: false })
      setIsDeleting(false)
    }
  }

  const formatLabel = (format: PublicationTextFormat) => (
    format === 'PLAIN' ? 'Plain Text' : 'MD'
  )

  return (
    <div className="publication-texts">
      <div className="publication-texts-editor">
        <div className="publication-texts-editor-toolbar">
          <div className="publication-texts-type-field">
            <label htmlFor="publication-text-type">Text Type</label>
            <RoleCombobox
              createLabel="Create new Text Type"
              id="publication-text-type"
              label="Text Type"
              onChange={(textType) => {
                onValuesChange({ textType })
                setError('')
              }}
              options={values.typeOptions}
              value={values.textType}
            />
          </div>
          <FormControl className="publication-text-format-control">
            <span className="publication-text-format-label">Text format</span>
            <RadioGroup
              aria-label="Text format"
              onChange={(_event, format) => onValuesChange({ format: format as PublicationTextFormat })}
              row
              value={values.format}
            >
              <FormControlLabel control={<Radio size="small" />} label="Plain text" value="PLAIN" />
              <FormControlLabel control={<Radio size="small" />} label="MD" value="MD" />
            </RadioGroup>
          </FormControl>
          <div className="publication-texts-editor-actions">
            <Button
              disabled={isSaving}
              onClick={() => void save()}
              variant="contained"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button disabled={isSaving} onClick={resetEditor} variant="outlined">
              Cancel
            </Button>
          </div>
        </div>

        {values.format === 'PLAIN' ? (
          <TextField
            className="publication-texts-plain-input"
            label="Text"
            multiline
            onChange={(event) => changeContent(event.target.value)}
            rows={5}
            value={values.plainContent}
          />
        ) : (
          <div className="publication-texts-markdown" data-color-mode="light">
            <Suspense fallback={<div className="publication-texts-markdown-loading" />}>
              <MDEditor
                data-color-mode="light"
                height={240}
                onChange={(next) => changeContent(next ?? '')}
                preview="live"
                value={values.markdownContent}
                visibleDragbar={false}
              />
            </Suspense>
          </div>
        )}
        {error && <Alert className="publication-texts-error" severity="error">{error}</Alert>}
        {completionError && (
          <Alert className="publication-texts-error" severity="error">{completionError}</Alert>
        )}
      </div>

      <div className="publication-texts-table-wrap">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell className="publication-text-type-column">Text type</TableCell>
              <TableCell className="publication-text-format-column">Format</TableCell>
              <TableCell>Content</TableCell>
              <TableCell className="publication-text-actions-column">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleTexts.map((association) => (
              <TableRow key={association.id}>
                <TableCell>{association.type}</TableCell>
                <TableCell>{association.text ? formatLabel(association.text.format) : 'Unavailable'}</TableCell>
                <TableCell>
                  <span className="publication-text-content" title={association.text?.text ?? ''}>
                    {association.text?.text ?? ''}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="data-grid-actions">
                    <Tooltip title="Edit text">
                      <IconButton
                        aria-label={`Edit ${association.type} text`}
                        disabled={!association.text}
                        onClick={() => startEditing(association)}
                      >
                        <EditIcon aria-hidden="true" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove this text from the publication">
                      <IconButton
                        aria-label={`Remove ${association.type} text`}
                        onClick={() => setDeletingText(association)}
                      >
                        <DeleteIcon aria-hidden="true" />
                      </IconButton>
                    </Tooltip>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {values.associations.length === 0 && (
              <TableRow>
                <TableCell className="publication-texts-empty" colSpan={4}>No texts associated.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={values.associations.length}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value))
            setPage(0)
          }}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </div>

      <Dialog
        aria-labelledby="delete-publication-text-title"
        onClose={() => !isDeleting && setDeletingText(null)}
        open={deletingText !== null}
      >
        <DialogTitle id="delete-publication-text-title">Remove text from Publication?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes the association only. The shared Text record will not be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setDeletingText(null)}>Cancel</Button>
          <Button color="error" disabled={isDeleting} onClick={() => void confirmDelete()} variant="contained">
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default PublicationTexts
