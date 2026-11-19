import { afterEach, describe, expect, it, vi } from 'vitest'
import * as assets from './assets.service'
import * as clients from './clients.service'
import * as contexts from './contexts.service'
import * as groups from './skill-groups.service'
import * as groupSkills from './skill-group-skills.service'
import * as tags from './publication-tags.service'
import * as skills from './skills.service'
import * as types from './types.service'

const skill = { name: 'Skill', icon: null }
const client = { name: 'Client', logo: null }
const group = { name: 'Group', description: null }
const json = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
const del = { method: 'DELETE' }

const requests = [
  { run: () => assets.getAssets(), path: '/api/assets', fallback: 'Could not load assets.' },
  { run: () => assets.getPublicationAssets(), path: '/api/publication-assets', fallback: 'Could not load publication relations.' },
  { run: () => assets.getAssetCollections(), path: '/api/asset-collections', fallback: 'Could not load collection relations.' },
  { run: () => assets.getPublications(), path: '/api/publications', fallback: 'Could not load publications.' },
  { run: () => assets.getCollections(), path: '/api/collections', fallback: 'Could not load collections.' },
  { run: () => assets.updateAssetName(7, 'name'), path: '/api/assets/7', init: json('PATCH', { name: 'name' }), fallback: 'Could not update asset.' },
  { run: () => assets.updatePublicationAssetRole(7, 'cover'), path: '/api/publication-assets/7', init: json('PATCH', { role: 'cover' }), fallback: 'Could not update publication asset role.' },
  { run: () => assets.createPublicationAsset(1, 2, 'cover'), path: '/api/publication-assets', init: json('POST', { assetId: 1, publicationId: 2, role: 'cover' }), fallback: 'Could not associate asset with publication.' },
  { run: () => assets.createAssetCollection(1, 2, 'cover'), path: '/api/asset-collections', init: json('POST', { assetId: 1, collectionId: 2, role: 'cover' }), fallback: 'Could not associate asset with collection.' },
  { run: () => assets.deleteAsset(7), path: '/api/assets/7', init: del, fallback: 'Could not delete asset.', isVoid: true },
  { run: () => clients.getClients(), path: '/api/clients', fallback: 'Unable to load clients.' },
  { run: () => clients.createClientRequest(client), path: '/api/clients', init: json('POST', client), fallback: 'Unable to create client.' },
  { run: () => clients.updateClientRequest(7, client), path: '/api/clients/7', init: json('PATCH', client), fallback: 'Unable to update client.' },
  { run: () => clients.deleteClientRequest(7), path: '/api/clients/7', init: del, fallback: 'Unable to delete client.', isVoid: true },
  { run: () => contexts.getContexts(), path: '/api/contexts', fallback: 'Unable to load contexts.' },
  { run: () => contexts.createContextRequest('name'), path: '/api/contexts', init: json('POST', { name: 'name' }), fallback: 'Unable to create context.' },
  { run: () => contexts.updateContextRequest(7, 'name'), path: '/api/contexts/7', init: json('PATCH', { name: 'name' }), fallback: 'Unable to update context.' },
  { run: () => contexts.deleteContextRequest(7), path: '/api/contexts/7', init: del, fallback: 'Unable to delete context.', isVoid: true },
  { run: () => groups.getSkillGroups(), path: '/api/skill-groups', fallback: 'Unable to load skill groups.' },
  { run: () => groups.createSkillGroupRequest(group), path: '/api/skill-groups', init: json('POST', group), fallback: 'Unable to create skill group.' },
  { run: () => groups.updateSkillGroupRequest(7, group), path: '/api/skill-groups/7', init: json('PATCH', group), fallback: 'Unable to update skill group.' },
  { run: () => groups.deleteSkillGroupRequest(7), path: '/api/skill-groups/7', init: del, fallback: 'Unable to delete skill group.', isVoid: true },
  { run: () => groupSkills.getSkillGroupSkills(), path: '/api/skill-group-skills', fallback: 'Unable to load skills for this group.' },
  { run: () => groupSkills.addSkillToGroupRequest(1, 2), path: '/api/skill-group-skills', init: json('POST', { skillGroupId: 1, skillId: 2 }), fallback: 'Unable to add skill to group.' },
  { run: () => groupSkills.removeSkillFromGroupRequest(7), path: '/api/skill-group-skills/7', init: del, fallback: 'Unable to remove skill from group.', isVoid: true },
  { run: () => tags.getPublicationTags(), path: '/api/tags', fallback: 'Unable to load tags.' },
  { run: () => tags.createPublicationTag('name'), path: '/api/tags', init: json('POST', { name: 'name' }), fallback: 'Unable to create tag.' },
  { run: () => tags.updatePublicationTag(7, 'name'), path: '/api/tags/7', init: json('PATCH', { name: 'name' }), fallback: 'Unable to update tag.' },
  { run: () => tags.deletePublicationTag(7), path: '/api/tags/7', init: del, fallback: 'Unable to delete tag.', isVoid: true },
  { run: () => skills.getSkills(), path: '/api/skills', fallback: 'Unable to load skills.' },
  { run: () => skills.createSkillRequest(skill), path: '/api/skills', init: json('POST', skill), fallback: 'Unable to create skill.' },
  { run: () => skills.updateSkillRequest(7, skill), path: '/api/skills/7', init: json('PATCH', skill), fallback: 'Unable to update skill.' },
  { run: () => skills.deleteSkillRequest(7), path: '/api/skills/7', init: del, fallback: 'Unable to delete skill.', isVoid: true },
  { run: () => types.getTypes(), path: '/api/types', fallback: 'Unable to load types.' },
  { run: () => types.createTypeRequest('name'), path: '/api/types', init: json('POST', { name: 'name' }), fallback: 'Unable to create type.' },
  { run: () => types.updateTypeRequest(7, 'name'), path: '/api/types/7', init: json('PATCH', { name: 'name' }), fallback: 'Unable to update type.' },
  { run: () => types.deleteTypeRequest(7), path: '/api/types/7', init: del, fallback: 'Unable to delete type.', isVoid: true },
]

describe('service HTTP contracts', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each(requests)('preserves the request, response and fallback for $path', async ({ run, path, init, fallback, isVoid }) => {
    const body = { id: 7 }
    const readJson = vi.fn().mockResolvedValue(body)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: isVoid ? 204 : 200, json: readJson })
      .mockResolvedValueOnce({ ok: false, json: vi.fn().mockRejectedValue(new SyntaxError()) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(run()).resolves.toEqual(isVoid ? undefined : body)
    expect(fetchMock).toHaveBeenCalledWith(path, init)
    expect(readJson).toHaveBeenCalledTimes(isVoid ? 0 : 1)
    await expect(run()).rejects.toThrow(fallback)
  })

  it('preserves server error details and network errors', async () => {
    const networkError = new TypeError('Network unavailable')
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: ['First detail', 'Second detail'] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Specific association error' }) })
      .mockRejectedValueOnce(networkError))

    await expect(assets.getAssets()).rejects.toThrow('First detail, Second detail')
    await expect(assets.createPublicationAsset(1, 2, 'cover')).rejects.toThrow('Specific association error')
    await expect(assets.getAssets()).rejects.toBe(networkError)
  })

  it.each([
    { path: '/api/media/assets', field: 'files', fallback: 'Could not upload assets.', run: (files: File[]) => assets.uploadAssets(files), result: [{ id: 1 }] },
    { path: '/api/media/skills', field: 'file', fallback: 'Unable to upload skill icon.', run: (files: File[]) => skills.uploadSkillIcon(files[0]), result: '/uploaded' },
    { path: '/api/media/clients/logos', field: 'file', fallback: 'Unable to upload client logo.', run: (files: File[]) => clients.uploadClientLogo(files[0]), result: '/uploaded' },
  ])('sends multipart data without setting Content-Type for $path', async ({ path, field, fallback, run, result }) => {
    const files = [new File(['first'], 'first.png'), new File(['second'], 'second.png')]
    const response = field === 'files' ? result : { url: '/uploaded' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response })
      .mockResolvedValueOnce({ ok: false, json: async () => { throw new SyntaxError() } })
    vi.stubGlobal('fetch', fetchMock)

    await expect(run(files)).resolves.toEqual(result)
    const [calledPath, init] = fetchMock.mock.calls[0]
    expect(calledPath).toBe(path)
    expect(init.method).toBe('POST')
    expect(init.headers).toBeUndefined()
    expect(init.body).toBeInstanceOf(FormData)
    expect(init.body.getAll(field)).toEqual(field === 'files' ? files : [files[0]])
    await expect(run(files)).rejects.toThrow(fallback)
  })
})
