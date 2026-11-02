import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as backend from '../test/fake-skills-backend'
const { resetBackend } = backend
import Skills from './Skills'

vi.mock('../services/skills.service', async () => (await import('../test/fake-skills-backend')).skillsService)
vi.mock('../services/skill-groups.service', async () => (await import('../test/fake-skills-backend')).skillGroupsService)
vi.mock('../services/skill-group-skills.service', async () => (await import('../test/fake-skills-backend')).skillGroupSkillsService)

// Real HTTP latency: reads and writes resolve a few milliseconds late.
const slow = <T extends Record<string, (...args: never[]) => Promise<unknown>>>(service: T): T => (
  Object.fromEntries(Object.entries(service).map(([name, fn]) => [
    name,
    async (...args: never[]) => {
      await new Promise((resolve) => setTimeout(resolve, 15))
      return fn(...args)
    },
  ])) as T
)
Object.assign(backend.skillsService, slow({ ...backend.skillsService }))
Object.assign(backend.skillGroupsService, slow({ ...backend.skillGroupsService }))
Object.assign(backend.skillGroupSkillsService, slow({ ...backend.skillGroupSkillsService }))

describe('Skills page: adding a skill from the group editor', () => {
  beforeEach(() => resetBackend({
    skills: [{ id: 1, name: 'React', icon: null }, { id: 2, name: 'NestJS', icon: null }],
    groups: [{ id: 10, name: 'Frontend', description: null }],
    memberships: [],
  }))

  it('shows the skill as used and blocks its deletion when returning to the Skills tab', async () => {
    render(<Skills />)
    fireEvent.click(await screen.findByText('Frontend'))
    const manager = await screen.findByRole('region', { name: 'Manage skills in Frontend' })
    fireEvent.click(await within(manager).findByRole('button', { name: 'React' }))
    fireEvent.click(within(manager).getByRole('button', { name: 'Add selected skills' }))
    await waitFor(() => expect(
      within(screen.getByRole('region', { name: 'Manage skills in Frontend' }))
        .getAllByRole('button', { name: 'React' }),
    ).toHaveLength(1))

    fireEvent.click(screen.getByRole('tab', { name: 'Skills' }))

    const row = (await screen.findAllByText('React')).map((node) => node.closest('[role="row"], tr')).find(Boolean)!
    await waitFor(() => expect(
      (within(row as HTMLElement).getByRole('button', { name: 'Delete React' }) as HTMLButtonElement).disabled,
    ).toBe(true))
  })
})
