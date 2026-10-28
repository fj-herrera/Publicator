import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import type { Request } from 'express'
import { AssetService } from '../asset/asset.service.js'
import { readAssetImageDimensions } from './asset-image-dimensions.js'
import { assetFileTypes, getAssetFileType } from './asset-file-types.js'
import { mediaDirectory } from './local-media-storage.js'

function createStoredFilename(file: Express.Multer.File): string {
  const originalName = file.originalname.replace(/\\/g, '/')
  const nameWithoutExtension = basename(originalName, extname(originalName))
  const safeName = nameWithoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'asset'

  return `${safeName}-${randomUUID().slice(0, 8)}${assetFileTypes[file.mimetype].extension}`
}

function imageFileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (getAssetFileType(file.mimetype) !== 'Image') {
    callback(
      new BadRequestException('Choose a PNG, JPEG, WebP, GIF, or SVG image.'),
      false,
    )
    return
  }

  callback(null, true)
}

function assetFileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!getAssetFileType(file.mimetype)) {
    callback(
      new BadRequestException(
        'Choose an SVG, JPG, PNG, WebP, GIF, MP4, WebM, MP3, WAV, OGG, or PDF file.',
      ),
      false,
    )
    return
  }

  callback(null, true)
}

function svgFileFilter(
  _request: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (file.mimetype !== 'image/svg+xml') {
    callback(new BadRequestException('Choose an SVG image.'), false)
    return
  }

  callback(null, true)
}

@Controller('media')
export class MediaController {
  constructor(private readonly assetService: AssetService) {}

  @Post('assets')
  @UseInterceptors(FilesInterceptor('files', 50, {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const assetMediaDirectory = join(mediaDirectory, 'assets')
        try {
          mkdirSync(assetMediaDirectory, { recursive: true })
          callback(null, assetMediaDirectory)
        } catch (error) {
          callback(error as Error, assetMediaDirectory)
        }
      },
      filename: (_request, file, callback) => {
        callback(null, createStoredFilename(file))
      },
    }),
    limits: {
      fileSize: 100 * 1024 * 1024,
      files: 50,
    },
    fileFilter: assetFileFilter,
  }))
  async uploadAssets(@UploadedFiles() files?: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('At least one asset file is required.')
    }

    const createdAssets = []

    try {
      for (const file of files) {
        const imageDimensions = getAssetFileType(file.mimetype) === 'Image'
          ? await readAssetImageDimensions(file.path)
          : null
        const dimensions = imageDimensions
          ? await this.assetService.findOrCreateDimensions(
            imageDimensions.width,
            imageDimensions.height,
          )
          : null
        const createdAsset = await this.assetService.create({
          type: getAssetFileType(file.mimetype)!,
          url: `/media/assets/${file.filename}`,
          name: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          ...(dimensions ? { dimensionsId: dimensions.id } : {}),
        })
        createdAssets.push(createdAsset)
      }

      return createdAssets
    } catch (error) {
      await Promise.all(
        createdAssets.map((asset) => this.assetService.remove(asset.id).catch(() => undefined)),
      )
      await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)))
      throw error
    }
  }

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

  @Post('skills/icons')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const skillIconDirectory = join(mediaDirectory, 'skills', 'icons')
        try {
          mkdirSync(skillIconDirectory, { recursive: true })
          callback(null, skillIconDirectory)
        } catch (error) {
          callback(error as Error, skillIconDirectory)
        }
      },
      filename: (_request, file, callback) => {
        callback(null, createStoredFilename(file))
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: svgFileFilter,
  }))
  uploadSkillIcon(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('An SVG icon is required.')
    }

    return { url: `/media/skills/icons/${file.filename}` }
  }
}