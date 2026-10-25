import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import type { Request } from 'express'
import { mediaDirectory } from './local-media-storage.js'

const extensionsByMimeType: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
}

function createStoredFilename(file: Express.Multer.File): string {
  const originalName = file.originalname.replace(/\\/g, '/')
  const nameWithoutExtension = basename(originalName, extname(originalName))
  const safeName = nameWithoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image'

  return `${safeName}-${randomUUID().slice(0, 8)}${extensionsByMimeType[file.mimetype]}`
}

function imageFileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!extensionsByMimeType[file.mimetype]) {
    callback(
      new BadRequestException('Choose a PNG, JPEG, WebP, GIF, or SVG image.'),
      false,
    )
    return
  }

  callback(null, true)
}

@Controller('media')
export class MediaController {
  @Post('clients/logos')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const clientMediaDirectory = join(mediaDirectory, 'clients')
        try {
          mkdirSync(clientMediaDirectory, { recursive: true })
          callback(null, clientMediaDirectory)
        } catch (error) {
          callback(error as Error, clientMediaDirectory)
        }
      },
      filename: (_request, file, callback) => {
        callback(null, createStoredFilename(file))
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  }))
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required.')
    }

    return { url: `/media/clients/${file.filename}` }
  }
}