import sharp from 'sharp'

export interface AssetImageDimensions {
  width: number
  height: number
}

export async function readAssetImageDimensions(
  source: string | Buffer,
): Promise<AssetImageDimensions | null> {
  try {
    const metadata = await sharp(source).metadata()
    let width = metadata.width
    let height = metadata.height

    if (!width || !height) {
      return null
    }

    if (metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8) {
      [width, height] = [height, width]
    }

    return { width, height }
  } catch {
    return null
  }
}