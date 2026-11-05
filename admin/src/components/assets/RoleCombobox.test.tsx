import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RoleCombobox from './RoleCombobox'

describe('RoleCombobox', () => {
  it('prompts to create a role without showing an empty dropdown', () => {
    render(
      <RoleCombobox
        id="role"
        label="Role"
        onChange={vi.fn()}
        options={[]}
        value=""
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Role' })
    expect(input.getAttribute('placeholder')).toBe('Create new role')
    expect(screen.queryByRole('button', { name: 'Show role options' })).toBeNull()

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Hero' } })

    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
