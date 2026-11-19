import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import type { PublicationTextValues } from '../../entities/publication-text'
import { createEmptyFormValues } from './publication-form-utils'
import PublicationTexts from './PublicationTexts'

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('../../services/publication-texts.service', () => ({
  createPublicationText: mocks.create,
  updatePublicationText: mocks.update,
  deletePublicationText: mocks.remove,
}))

function Harness() {
  const [values, setValues] = useState<PublicationTextValues>(() => ({
    ...createEmptyFormValues().texts,
    textType: 'caption',
    plainContent: 'Text to save',
  }))
  return (
    <PublicationTexts
      publicationId={3}
      values={values}
      onValuesChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
    />
  )
}

describe('PublicationTexts save', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.create.mockResolvedValue({
      id: 8,
      type: 'caption',
      content: { publication: { id: 3 } },
      text: { id: 9, text: 'Text to save', format: 'PLAIN' },
    })
  })

  it('retains failed text for retry and displays the saved text after success', async () => {
    mocks.create.mockRejectedValueOnce(new Error('Text service unavailable'))
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Text service unavailable')
    expect(screen.getByRole<HTMLInputElement>('combobox', { name: 'Text Type' }).value).toBe('caption')
    expect(screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Text' }).value).toBe('Text to save')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(screen.getByText('Text to save')).toBeDefined()
    expect(mocks.create).toHaveBeenCalledTimes(2)
    expect(mocks.create).toHaveBeenCalledWith({
      publicationId: 3, type: 'caption', text: 'Text to save', format: 'PLAIN',
    })
  })
})
