import { useState } from 'react'
import CollectionsIcon from '@mui/icons-material/Collections'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { useLocation, useNavigate } from 'react-router'
import SectionTabs from '../components/navigation/SectionTabs'
import Collections from '../views/Collections'
import GalleryAssets from '../views/GalleryAssets'
import './gallery.css'

function Gallery() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as {
    publicationCollectionFlow?: { publicationId: number; returnPath: string }
    publicationCollectionEditFlow?: { collectionId: number; returnPath: string }
  } | null
  const publicationCollectionFlow = routeState?.publicationCollectionFlow
  const publicationCollectionEditFlow = routeState?.publicationCollectionEditFlow
  const [activeGalleryTab, setActiveGalleryTab] = useState('collections')
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(
    Boolean(publicationCollectionFlow),
  )

  const changeTab = (value: string) => {
    setIsCreateCollectionOpen(false)
    setActiveGalleryTab(value)
  }

  const renderTabs = (onChange: (value: string) => void, onCreate: () => void) => (
    <SectionTabs
      value={activeGalleryTab}
      onChange={onChange}
      items={[
        { label: 'Collections', value: 'collections', icon: <CollectionsIcon /> },
        { label: 'Assets', value: 'assets', icon: <ImageOutlinedIcon /> },
      ]}
      createLabels={{ assets: 'Create Asset', collections: 'Create Collection' }}
      onCreate={onCreate}
    />
  )

  return (
    <main className="gallery-page">
      {activeGalleryTab === 'collections' && (
        <>
          <header className="gallery-header">
            {renderTabs(changeTab, () => setIsCreateCollectionOpen(true))}
          </header>
          <Collections
            isCreateFormOpen={isCreateCollectionOpen}
            onCreateFormClose={() => setIsCreateCollectionOpen(false)}
            publicationCreationFlow={publicationCollectionFlow ? {
              publicationId: publicationCollectionFlow.publicationId,
              onReturn: (createdCollectionId) => navigate(publicationCollectionFlow.returnPath, {
                replace: true,
                state: {
                  publicationCollectionReturn: true,
                  createdCollectionId,
                },
              }),
            } : undefined}
            publicationEditFlow={publicationCollectionEditFlow ? {
              collectionId: publicationCollectionEditFlow.collectionId,
              onReturn: () => navigate(publicationCollectionEditFlow.returnPath, {
                replace: true,
                state: { publicationCollectionReturn: true },
              }),
            } : undefined}
          />
        </>
      )}
      <GalleryAssets
        active={activeGalleryTab === 'assets'}
        onTabChange={changeTab}
        renderTabs={renderTabs}
      />
    </main>
  )
}

export default Gallery
