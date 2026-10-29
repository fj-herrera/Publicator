import './collections.css'

type CollectionThumbnailProps = {
  urls: string[]
}

// Like a Spotify playlist cover: 1 image fills it, 2 split it, 3 are a half and two quarters, 4 are quarters.
function CollectionThumbnail({ urls }: CollectionThumbnailProps) {
  const visibleUrls = urls.slice(0, 4)

  return (
    <span
      aria-hidden="true"
      className={`collection-thumbnail collection-thumbnail-${visibleUrls.length}`}
    >
      {visibleUrls.map((url) => <img alt="" key={url} loading="lazy" src={url} />)}
    </span>
  )
}

export default CollectionThumbnail
