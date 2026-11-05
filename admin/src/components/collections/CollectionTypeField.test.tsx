import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CollectionTypeField from './CollectionTypeField'

describe('CollectionTypeField', () => {
  it('prompts to create a type without showing an empty dropdown', () => {
    render(
      <CollectionTypeField
        className="collection-type"
        onChange={vi.fn()}
        options={[]}
        value=""
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Collection type' })
    expect(input.getAttribute('placeholder')).toBe('Create new type')
    expect(screen.queryByRole('button')).toBeNull()

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Gallery' } })

    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
