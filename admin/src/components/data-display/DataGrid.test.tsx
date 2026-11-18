import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import DataGrid, { type DataGridColumn } from './DataGrid'

type Row = {
  id: number
  name: string
}

const columns: DataGridColumn<Row>[] = [
  { header: 'Name', field: 'name' },
]

const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_value, index) => ({
    id: index + 1,
    name: `Row ${index + 1}`,
  }))

describe('DataGrid pagination', () => {
  it('moves to the last valid page when rows shrink', () => {
    const { rerender } = render(<DataGrid columns={columns} rows={makeRows(35)} />)

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(screen.getByText('21–30 of 35')).toBeDefined()

    rerender(<DataGrid columns={columns} rows={makeRows(15)} />)

    expect(screen.getByText('11–15 of 15')).toBeDefined()
    expect(screen.getByText('Row 11')).toBeDefined()
  })

  it('returns to 10 rows per page when the 20-row option is unavailable', () => {
    const { rerender } = render(<DataGrid columns={columns} rows={makeRows(25)} />)
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: '20' }))
    expect(screen.getByText('1–20 of 25')).toBeDefined()

    rerender(<DataGrid columns={columns} rows={makeRows(19)} />)

    expect(screen.getByText('1–10 of 19')).toBeDefined()
  })

  it('continues to the next page after 20 rows shrink to 19', () => {
    const { rerender } = render(<DataGrid columns={columns} rows={makeRows(20)} />)
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: '20' }))

    rerender(<DataGrid columns={columns} rows={makeRows(19)} />)
    expect(screen.getByText('1–10 of 19')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))

    expect(screen.getByText('11–19 of 19')).toBeDefined()
    expect(screen.getByText('Row 11')).toBeDefined()
    expect(screen.getByText('Row 19')).toBeDefined()
  })

  it('keeps the page valid when all rows are removed', () => {
    const { rerender } = render(<DataGrid columns={columns} rows={makeRows(35)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))

    rerender(<DataGrid columns={columns} rows={[]} />)
    expect(screen.getByText('No data')).toBeDefined()

    rerender(<DataGrid columns={columns} rows={makeRows(15)} />)
    expect(screen.getByText('11–15 of 15')).toBeDefined()
    expect(screen.getByText('Row 11')).toBeDefined()
  })
})
