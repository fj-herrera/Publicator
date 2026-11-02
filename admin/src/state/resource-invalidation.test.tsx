import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  getResourceVersion,
  invalidate,
  invalidateDeleted,
  subscribeToInvalidations,
  useResourceVersion,
  type ResourceName,
} from './resource-invalidation'

function VersionProbe({ resource, onRender }: { resource: ResourceName; onRender: () => void }) {
  const version = useResourceVersion(resource)
  onRender()
  return <span data-testid={resource}>{version}</span>
}

describe('resource invalidation store', () => {
  it('increments the version of the invalidated resource', () => {
    const before = getResourceVersion('skills')

    invalidate('skills')

    expect(getResourceVersion('skills')).toBe(before + 1)
  })

  it('also invalidates the resources derived from it', () => {
    const before = {
      skills: getResourceVersion('skills'),
      skillGroups: getResourceVersion('skillGroups'),
      skillGroupSkills: getResourceVersion('skillGroupSkills'),
    }

    invalidate('skillGroups')

    expect(getResourceVersion('skillGroups')).toBe(before.skillGroups + 1)
    expect(getResourceVersion('skills')).toBe(before.skills + 1)
    expect(getResourceVersion('skillGroupSkills')).toBe(before.skillGroupSkills + 1)
  })

  it('notifies subscribers once per call and stops after unsubscribing', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToInvalidations(listener)

    invalidate('skills', 'skillGroups')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    invalidate('skills')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('re-renders every component that reads the resource', () => {
    const renders = [vi.fn(), vi.fn()]
    const view = render(
      <>
        <VersionProbe onRender={renders[0]} resource="skills" />
        <VersionProbe onRender={renders[1]} resource="skills" />
      </>,
    )
    const before = getResourceVersion('skills')

    act(() => invalidate('skills'))

    const shown = view.getAllByTestId('skills').map((element) => element.textContent)
    expect(shown).toEqual([String(before + 1), String(before + 1)])
    expect(renders[0]).toHaveBeenCalledTimes(2)
    expect(renders[1]).toHaveBeenCalledTimes(2)
  })
})

describe('dependency map for the rest of the Admin', () => {
  const bump = (resource: ResourceName, expected: ResourceName[]) => {
    const names: ResourceName[] = [
      'publications', 'publicationContexts', 'publicationTags', 'publicationSkillGroups',
      'publicationAssets', 'types', 'tags', 'contexts', 'clients', 'assets', 'assetTexts',
      'collections', 'collectionAssets',
    ]
    const before = Object.fromEntries(names.map((name) => [name, getResourceVersion(name)]))
    invalidate(resource)
    const changed = names.filter((name) => getResourceVersion(name) !== before[name])
    expect(changed.sort()).toEqual([resource, ...expected].sort())
  }

  it.each([
    ['types', ['publications']],
    ['tags', ['publicationTags']],
    ['contexts', ['publicationContexts']],
    ['clients', ['publications', 'collections']],
    ['assets', ['publicationAssets', 'collectionAssets']],
    ['assetTexts', []],
    ['collections', ['collectionAssets']],
    ['publications', ['types', 'clients', 'publicationAssets', 'collections']],
  ] as [ResourceName, ResourceName[]][])('invalidating %s reloads only %j besides itself', bump)

  it('a deletion also invalidates what the API removes in cascade', () => {
    const names: ResourceName[] = [
      'publicationContexts', 'publicationTags', 'publicationSkillGroups', 'collectionAssets',
    ]
    const before = names.map((name) => getResourceVersion(name))

    invalidateDeleted('publications')

    names.forEach((name, index) => expect(getResourceVersion(name)).toBe(before[index] + 1))
  })
})
