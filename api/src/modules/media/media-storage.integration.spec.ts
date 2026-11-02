/// <reference types="vite/client" />
import 'reflect-metadata'
import { chmod, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { AssetService } from '../asset/asset.service.js'
import { Asset } from '../asset/entities/asset.entity.js'
import { ClientService } from '../client/client.service.js'
import { Client } from '../client/entities/client.entity.js'
import { Skill } from '../skill/entities/skill.entity.js'
import { SkillService } from '../skill/skill.service.js'
import { Dimensions } from '../dimensions/entities/dimensions.entity.js'
import { MediaStorageService } from './media-storage.service.js'

const storage = vi.hoisted(() => ({ directory: '' }))

vi.mock('./local-media-storage.js', () => ({
  get mediaDirectory() {
    return storage.directory
  },
}))

// Real PostgreSQL (embedded binary, temporary data directory and port, no containers).
// If the binary is unavailable the suite is skipped rather than failing the whole run.
const port = 54000 + (process.pid % 900)
// REQUIRE_PG_TESTS=1 turns "PostgreSQL unavailable" into a failure instead of a skip.
// PG_TESTS_SIMULATE_UNAVAILABLE=1 forces that situation to verify both behaviours.
const requirePostgres = process.env.REQUIRE_PG_TESTS === '1'
let embedded: { stop: () => Promise<void> } | undefined
let dataSource: DataSource | undefined
let unavailableReason: string | undefined
let dataDirectory = ''

const entities = Object.values(
  import.meta.glob('../**/*.entity.ts', { eager: true }),
)
  .flatMap((module) => Object.values(module as object))
  .filter((value): value is never => typeof value === 'function')

describe('media file lifecycle against PostgreSQL', () => {
  let ds: DataSource
  let storageService: MediaStorageService
  let clients: ClientService
  let skills: SkillService
  let assets: AssetService
  let errorLog: ReturnType<typeof vi.spyOn>

  const filePath = (folder: string, name: string) => join(storage.directory, folder, name)
  const exists = (folder: string, name: string) =>
    stat(filePath(folder, name)).then(() => true, () => false)
  const createFile = (folder: string, name: string) => writeFile(filePath(folder, name), name)
  const logoUrl = (name: string) => `/media/clients/${name}`
  const waitingForLock = async () => {
    const [{ count }] = await ds.query('SELECT count(*)::int AS count FROM pg_locks WHERE NOT granted')
    return count as number
  }
  const waitUntilBlocked = () => vi.waitFor(async () => expect(await waitingForLock()).toBeGreaterThan(0), { timeout: 5000 })
  const assetUrl = (name: string) => `/media/assets/${name}`
  const gate = () => {
    let open!: () => void
    const opened = new Promise<void>((resolve) => { open = resolve })
    return { opened, open }
  }

  beforeAll(async () => {
    try {
      if (process.env.PG_TESTS_SIMULATE_UNAVAILABLE === '1') {
        throw new Error('simulated: embedded PostgreSQL unavailable')
      }

      const { default: EmbeddedPostgres } = await import('embedded-postgres')
      dataDirectory = await mkdtemp(join(tmpdir(), 'publicator-it-pg-'))
      const server = new EmbeddedPostgres({
        databaseDir: join(dataDirectory, 'data'),
        user: 'it',
        password: 'it',
        port,
        persistent: false,
        onLog: () => undefined,
        onError: () => undefined,
      })
      await server.initialise()
      await server.start()
      embedded = server
      await server.createDatabase('it')
      dataSource = new DataSource({
        type: 'postgres',
        host: '127.0.0.1',
        port,
        username: 'it',
        password: 'it',
        database: 'it',
        entities,
        synchronize: true,
      })
      await dataSource.initialize()
      await dataSource.query(`
        CREATE FUNCTION it_fail_commit() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'simulated commit failure' USING ERRCODE = '40001'; END $$;
        CREATE CONSTRAINT TRIGGER it_fail_commit AFTER DELETE OR UPDATE ON client
          DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (OLD.name LIKE 'commit-fails%')
          EXECUTE FUNCTION it_fail_commit();
        CREATE CONSTRAINT TRIGGER it_fail_commit_asset AFTER DELETE OR UPDATE ON asset
          DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (OLD.name LIKE 'commit-fails%')
          EXECUTE FUNCTION it_fail_commit();
        CREATE FUNCTION it_fk() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'simulated fk' USING ERRCODE = '23503'; END $$;
        CREATE TRIGGER it_fk BEFORE DELETE ON client
          FOR EACH ROW WHEN (OLD.name LIKE 'fk-blocked%') EXECUTE FUNCTION it_fk();
        CREATE TRIGGER it_fk_skill BEFORE DELETE ON skill
          FOR EACH ROW WHEN (OLD.name LIKE 'fk-blocked%') EXECUTE FUNCTION it_fk();
        CREATE TRIGGER it_fk_asset BEFORE DELETE ON asset
          FOR EACH ROW WHEN (OLD.name LIKE 'fk-blocked%') EXECUTE FUNCTION it_fk();
      `)
    } catch (error) {
      unavailableReason = error instanceof Error ? error.message : String(error)

      if (requirePostgres) {
        throw new Error(
          `REQUIRE_PG_TESTS=1 but embedded PostgreSQL is unavailable: ${unavailableReason}`,
          { cause: error },
        )
      }

      console.warn(`PostgreSQL integration tests skipped: ${unavailableReason}`)
    }
  }, 120_000)

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy()
    await embedded?.stop()
    if (dataDirectory) await rm(dataDirectory, { recursive: true, force: true })
  })

  beforeEach(async (context) => {
    if (!dataSource) {
      if (requirePostgres) {
        throw new Error(`REQUIRE_PG_TESTS=1 but PostgreSQL is not available: ${unavailableReason}`)
      }

      context.skip(true, unavailableReason)
      return
    }

    ds = dataSource
    storage.directory = await mkdtemp(join(tmpdir(), 'publicator-it-media-'))
    for (const folder of ['assets', 'clients', 'skills/icons']) {
      await mkdir(join(storage.directory, folder), { recursive: true })
    }
    await ds.query('TRUNCATE client, skill, asset RESTART IDENTITY CASCADE')
    errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
    storageService = new MediaStorageService(ds)
    clients = new ClientService(ds.getRepository(Client), {} as never, storageService)
    skills = new SkillService(ds.getRepository(Skill), {} as never, storageService)
    assets = new AssetService(
      ds.getRepository(Asset),
      ds.getRepository(Dimensions),
      storageService,
    )
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    if (storage.directory) {
      await chmod(join(storage.directory, 'clients'), 0o755).catch(() => undefined)
      await rm(storage.directory, { recursive: true, force: true })
    }
  })

  describe('the race: cleanup deletes the file, then another writer assigns it', () => {
    it('rejects the late assignment and never saves a reference to the deleted file', async () => {
      await createFile('clients', 'a.png')
      const original = await clients.create({ name: 'owner', logo: logoUrl('a.png') })

      // Cleanup takes the lock and is held after checking references, before it unlinks.
      const reachedUnlink = gate()
      const resumeCleanup = gate()
      const realIsReferenced = storageService.isReferenced.bind(storageService)
      vi.spyOn(storageService, 'isReferenced').mockImplementation(async (url, manager) => {
        const referenced = await realIsReferenced(url, manager)
        reachedUnlink.open()
        await resumeCleanup.opened
        return referenced
      })

      const removal = clients.remove(original.id)
      await reachedUnlink.opened

      // 4. Another writer wants the same URL while cleanup holds the lock.
      const lateWriter = clients.create({ name: 'late', logo: logoUrl('a.png') })
      const lateResult = lateWriter.then(() => 'saved', (error: unknown) => error)
      await waitUntilBlocked()
      expect(await exists('clients', 'a.png')).toBe(true)

      resumeCleanup.open()
      await removal

      expect(await exists('clients', 'a.png')).toBe(false)
      const outcome = await lateResult
      expect(outcome).toBeInstanceOf(BadRequestException)
      await expect(ds.getRepository(Client).countBy({ logo: logoUrl('a.png') })).resolves.toBe(0)
      await expect(ds.getRepository(Client).count()).resolves.toBe(0)
    })

    it('keeps the file when the writer takes the lock first and commits a reference', async () => {
      await createFile('clients', 'b.png')
      const original = await clients.create({ name: 'owner', logo: logoUrl('b.png') })

      const holding = gate()
      const commit = gate()
      const writer = ds.transaction(async (manager) => {
        await storageService.assertAssignable(logoUrl('b.png'), 'clients', manager)
        holding.open()
        await commit.opened
        await manager.save(Client, manager.create(Client, { name: 'newcomer', logo: logoUrl('b.png') }))
      })
      await holding.opened

      const removal = clients.remove(original.id)
      await waitUntilBlocked()
      expect(await exists('clients', 'b.png')).toBe(true)

      commit.open()
      await writer
      await removal

      expect(await exists('clients', 'b.png')).toBe(true)
      await expect(ds.getRepository(Client).countBy({ logo: logoUrl('b.png') })).resolves.toBe(1)
    })

    it('never leaves a saved reference without its file under concurrent delete and create', async () => {
      for (let round = 0; round < 15; round++) {
        const name = `race-${round}.png`
        await createFile('clients', name)
        const owner = await clients.create({ name: `owner-${round}`, logo: logoUrl(name) })

        const [, created] = await Promise.allSettled([
          clients.remove(owner.id),
          clients.create({ name: `newcomer-${round}`, logo: logoUrl(name) }),
        ])

        const referenced = await ds.getRepository(Client).countBy({ logo: logoUrl(name) })
        if (referenced > 0) {
          expect(await exists('clients', name)).toBe(true)
        } else {
          expect(created.status).toBe('rejected')
        }
      }
    })
  })

  describe('assignment of managed URLs', () => {
    it('rejects a managed file that does not exist without saving anything', async () => {
      await expect(clients.create({ name: 'x', logo: logoUrl('nope.png') })).rejects.toBeInstanceOf(BadRequestException)
      await expect(skills.create({ name: 'x', icon: '/media/skills/icons/nope.svg' })).rejects.toBeInstanceOf(BadRequestException)
      await expect(
        assets.create({ type: 'Image', url: '/media/assets/nope.png', name: 'n' }),
      ).rejects.toBeInstanceOf(BadRequestException)

      await expect(ds.getRepository(Client).count()).resolves.toBe(0)
      await expect(ds.getRepository(Skill).count()).resolves.toBe(0)
      await expect(ds.getRepository(Asset).count()).resolves.toBe(0)
    })

    it('rejects a directory, traversal and a null byte', async () => {
      await mkdir(filePath('clients', 'dir'))

      for (const logo of ['dir', '../secret.png', 'a\0b.png']) {
        await expect(clients.create({ name: 'x', logo: logoUrl(logo) })).rejects.toBeInstanceOf(BadRequestException)
      }
      await expect(clients.create({ name: 'x', logo: '/media/assets/x.png' })).rejects.toBeInstanceOf(BadRequestException)
      await expect(ds.getRepository(Client).count()).resolves.toBe(0)
    })

    it('keeps accepting external URLs, plain paths and null', async () => {
      await clients.create({ name: 'external', logo: 'https://example.test/logo.png' })
      await clients.create({ name: 'path', logo: '/assets/logo.png' })
      await clients.create({ name: 'none', logo: null })
      await clients.create({ name: 'omitted' })
      await skills.create({ name: 'external', icon: 'https://example.test/i.svg' })

      await expect(ds.getRepository(Client).count()).resolves.toBe(4)
      await expect(ds.getRepository(Skill).count()).resolves.toBe(1)
    })

    it('accepts an existing file on create and update for client, skill and asset', async () => {
      await createFile('clients', 'c1.png')
      await createFile('clients', 'c2.png')
      await createFile('skills/icons', 's1.svg')
      await createFile('assets', 'a1.png')
      await createFile('assets', 'a2.png')

      const client = await clients.create({ name: 'c', logo: logoUrl('c1.png') })
      await clients.update(client.id, { logo: logoUrl('c2.png') })
      const skill = await skills.create({ name: 's', icon: '/media/skills/icons/s1.svg' })
      const asset = await assets.create({ type: 'Image', url: '/media/assets/a1.png', name: 'a' })
      await assets.update(asset.id, { url: '/media/assets/a2.png' })

      expect((await ds.getRepository(Client).findOneByOrFail({ id: client.id })).logo).toBe(logoUrl('c2.png'))
      expect((await ds.getRepository(Skill).findOneByOrFail({ id: skill.id })).icon).toBe('/media/skills/icons/s1.svg')
      expect((await ds.getRepository(Asset).findOneByOrFail({ id: asset.id })).url).toBe('/media/assets/a2.png')
    })

    it('rejects replacing a logo or icon with a missing file and keeps the old one intact', async () => {
      await createFile('clients', 'old.png')
      await createFile('skills/icons', 'old.svg')
      const client = await clients.create({ name: 'c', logo: logoUrl('old.png') })
      const skill = await skills.create({ name: 's', icon: '/media/skills/icons/old.svg' })

      await expect(clients.update(client.id, { logo: logoUrl('gone.png') })).rejects.toBeInstanceOf(BadRequestException)
      await expect(skills.update(skill.id, { icon: '/media/skills/icons/gone.svg' })).rejects.toBeInstanceOf(BadRequestException)

      expect(await exists('clients', 'old.png')).toBe(true)
      expect(await exists('skills/icons', 'old.svg')).toBe(true)
      expect((await ds.getRepository(Client).findOneByOrFail({ id: client.id })).logo).toBe(logoUrl('old.png'))
    })

    it('does not block renaming a record whose stored file is already missing', async () => {
      const client = await ds.getRepository(Client).save({ name: 'legacy', logo: logoUrl('missing.png') })

      await expect(clients.update(client.id, { name: 'renamed' })).resolves.toMatchObject({ name: 'renamed' })
    })

    it('holds the advisory lock until the writer transaction ends', async () => {
      await createFile('clients', 'held.png')
      const holding = gate()
      const finish = gate()
      const writer = ds.transaction(async (manager) => {
        await storageService.assertAssignable(logoUrl('held.png'), 'clients', manager)
        holding.open()
        await finish.opened
      })
      await holding.opened

      const cleanup = storageService.deleteUnreferencedFiles([{ url: logoUrl('held.png'), folder: 'clients' }])
      await waitUntilBlocked()
      expect(await exists('clients', 'held.png')).toBe(true)

      finish.open()
      await writer
      await cleanup
      expect(await exists('clients', 'held.png')).toBe(false)
    })
  })

  describe('deletion and replacement', () => {
    it('deletes the logo, icon and asset file together with their records', async () => {
      await createFile('clients', 'c.png')
      await createFile('skills/icons', 's.svg')
      await createFile('assets', 'a.png')
      const client = await clients.create({ name: 'c', logo: logoUrl('c.png') })
      const skill = await skills.create({ name: 's', icon: '/media/skills/icons/s.svg' })
      const asset = await assets.create({ type: 'Image', url: '/media/assets/a.png', name: 'a' })

      await clients.remove(client.id)
      await skills.remove(skill.id)
      await assets.remove(asset.id)

      expect(await readdir(filePath('clients', ''))).toEqual([])
      expect(await readdir(filePath('skills/icons', ''))).toEqual([])
      expect(await readdir(filePath('assets', ''))).toEqual([])
    })

    it('deletes records without a file, with an external URL or with a missing file', async () => {
      const none = await clients.create({ name: 'none' })
      const external = await clients.create({ name: 'external', logo: 'https://example.test/l.png' })
      const legacy = await ds.getRepository(Client).save({ name: 'legacy', logo: logoUrl('missing.png') })

      await clients.remove(none.id)
      await clients.remove(external.id)
      await clients.remove(legacy.id)

      await expect(ds.getRepository(Client).count()).resolves.toBe(0)
      expect(errorLog).not.toHaveBeenCalled()
    })

    it('keeps a file shared by two records until the last one is removed', async () => {
      await createFile('clients', 'shared.png')
      const first = await clients.create({ name: 'first', logo: logoUrl('shared.png') })
      const second = await clients.create({ name: 'second', logo: logoUrl('shared.png') })

      await clients.remove(first.id)
      expect(await exists('clients', 'shared.png')).toBe(true)
      await clients.remove(second.id)
      expect(await exists('clients', 'shared.png')).toBe(false)
    })

    it('keeps a file still used by an asset when a client logo is replaced', async () => {
      await createFile('assets', 'both.png')
      await createFile('clients', 'new.png')
      await ds.getRepository(Asset).save({ type: 'Image', url: '/media/assets/both.png', name: 'a' })
      const client = await ds.getRepository(Client).save({ name: 'c', logo: '/media/assets/both.png' })

      await storageService.deleteUnreferencedFiles([{ url: '/media/assets/both.png', folder: 'assets' }])
      expect(await exists('assets', 'both.png')).toBe(true)

      await clients.update(client.id, { logo: logoUrl('new.png') })
      expect(await exists('assets', 'both.png')).toBe(true)
    })

    it('deletes the previous file on replacement and on clearing', async () => {
      await createFile('clients', 'one.png')
      await createFile('clients', 'two.png')
      const client = await clients.create({ name: 'c', logo: logoUrl('one.png') })

      await clients.update(client.id, { logo: logoUrl('two.png') })
      expect(await exists('clients', 'one.png')).toBe(false)
      expect(await exists('clients', 'two.png')).toBe(true)

      await clients.update(client.id, { logo: null })
      expect(await exists('clients', 'two.png')).toBe(false)
    })

    it('keeps the file when the logo does not change', async () => {
      await createFile('clients', 'same.png')
      const client = await clients.create({ name: 'c', logo: logoUrl('same.png') })

      await clients.update(client.id, { name: 'renamed' })

      expect(await exists('clients', 'same.png')).toBe(true)
    })
  })

  describe('failures', () => {
    it('never deletes the file when the COMMIT fails on remove', async () => {
      await createFile('clients', 'k.png')
      const client = await clients.create({ name: 'commit-fails-1', logo: logoUrl('k.png') })

      await expect(clients.remove(client.id)).rejects.toThrow('simulated commit failure')

      expect(await exists('clients', 'k.png')).toBe(true)
      await expect(ds.getRepository(Client).countBy({ id: client.id })).resolves.toBe(1)
    })

    it('never deletes the previous file when the COMMIT fails on update', async () => {
      await createFile('clients', 'k1.png')
      await createFile('clients', 'k2.png')
      const client = await clients.create({ name: 'commit-fails-2', logo: logoUrl('k1.png') })

      await expect(clients.update(client.id, { logo: logoUrl('k2.png') })).rejects.toThrow('simulated commit failure')

      expect(await exists('clients', 'k1.png')).toBe(true)
      expect((await ds.getRepository(Client).findOneByOrFail({ id: client.id })).logo).toBe(logoUrl('k1.png'))
    })

    it('turns foreign key violations into 409 and keeps the file for client, skill and asset', async () => {
      await createFile('clients', 'f.png')
      await createFile('skills/icons', 'f.svg')
      await createFile('assets', 'f.png')
      const client = await clients.create({ name: 'fk-blocked', logo: logoUrl('f.png') })
      const skill = await skills.create({ name: 'fk-blocked', icon: '/media/skills/icons/f.svg' })
      const asset = await assets.create({ type: 'Image', url: '/media/assets/f.png', name: 'fk-blocked' })

      await expect(clients.remove(client.id)).rejects.toBeInstanceOf(ConflictException)
      await expect(skills.remove(skill.id)).rejects.toBeInstanceOf(ConflictException)
      await expect(assets.remove(asset.id)).rejects.toBeInstanceOf(ConflictException)

      expect(await exists('clients', 'f.png')).toBe(true)
      expect(await exists('skills/icons', 'f.svg')).toBe(true)
      expect(await exists('assets', 'f.png')).toBe(true)
    })

    it('returns 404 for records that do not exist', async () => {
      await expect(clients.remove(999)).rejects.toThrow('Client with id 999 not found')
      await expect(skills.remove(999)).rejects.toThrow('Skill with id 999 not found')
      await expect(assets.remove(999)).rejects.toThrow('Asset with id 999 not found')
    })

    it.skipIf(process.getuid?.() === 0)(
      'keeps the committed deletion and logs an orphan when unlink fails afterwards',
      async () => {
        await createFile('clients', 'locked.png')
        const client = await clients.create({ name: 'c', logo: logoUrl('locked.png') })
        await chmod(join(storage.directory, 'clients'), 0o555)

        await expect(clients.remove(client.id)).resolves.toBeUndefined()

        await expect(ds.getRepository(Client).countBy({ id: client.id })).resolves.toBe(0)
        expect(errorLog).toHaveBeenCalledWith(
          expect.stringMatching(/ORPHANED_MEDIA_FILE url=\/media\/clients\/locked\.png folder=clients code=EACCES/),
        )
      },
    )

    it.skipIf(process.getuid?.() === 0)(
      'keeps the committed replacement and logs an orphan when unlink of the old file fails',
      async () => {
        await createFile('clients', 'o1.png')
        await createFile('clients', 'o2.png')
        const client = await clients.create({ name: 'c', logo: logoUrl('o1.png') })
        await chmod(join(storage.directory, 'clients'), 0o555)

        await expect(clients.update(client.id, { logo: logoUrl('o2.png') })).resolves.toMatchObject({
          logo: logoUrl('o2.png'),
        })

        expect((await ds.getRepository(Client).findOneByOrFail({ id: client.id })).logo).toBe(logoUrl('o2.png'))
        expect(await exists('clients', 'o2.png')).toBe(true)
        expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('ORPHANED_MEDIA_FILE url=/media/clients/o1.png'))
      },
    )
  })
  describe('Asset concurrency', () => {
    // Runs the real assertAssignable, then holds the transaction open (row lock + advisory lock)
    // until resume() is called.
    const pauseAfterAssert = () => {
      const reached = gate()
      const resume = gate()
      const real = storageService.assertAssignable.bind(storageService)
      vi.spyOn(storageService, 'assertAssignable').mockImplementationOnce(async (url, folder, manager) => {
        await real(url, folder, manager)
        reached.open()
        await resume.opened
      })
      return { reached: reached.opened, resume: resume.open }
    }
    const newAsset = (file: string, name = 'asset') =>
      assets.create({ type: 'Image', url: assetUrl(file), name })

    it('DELETE waits for a running PATCH and then works on the fresh URL, leaving no orphan', async () => {
      await createFile('assets', 'a.png')
      await createFile('assets', 'b.png')
      const asset = await newAsset('a.png')
      const pause = pauseAfterAssert()

      const updating = assets.update(asset.id, { url: assetUrl('b.png') })
      await pause.reached
      const removing = assets.remove(asset.id)
      await waitUntilBlocked()
      pause.resume()
      await Promise.all([updating, removing])

      await expect(ds.getRepository(Asset).count()).resolves.toBe(0)
      expect(await exists('assets', 'a.png')).toBe(false)
      expect(await exists('assets', 'b.png')).toBe(false)
      expect(errorLog).not.toHaveBeenCalled()
    })

    it('a second PATCH starts from the first PATCH result, so each replaced file is cleaned once', async () => {
      await createFile('assets', 'a.png')
      await createFile('assets', 'b.png')
      await createFile('assets', 'c.png')
      const asset = await newAsset('a.png')
      const pause = pauseAfterAssert()

      const first = assets.update(asset.id, { url: assetUrl('b.png') })
      await pause.reached
      const second = assets.update(asset.id, { url: assetUrl('c.png') })
      await waitUntilBlocked()
      pause.resume()
      await Promise.all([first, second])

      expect((await ds.getRepository(Asset).findOneByOrFail({ id: asset.id })).url).toBe(assetUrl('c.png'))
      expect(await exists('assets', 'a.png')).toBe(false)
      expect(await exists('assets', 'b.png')).toBe(false)
      expect(await exists('assets', 'c.png')).toBe(true)
    })

    it('CREATE of a URL being assigned by a running PATCH waits, then reports a conflict', async () => {
      await createFile('assets', 'a.png')
      await createFile('assets', 'u.png')
      const asset = await newAsset('a.png')
      const pause = pauseAfterAssert()

      const updating = assets.update(asset.id, { url: assetUrl('u.png') })
      await pause.reached
      const creating = newAsset('u.png', 'late').then(() => 'saved', (error: unknown) => error)
      await waitUntilBlocked()
      pause.resume()
      await updating

      expect(await creating).toBeInstanceOf(ConflictException)
      await expect(ds.getRepository(Asset).countBy({ url: assetUrl('u.png') })).resolves.toBe(1)
      expect(await exists('assets', 'u.png')).toBe(true)
      expect(await exists('assets', 'a.png')).toBe(false)
    })

    it('keeps the file when a CREATE re-assigns the URL while DELETE cleanup is waiting', async () => {
      await createFile('assets', 'r.png')
      const asset = await newAsset('r.png')
      const pause = pauseAfterAssert()

      const creating = newAsset('r.png', 'again')
      await pause.reached
      const removing = assets.remove(asset.id)
      await waitUntilBlocked()
      expect(await exists('assets', 'r.png')).toBe(true)
      pause.resume()
      await Promise.all([creating, removing])

      await expect(ds.getRepository(Asset).countBy({ url: assetUrl('r.png') })).resolves.toBe(1)
      expect(await exists('assets', 'r.png')).toBe(true)
    })

    it('rejects a CREATE that arrives after the cleanup removed the file, saving nothing', async () => {
      await createFile('assets', 'z.png')
      const asset = await newAsset('z.png')
      const reachedUnlink = gate()
      const resumeCleanup = gate()
      const realIsReferenced = storageService.isReferenced.bind(storageService)
      vi.spyOn(storageService, 'isReferenced').mockImplementation(async (url, manager) => {
        const referenced = await realIsReferenced(url, manager)
        reachedUnlink.open()
        await resumeCleanup.opened
        return referenced
      })

      const removing = assets.remove(asset.id)
      await reachedUnlink.opened
      const late = newAsset('z.png', 'late').then(() => 'saved', (error: unknown) => error)
      await waitUntilBlocked()
      resumeCleanup.open()
      await removing

      expect(await late).toBeInstanceOf(BadRequestException)
      expect(await exists('assets', 'z.png')).toBe(false)
      await expect(ds.getRepository(Asset).count()).resolves.toBe(0)
    })
  })

  describe('replacing a URL while another record still uses the file', () => {
    it('keeps the previous asset file when a client and a skill still reference it', async () => {
      await createFile('assets', 'shared.png')
      await createFile('assets', 'other.png')
      const shared = assetUrl('shared.png')
      const asset = await assets.create({ type: 'Image', url: shared, name: 'a' })
      await ds.getRepository(Client).save({ name: 'user-of-file', logo: shared })
      await ds.getRepository(Skill).save({ name: 'user-of-file', icon: shared })

      await assets.update(asset.id, { url: assetUrl('other.png') })

      expect(await exists('assets', 'shared.png')).toBe(true)
      expect((await ds.getRepository(Asset).findOneByOrFail({ id: asset.id })).url).toBe(assetUrl('other.png'))
      expect(errorLog).not.toHaveBeenCalled()
    })

    it('deletes the previous asset file once nothing references it', async () => {
      await createFile('assets', 'single.png')
      await createFile('assets', 'next.png')
      const asset = await assets.create({ type: 'Image', url: assetUrl('single.png'), name: 'a' })

      await assets.update(asset.id, { url: assetUrl('next.png') })

      expect(await exists('assets', 'single.png')).toBe(false)
    })

    it('does nothing to the file when only other fields of the asset change', async () => {
      await createFile('assets', 'keep.png')
      const asset = await assets.create({ type: 'Image', url: assetUrl('keep.png'), name: 'a' })

      await assets.update(asset.id, { name: 'renamed', type: 'Video' })

      expect(await exists('assets', 'keep.png')).toBe(true)
    })

    it('rejects replacing the URL with a missing file and keeps the old record and file', async () => {
      await createFile('assets', 'old.png')
      const asset = await assets.create({ type: 'Image', url: assetUrl('old.png'), name: 'a' })

      await expect(assets.update(asset.id, { url: assetUrl('gone.png') })).rejects.toBeInstanceOf(BadRequestException)

      expect(await exists('assets', 'old.png')).toBe(true)
      expect((await ds.getRepository(Asset).findOneByOrFail({ id: asset.id })).url).toBe(assetUrl('old.png'))
    })

    it('reports a duplicate URL as 409 and keeps both files', async () => {
      await createFile('assets', 'one.png')
      await createFile('assets', 'two.png')
      await assets.create({ type: 'Image', url: assetUrl('one.png'), name: 'a' })
      const second = await assets.create({ type: 'Image', url: assetUrl('two.png'), name: 'b' })

      await expect(assets.update(second.id, { url: assetUrl('one.png') })).rejects.toBeInstanceOf(ConflictException)

      expect(await exists('assets', 'one.png')).toBe(true)
      expect(await exists('assets', 'two.png')).toBe(true)
    })

    it('keeps the empty-DTO and missing-record behaviour of the update', async () => {
      const asset = await assets.create({ type: 'Image', url: 'https://example.test/x.png', name: 'a' })

      await expect(assets.update(asset.id, {})).rejects.toBeInstanceOf(BadRequestException)
      await expect(assets.update(999, {})).rejects.toBeInstanceOf(NotFoundException)
      await expect(assets.update(asset.id, { dimensionsId: 999 })).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('asset COMMIT failures', () => {
    it('never deletes the previous file when the COMMIT of a PATCH fails', async () => {
      await createFile('assets', 'k1.png')
      await createFile('assets', 'k2.png')
      const asset = await assets.create({ type: 'Image', url: assetUrl('k1.png'), name: 'commit-fails-a' })

      await expect(assets.update(asset.id, { url: assetUrl('k2.png') })).rejects.toThrow('simulated commit failure')

      expect(await exists('assets', 'k1.png')).toBe(true)
      expect(await exists('assets', 'k2.png')).toBe(true)
      expect((await ds.getRepository(Asset).findOneByOrFail({ id: asset.id })).url).toBe(assetUrl('k1.png'))
    })

    it('never deletes the file when the COMMIT of a DELETE fails', async () => {
      await createFile('assets', 'k3.png')
      const asset = await assets.create({ type: 'Image', url: assetUrl('k3.png'), name: 'commit-fails-b' })

      await expect(assets.remove(asset.id)).rejects.toThrow('simulated commit failure')

      expect(await exists('assets', 'k3.png')).toBe(true)
      await expect(ds.getRepository(Asset).countBy({ id: asset.id })).resolves.toBe(1)
    })

    it.skipIf(process.getuid?.() === 0)(
      'keeps the committed PATCH and logs an orphan when unlink of the old file fails afterwards',
      async () => {
        await createFile('assets', 'u1.png')
        await createFile('assets', 'u2.png')
        const asset = await assets.create({ type: 'Image', url: assetUrl('u1.png'), name: 'a' })
        await chmod(join(storage.directory, 'assets'), 0o555)

        try {
          await expect(assets.update(asset.id, { url: assetUrl('u2.png') })).resolves.toMatchObject({
            url: assetUrl('u2.png'),
          })
        } finally {
          await chmod(join(storage.directory, 'assets'), 0o755)
        }

        expect((await ds.getRepository(Asset).findOneByOrFail({ id: asset.id })).url).toBe(assetUrl('u2.png'))
        expect(await exists('assets', 'u2.png')).toBe(true)
        expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('ORPHANED_MEDIA_FILE url=/media/assets/u1.png'))
      },
    )
  })

  describe('lock ordering', () => {
    const httpErrors = [BadRequestException, ConflictException, NotFoundException]
    // Anything that is not a controlled 400/404/409 (for example a deadlock, code 40P01) fails the test.
    const expectControlled = (results: PromiseSettledResult<unknown>[]) => {
      for (const result of results) {
        if (result.status === 'rejected' && !httpErrors.some((type) => result.reason instanceof type)) {
          throw result.reason
        }
      }
    }
    const expectNoBrokenReferences = async () => {
      for (const asset of await ds.getRepository(Asset).find()) {
        if (asset.url.startsWith('/media/assets/')) {
          expect(await exists('assets', asset.url.slice('/media/assets/'.length))).toBe(true)
        }
      }
      for (const client of await ds.getRepository(Client).find()) {
        if (client.logo?.startsWith('/media/clients/')) {
          expect(await exists('clients', client.logo.slice('/media/clients/'.length))).toBe(true)
        }
      }
    }

    it('crossed URL swaps between two assets never deadlock', async () => {
      await createFile('assets', 'x.png')
      await createFile('assets', 'y.png')
      const first = await assets.create({ type: 'Image', url: assetUrl('x.png'), name: 'first' })
      const second = await assets.create({ type: 'Image', url: assetUrl('y.png'), name: 'second' })

      const results = await Promise.allSettled([
        assets.update(first.id, { url: assetUrl('y.png') }),
        assets.update(second.id, { url: assetUrl('x.png') }),
      ])

      expectControlled(results)
      await expectNoBrokenReferences()
    })

    it('mixed concurrent writers on assets and clients produce only controlled errors and no broken references', async () => {
      let seed = 20260211
      const random = (limit: number) => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        return seed % limit
      }
      const pick = <T>(items: T[]) => items[random(items.length)]
      const files = ['p', 'q', 'r', 's'].map((name) => `${name}.png`)

      for (let round = 0; round < 40; round++) {
        for (const file of files) {
          await createFile('assets', file)
          await createFile('clients', file)
        }
        const existingAssets = await ds.getRepository(Asset).find()
        const existingClients = await ds.getRepository(Client).find()
        const operations: Promise<unknown>[] = []

        for (let index = 0; index < 8; index++) {
          const asset = existingAssets.length ? pick(existingAssets) : undefined
          const client = existingClients.length ? pick(existingClients) : undefined
          const kind = random(6)

          if (kind === 0 || (kind === 1 && !asset) || (kind === 2 && !asset)) {
            operations.push(assets.create({ type: 'Image', url: assetUrl(pick(files)), name: `a${round}-${index}` }))
          } else if (kind === 1 && asset) {
            operations.push(assets.update(asset.id, { url: assetUrl(pick(files)) }))
          } else if (kind === 2 && asset) {
            operations.push(assets.remove(asset.id))
          } else if (kind === 3 || !client) {
            operations.push(clients.create({ name: `c${round}-${index}`, logo: logoUrl(pick(files)) }))
          } else if (kind === 4) {
            operations.push(clients.update(client.id, { name: `dup${random(2)}`, logo: logoUrl(pick(files)) }))
          } else {
            operations.push(clients.remove(client.id))
          }
        }

        expectControlled(await Promise.allSettled(operations))
        await expectNoBrokenReferences()
      }
    }, 120_000)
  })
})
