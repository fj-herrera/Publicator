import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContextPublications from '../components/contexts/ContextPublications'
import useContextPublications from './useContextPublications'

type Link = { id: number; position: number; publication: { id: number }; context: { id: number } }

const backend = vi.hoisted(() => ({
  links: [] as Link[],
  failReorder: false,
  reorderCalls: [] as { contextId: number; ids: number[] }[],
}))

vi.mock('../services/publications.service', () => ({
  getPublicationContextRecords: async () => backend.links.map((link) => ({ ...link })),
  getPublicationRecords: async () => ({
    publications: [1, 2, 3, 4].map((id) => ({
      id,
      meta: { id, title: `Pub ${id}`, slug: `pub-${id}` },
    })),
    metas: [],
  }),
  // Mirrors the API: renumbers the context 1..n following `ids`.
  reorderPublicationContextsRequest: async (contextId: number, ids: number[]) => {
    backend.reorderCalls.push({ contextId, ids })
    if (backend.failReorder) throw new Error('boom')
    ids.forEach((id, index) => {
      const link = backend.links.find((item) => item.id === id)
      if (link) link.position = index + 1
    })
    return []
  },
}))

const seed = () => {
  backend.failReorder = false
  backend.reorderCalls = []
  backend.links = [
    { id: 11, position: 2, publication: { id: 2 }, context: { id: 1 } },
    { id: 10, position: 1, publication: { id: 1 }, context: { id: 1 } },
    { id: 12, position: 3, publication: { id: 3 }, context: { id: 1 } },
    { id: 20, position: 1, publication: { id: 4 }, context: { id: 2 } },
  ]
}

const titles = (rows: { title: string }[]) => rows.map((row) => row.title)

describe('Context publications order', () => {
  beforeEach(seed)

  it('lists only the publications of the context sorted by position', async () => {
    const { result } = renderHook(() => useContextPublications(1))
    await waitFor(() => expect(result.current.rows).toHaveLength(3))

    expect(titles(result.current.rows)).toEqual(['Pub 1', 'Pub 2', 'Pub 3'])
    expect(result.current.rows.map((row) => [row.isFirst, row.isLast])).toEqual([
      [true, false], [false, false], [false, true],
    ])
  })

  it('moving a row persists the new order and refreshes every mounted consumer', async () => {
    const editor = renderHook(() => useContextPublications(1))
    const otherTab = renderHook(() => useContextPublications(1))
    await waitFor(() => expect(editor.result.current.rows).toHaveLength(3))

    await act(async () => {
      await editor.result.current.move(editor.result.current.rows[0], 1)
    })

    expect(backend.reorderCalls).toEqual([{ contextId: 1, ids: [11, 10, 12] }])
    await waitFor(() => expect(titles(editor.result.current.rows)).toEqual(['Pub 2', 'Pub 1', 'Pub 3']))
    await waitFor(() => expect(titles(otherTab.result.current.rows)).toEqual(['Pub 2', 'Pub 1', 'Pub 3']))
  })

  it('leaves the other contexts untouched', async () => {
    const other = renderHook(() => useContextPublications(2))
    const editor = renderHook(() => useContextPublications(1))
    await waitFor(() => expect(editor.result.current.rows).toHaveLength(3))
    await waitFor(() => expect(other.result.current.rows).toHaveLength(1))

    await act(async () => {
      await editor.result.current.move(editor.result.current.rows[2], -1)
    })

    expect(backend.reorderCalls[0].contextId).toBe(1)
    expect(backend.links.find((link) => link.id === 20)?.position).toBe(1)
  })

  it('ignores moves past the first or last position', async () => {
    const { result } = renderHook(() => useContextPublications(1))
    await waitFor(() => expect(result.current.rows).toHaveLength(3))

    await act(async () => {
      await result.current.move(result.current.rows[0], -1)
      await result.current.move(result.current.rows[2], 1)
    })

    expect(backend.reorderCalls).toEqual([])
  })

  it('reports a failed reorder and keeps the current order', async () => {
    backend.failReorder = true
    const { result } = renderHook(() => useContextPublications(1))
    await waitFor(() => expect(result.current.rows).toHaveLength(3))

    await act(async () => {
      await result.current.move(result.current.rows[0], 1)
    })

    expect(result.current.error).toBe('boom')
    expect(titles(result.current.rows)).toEqual(['Pub 1', 'Pub 2', 'Pub 3'])
  })
})

describe('ContextPublications table', () => {
  beforeEach(seed)

  it('disables the first up arrow and last down arrow and reorders on click', async () => {
    render(<ContextPublications contextId={1} contextName="Work" />)
    const firstUp = await screen.findByRole('button', { name: 'Move Pub 1 1 of Work up' })
    expect((firstUp as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Move Pub 3 3 of Work down' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Move Pub 1 1 of Work down' }))

    const newFirstUp = await screen.findByRole('button', { name: 'Move Pub 2 1 of Work up' })
    expect((newFirstUp as HTMLButtonElement).disabled).toBe(true)
    expect(backend.reorderCalls).toEqual([{ contextId: 1, ids: [11, 10, 12] }])
  })

  it('closes the hovered tooltip after its row moves', async () => {
    render(<ContextPublications contextId={1} contextName="Work" />)
    const moveDown = await screen.findByRole('button', { name: 'Move Pub 1 1 of Work down' })

    fireEvent.mouseOver(moveDown)
    await screen.findByRole('tooltip')
    fireEvent.click(moveDown)

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull()
      expect(screen.getByRole('button', { name: 'Move Pub 1 2 of Work down' })).not.toBeNull()
    })
  })
})
