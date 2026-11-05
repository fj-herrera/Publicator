import { stat, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { Asset } from '../asset/entities/asset.entity.js'
import { Client } from '../client/entities/client.entity.js'
import { Skill } from '../skill/entities/skill.entity.js'
import { mediaDirectory } from './local-media-storage.js'

export type MediaFolder = 'assets' | 'clients' | 'skills' | 'skills/icons'

export interface StoredFile {
  url: string
  folder: MediaFolder
}

const managedUrlPrefix = '/media/'

@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name)

  constructor(private readonly dataSource: DataSource) {}

  // Only plain filenames inside the expected media folder resolve to a path.
  resolveFilePath(url: string | null | undefined, folder: MediaFolder): string | null {
    const prefix = `${managedUrlPrefix}${folder}/`
    if (!url?.startsWith(prefix)) {
      return null
    }

    const filename = url.slice(prefix.length)
    if (
      !filename ||
      filename === '.' ||
      filename === '..' ||
      filename.includes('\0') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      basename(filename) !== filename
    ) {
      return null
    }

    return join(mediaDirectory, folder, filename)
  }

  // Every write that assigns a managed (/media/...) URL to a record must call this inside its
  // transaction, before saving. It takes the same advisory lock as the post-commit cleanup, which
  // PostgreSQL holds until that transaction ends, and then verifies the file still exists: if the
  // cleanup removed it first, the reference is rejected instead of being saved broken.
  // External URLs, other paths and null/undefined are not managed and pass untouched.
  //
  // Lock ordering (keeps the locks free of cycles; do not break it when adding writers):
  //   - a transaction takes at most ONE advisory lock, through this method;
  //   - it takes it after its row lock (SELECT ... FOR UPDATE on the record) and before any write;
  //   - the post-commit cleanup runs in its own transaction, takes only that advisory lock and writes nothing.
  // A transaction waiting for the advisory lock therefore holds no uncommitted write that the lock
  // holder could need, and the lock holder never waits on a lock owned by a waiter.
  async assertAssignable(
    url: string | null | undefined,
    folder: MediaFolder,
    manager: EntityManager,
  ): Promise<void> {
    if (!url?.startsWith(managedUrlPrefix)) {
      return
    }

    const filePath = this.resolveFilePath(url, folder)
    if (!filePath) {
      throw new BadRequestException(`Invalid media path "${url}" for ${folder}`)
    }

    await this.lockUrls([url], manager)

    let isFile = false
    try {
      isFile = (await stat(filePath)).isFile()
    } catch (error) {
      if (errorCode(error) !== 'ENOENT') {
        throw error
      }
    }

    if (!isFile) {
      throw new BadRequestException(`Media file "${url}" does not exist`)
    }
  }

  private async lockUrls(urls: string[], manager: EntityManager): Promise<void> {
    for (const url of [...new Set(urls)].sort()) {
      await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [url])
    }
  }

  async isReferenced(url: string, manager: EntityManager): Promise<boolean> {
    const [clients, skills, assets] = await Promise.all([
      manager.countBy(Client, { logo: url }),
      manager.countBy(Skill, { icon: url }),
      manager.countBy(Asset, { url }),
    ])

    return clients + skills + assets > 0
  }

  // Must run after the database transaction has committed. It never throws: the committed
  // change is already final, so a file that cannot be removed is only logged as an orphan.
  async deleteUnreferencedFiles(files: StoredFile[]): Promise<void> {
    const unique = [...new Map(files.map((file) => [file.url, file])).values()]

    for (const file of unique) {
      try {
        await this.deleteIfUnreferenced(file)
      } catch (error) {
        this.logger.error(
          `ORPHANED_MEDIA_FILE url=${file.url} folder=${file.folder} code=${errorCode(error)} message=${errorMessage(error)}`,
        )
      }
    }
  }

  private async deleteIfUnreferenced({ url, folder }: StoredFile): Promise<void> {
    const filePath = this.resolveFilePath(url, folder)
    if (!filePath) {
      if (url.startsWith(managedUrlPrefix)) {
        this.logger.warn(`INVALID_MEDIA_PATH url=${url} folder=${folder}`)
      }
      return
    }

    // The lock is shared with writers assigning this URL, so the reference check and the
    // unlink cannot interleave with a new assignment. Nothing is written to the database.
    await this.dataSource.transaction(async (manager) => {
      await this.lockUrls([url], manager)

      if (await this.isReferenced(url, manager)) {
        return
      }

      try {
        await unlink(filePath)
      } catch (error) {
        if (errorCode(error) !== 'ENOENT') {
          throw error
        }
      }
    })
  }
}

function errorCode(error: unknown): string {
  return error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
