import { chmod, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BadRequestException, Logger } from '@nestjs/common'
import type { DataSource, EntityManager } from 'typeorm'
import { MediaStorageService } from './media-storage.service.js'

const storage = vi.hoisted(() => ({ directory: '' }))

vi.mock('./local-media-storage.js', () => ({
  get mediaDirectory() {
    return storage.directory
  },
}))

describe('MediaStorageService', () => {
  let service: MediaStorageService
  let references: { clients: number; skills: number; assets: number }
  let manager: {
    countBy: ReturnType<typeof vi.fn>
    query: ReturnType<typeof vi.fn>
  }
  let dataSource: { transaction: ReturnType<typeof vi.fn> }
  let errorLog: ReturnType<typeof vi.spyOn>
  let warnLog: ReturnType<typeof vi.spyOn>

  const files = (folder: string) => readdir(join(storage.directory, folder))
  const clientLogo = '/media/clients/logo.png'

  beforeEach(async () => {
    storage.directory = await mkdtemp(join(tmpdir(), 'publicator-media-'))
    await mkdir(join(storage.directory, 'clients'), { recursive: true })
    await mkdir(join(storage.directory, 'skills'), { recursive: true })
    await mkdir(join(storage.directory, 'skills', 'icons'), { recursive: true })
    await writeFile(join(storage.directory, 'clients', 'logo.png'), 'logo')
    await writeFile(join(storage.directory, 'skills', 'skill.svg'), 'skill')
    await writeFile(join(storage.directory, 'skills', 'icons', 'icon.svg'), 'icon')

    references = { clients: 0, skills: 0, assets: 0 }
    manager = {
      countBy: vi.fn(async (entity: { name: string }) => {
        if (entity.name === 'Client') return references.clients
        if (entity.name === 'Skill') return references.skills
        return references.assets
      }),
      query: vi.fn().mockResolvedValue([]),
    }
    dataSource = { transaction: vi.fn((callback) => callback(manager)) }
    errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    warnLog = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    service = new MediaStorageService(dataSource as unknown as DataSource)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await chmod(join(storage.directory, 'clients'), 0o755)
    await rm(storage.directory, { recursive: true, force: true })
  })

  describe('resolveFilePath', () => {
    it.each([
      ['https://example.test/media/clients/logo.png', 'clients'],
      ['/assets/logo.png', 'clients'],
      ['/media/skills/icons/icon.svg', 'clients'],
      ['/media/clients/../secret.png', 'clients'],
      ['/media/clients/..', 'clients'],
      ['/media/clients/.', 'clients'],
      ['/media/clients/nested/logo.png', 'clients'],
      ['/media/clients/..\\secret.png', 'clients'],
      ['/media/clients/a\\b.png', 'clients'],
      ['/media/clients/a\0b.png', 'clients'],
      ['/media/clients/\0', 'clients'],
      ['/media/clients/', 'clients'],
      [null, 'clients'],
      [undefined, 'clients'],
    ] as const)('does not resolve %j in %s', (url, folder) => {
      expect(service.resolveFilePath(url, folder)).toBeNull()
    })

    it('resolves stored files inside their media folder', () => {
      expect(service.resolveFilePath('/media/skills/skill.svg', 'skills')).toBe(
        join(storage.directory, 'skills', 'skill.svg'),
      )
      expect(service.resolveFilePath('/media/skills/icons/icon.svg', 'skills/icons')).toBe(
        join(storage.directory, 'skills', 'icons', 'icon.svg'),
      )
    })

    it('treats percent-encoded traversal as a literal filename', () => {
      expect(service.resolveFilePath('/media/clients/%2e%2e%2fx.png', 'clients')).toBe(
        join(storage.directory, 'clients', '%2e%2e%2fx.png'),
      )
    })
  })

  describe('assertAssignable', () => {
    const assign = (url: string | null | undefined, folder: 'clients' | 'skills' | 'skills/icons' = 'clients') =>
      service.assertAssignable(url, folder, manager as unknown as EntityManager)

    it('locks the URL and accepts an existing file', async () => {
      await expect(assign(clientLogo)).resolves.toBeUndefined()

      expect(manager.query).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('pg_advisory_xact_lock'),
        [clientLogo],
      )
    })

    it('takes the lock before checking that the file exists', async () => {
      const order: string[] = []
      manager.query.mockImplementation(async () => {
        order.push('lock')
        await rm(join(storage.directory, 'clients', 'logo.png'))
        return []
      })

      await expect(assign(clientLogo)).rejects.toBeInstanceOf(BadRequestException)
      expect(order).toEqual(['lock'])
    })

    it.each([
      ['a missing file', '/media/clients/missing.png'],
      ['a file in another folder', '/media/skills/icons/icon.svg'],
      ['path traversal', '/media/clients/../x.png'],
      ['a null byte', '/media/clients/a\0b.png'],
      ['a nested path', '/media/clients/a/b.png'],
    ])('rejects %s', async (_name, url) => {
      await expect(assign(url)).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rejects a directory', async () => {
      await mkdir(join(storage.directory, 'clients', 'folder'))

      await expect(assign('/media/clients/folder')).rejects.toBeInstanceOf(BadRequestException)
    })

    it('does not lock or touch the disk for null, external URLs and plain paths', async () => {
      await assign(null)
      await assign(undefined)
      await assign('https://example.test/media/clients/x.png')
      await assign('/assets/logo.png')

      expect(manager.query).not.toHaveBeenCalled()
    })

    it('propagates file system errors other than a missing file', async () => {
      await chmod(join(storage.directory, 'clients'), 0o000)

      if (process.getuid?.() === 0) return
      await expect(assign(clientLogo)).rejects.not.toBeInstanceOf(BadRequestException)
    })
  })

  describe('deleteUnreferencedFiles', () => {
    it('locks the URL, rechecks references and deletes an unreferenced file', async () => {
      await service.deleteUnreferencedFiles([{ url: clientLogo, folder: 'clients' }])

      expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('pg_advisory_xact_lock'), [clientLogo])
      expect(manager.query.mock.invocationCallOrder[0]).toBeLessThan(
        manager.countBy.mock.invocationCallOrder[0],
      )
      await expect(files('clients')).resolves.toEqual([])
      expect(errorLog).not.toHaveBeenCalled()
    })

    it.each([
      ['a client', { clients: 1, skills: 0, assets: 0 }],
      ['a skill', { clients: 0, skills: 1, assets: 0 }],
      ['an asset', { clients: 0, skills: 0, assets: 1 }],
    ])('keeps a file still referenced by %s', async (_name, counts) => {
      references = counts

      await service.deleteUnreferencedFiles([{ url: clientLogo, folder: 'clients' }])

      await expect(files('clients')).resolves.toEqual(['logo.png'])
    })

    it('ignores an already missing file without logging', async () => {
      await service.deleteUnreferencedFiles([{ url: '/media/clients/missing.png', folder: 'clients' }])

      expect(errorLog).not.toHaveBeenCalled()
    })

    it('does not touch the database for external or non-media URLs', async () => {
      await service.deleteUnreferencedFiles([
        { url: 'https://example.test/logo.png', folder: 'clients' },
        { url: '/assets/logo.png', folder: 'clients' },
      ])

      expect(dataSource.transaction).not.toHaveBeenCalled()
      expect(warnLog).not.toHaveBeenCalled()
      await expect(files('clients')).resolves.toEqual(['logo.png'])
    })

    it.each(['/media/clients/../x', '/media/clients/a\0b', '/media/clients/a/b'])(
      'warns about the invalid managed path %j and deletes nothing',
      async (url) => {
        await service.deleteUnreferencedFiles([{ url, folder: 'clients' }])

        expect(warnLog).toHaveBeenCalledWith(expect.stringContaining('INVALID_MEDIA_PATH'))
        expect(dataSource.transaction).not.toHaveBeenCalled()
        await expect(files('clients')).resolves.toEqual(['logo.png'])
      },
    )

    it('logs an identifiable orphan instead of throwing when the path is a directory', async () => {
      await mkdir(join(storage.directory, 'clients', 'folder'))

      await expect(
        service.deleteUnreferencedFiles([{ url: '/media/clients/folder', folder: 'clients' }]),
      ).resolves.toBeUndefined()

      expect(errorLog).toHaveBeenCalledWith(
        expect.stringMatching(/ORPHANED_MEDIA_FILE url=\/media\/clients\/folder folder=clients code=(EISDIR|EPERM)/),
      )
    })

    it.skipIf(process.getuid?.() === 0)('logs an orphan on EACCES and keeps going', async () => {
      await chmod(join(storage.directory, 'clients'), 0o555)

      await expect(
        service.deleteUnreferencedFiles([{ url: clientLogo, folder: 'clients' }]),
      ).resolves.toBeUndefined()

      expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('code=EACCES'))
    })

    it('logs an orphan when the cleanup transaction itself fails', async () => {
      dataSource.transaction.mockRejectedValue(
        Object.assign(new Error('connection lost'), { code: 'ECONNRESET' }),
      )

      await expect(
        service.deleteUnreferencedFiles([{ url: clientLogo, folder: 'clients' }]),
      ).resolves.toBeUndefined()

      expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('ORPHANED_MEDIA_FILE'))
      await expect(files('clients')).resolves.toEqual(['logo.png'])
    })

    it('continues with the remaining files after a failure and deduplicates URLs', async () => {
      await mkdir(join(storage.directory, 'clients', 'folder'))

      await service.deleteUnreferencedFiles([
        { url: '/media/clients/folder', folder: 'clients' },
        { url: '/media/skills/icons/icon.svg', folder: 'skills/icons' },
        { url: '/media/skills/icons/icon.svg', folder: 'skills/icons' },
      ])

      expect(errorLog).toHaveBeenCalledTimes(1)
      expect(dataSource.transaction).toHaveBeenCalledTimes(2)
      await expect(files('skills/icons')).resolves.toEqual([])
    })

    it('does nothing for an empty list', async () => {
      await service.deleteUnreferencedFiles([])

      expect(dataSource.transaction).not.toHaveBeenCalled()
    })
  })

  describe('concurrency with a writer assigning the same URL', () => {
    // Fake advisory lock: callers of query() on the same URL are serialized until their
    // "transaction" finishes, like pg_advisory_xact_lock.
    const locks = new Map<string, Promise<void>>()
    const transactionWithLocks = async (callback: (m: unknown) => Promise<unknown>) => {
      const held: string[] = []
      let release!: () => void
      const done = new Promise<void>((resolve) => { release = resolve })
      const txManager = {
        ...manager,
        query: async (_sql: string, [url]: string[]) => {
          await locks.get(url)
          locks.set(url, done)
          held.push(url)
        },
      }
      try {
        return await callback(txManager)
      } finally {
        release()
        for (const url of held) {
          if (locks.get(url) === done) locks.delete(url)
        }
      }
    }

    it('keeps the file when a writer commits a new reference while cleanup waits for the lock', async () => {
      dataSource.transaction.mockImplementation(transactionWithLocks)

      let commitAssignment!: () => void
      const assignment = transactionWithLocks(async (txManager) => {
        await service.assertAssignable(clientLogo, 'clients', txManager as EntityManager)
        await new Promise<void>((resolve) => { commitAssignment = resolve })
        references.clients = 1
      })
      await vi.waitFor(() => expect(commitAssignment).toBeDefined())

      const cleanup = service.deleteUnreferencedFiles([{ url: clientLogo, folder: 'clients' }])
      await new Promise((resolve) => setTimeout(resolve, 20))
      await expect(files('clients')).resolves.toEqual(['logo.png'])

      commitAssignment()
      await assignment
      await cleanup

      await expect(files('clients')).resolves.toEqual(['logo.png'])
    })
  })
})
