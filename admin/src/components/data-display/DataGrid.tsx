import { useState, type ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material'
import './data-grid.css'

const rowsPerPageOptions = [10, 20]

export type DataGridColumn<Row extends { id: number | string }> = {
  header: string
  field?: keyof Row
  className?: string
  render?: (row: Row) => ReactNode
}

type DataGridProps<Row extends { id: number | string }> = {
  columns: DataGridColumn<Row>[]
  rows: Row[]
  selectedRowId?: number | string | null
  onRowClick?: (row: Row) => void
}

function DataGrid<Row extends { id: number | string }>({
  columns,
  rows,
  selectedRowId = null,
  onRowClick,
}: DataGridProps<Row>) {
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: rowsPerPageOptions[0],
  })
  const { page, rowsPerPage } = pagination
  if (rows.length < 20 && rowsPerPage === 20) {
    setPagination({ page: 0, rowsPerPage: rowsPerPageOptions[0] })
  }
  const availableRowsPerPageOptions = rows.length >= 20
    ? rowsPerPageOptions
    : [rowsPerPageOptions[0]]
  const visibleRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  )

  return (
    <div className="data-grid-container">
      <TableContainer>
        <Table className="data-grid" size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.field ?? column.header)}
                  className={column.className}
                >
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'data-grid-selectable-row' : undefined}
                  hover={Boolean(onRowClick)}
                  selected={row.id === selectedRowId}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.field ?? column.header)}
                      className={column.className}
                    >
                      {column.render
                        ? column.render(row)
                        : column.field
                          ? String(row[column.field] ?? '')
                          : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="data-grid-empty" colSpan={columns.length}>
                  No data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > rowsPerPageOptions[0] && (
        <TablePagination
          component="div"
          className="data-grid-pagination"
          count={rows.length}
          page={page}
          onPageChange={(_event, nextPage) => {
            setPagination((current) => ({ ...current, page: nextPage }))
          }}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setPagination({
              page: 0,
              rowsPerPage: Number(event.target.value),
            })
          }}
          rowsPerPageOptions={availableRowsPerPageOptions}
        />
      )}
    </div>
  )
}

export default DataGrid