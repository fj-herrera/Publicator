import { Alert, IconButton, Tooltip } from '@mui/material'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import useContextPublications, { type ContextPublicationRow } from '../../hooks/useContextPublications'
import DataGrid, { type DataGridColumn } from '../data-display/DataGrid'
import './contexts.css'

type ContextPublicationsProps = {
  contextId: number
  contextName: string
}

function ContextPublications({ contextId, contextName }: ContextPublicationsProps) {
  const { rows, isLoading, error, isMoving, move } = useContextPublications(contextId)
  const label = (row: ContextPublicationRow) => `${row.title} ${row.position} of ${contextName}`

  const columns: DataGridColumn<ContextPublicationRow>[] = [
    { field: 'position', header: 'Position', className: 'context-publication-position-column' },
    { field: 'title', header: 'Publication' },
    { field: 'slug', header: 'Slug' },
    {
      header: 'Order',
      className: 'data-grid-actions-column',
      render: (row) => (
        <span className="data-grid-actions">
          <Tooltip key={`up-${row.position}`} title="Move up">
            <span>
              <IconButton
                aria-label={`Move ${label(row)} up`}
                disabled={row.isFirst || isMoving}
                onClick={() => move(row, -1)}
              >
                <ArrowUpwardIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip key={`down-${row.position}`} title="Move down">
            <span>
              <IconButton
                aria-label={`Move ${label(row)} down`}
                disabled={row.isLast || isMoving}
                onClick={() => move(row, 1)}
              >
                <ArrowDownwardIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
        </span>
      ),
    },
  ]

  return (
    <section className="context-publications" aria-label={`Publications of ${contextName}`}>
      <h3 className="context-publications-title">Publications in {contextName}</h3>
      {error && <Alert severity="error">{error}</Alert>}
      {!isLoading && rows.length === 0 && !error ? (
        <p className="context-publications-empty">This context has no publications.</p>
      ) : (
        !isLoading && <DataGrid<ContextPublicationRow> columns={columns} rows={rows} />
      )}
    </section>
  )
}

export default ContextPublications
