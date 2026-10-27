export interface Asset {
  id: number
  type: string
  url: string
  name?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  uploadedAt?: string | null
  dimensions: {
    id: number
    width: number
    height: number
  } | null
}

export interface PublicationAssetTarget {
  id: number
  meta: {
    title: string
    slug: string
  }
}

export interface CollectionAssetTarget {
  id: number
  type: string
}

export interface PublicationAssetRelation {
  id: number
  role: string
  asset: { id: number }
  publication: {
    id: number
    meta?: {
      title: string
      slug: string
    }
  }
}

export interface AssetCollectionRelation {
  id: number
  role: string
  asset: { id: number }
  collection: {
    id: number
    type?: string
  }
}