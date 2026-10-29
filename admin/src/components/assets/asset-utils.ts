import type { Asset } from '../../entities/asset'

const previewableImagePattern = /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i

export function getFileName(url: string) {
  const path = url.split(/[?#]/, 1)[0]
  const fileName = path.split('/').pop() || url

  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

export function getFileFormat(url: string) {
  const fileName = getFileName(url)
  const extension = fileName.split('.').pop()
  return extension && extension !== fileName ? extension.toUpperCase() : 'FILE'
}

export function getAssetName(asset: Asset) {
  return asset.name?.trim() || getFileName(asset.url)
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function getPreviewUrl(url: string) {
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('/')) {
    return url
  }

  return `/media/${url}`
}

export function isPreviewableImage(url: string) {
  return previewableImagePattern.test(url)
}
