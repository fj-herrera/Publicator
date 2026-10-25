import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const mediaDirectory = resolve(
  process.env.MEDIA_DIR ?? fileURLToPath(new URL('../../../../media', import.meta.url)),
)