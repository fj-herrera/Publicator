import { useState } from 'react'
import { Box } from '@mui/material'
import { useMatch, useNavigate, useParams } from 'react-router'
import SectionTabs from '../components/navigation/SectionTabs'
import Types from '../views/Types'
import Tags from '../views/Tags'
import Contexts from '../views/Contexts'
import PublicationList from '../components/publications/PublicationList'
import PublicationFormView from '../components/publications/PublicationFormView'
import PushPinIcon from '@mui/icons-material/PushPin'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import BoltIcon from '@mui/icons-material/Bolt'
import ApartmentIcon from '@mui/icons-material/Apartment'

function Publications() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreating = useMatch('/publications/new') !== null
  const editingId = id === undefined ? null : Number(id)
  const isFormOpen = isCreating || editingId !== null
  const [activeTab, setActiveTab] = useState('all')
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]))
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false)
  const [isTagFormOpen, setIsTagFormOpen] = useState(false)
  const [isContextFormOpen, setIsContextFormOpen] = useState(false)
  const handleTabChange = (value: string) => {
    if (value !== activeTab) {
      setIsTypeFormOpen(false)
      setIsTagFormOpen(false)
      setIsContextFormOpen(false)
      if (isCreating) navigate('/publications')
    }
    setActiveTab(value)
    setVisitedTabs((previousTabs) => new Set(previousTabs).add(value))
  }

  const handleCreate = () => {
    if (activeTab === 'all') {
      navigate('/publications/new')
      return
    }

    if (activeTab === 'types') {
      setIsTypeFormOpen(true)
      return
    }

    if (activeTab === 'tags') {
      setIsTagFormOpen(true)
      return
    }

    if (activeTab === 'contexts') {
      setIsContextFormOpen(true)
    }
  }

  return (
    <>
      <SectionTabs
        value={activeTab}
        onChange={handleTabChange}
        items={[
          { label: 'All', value: 'all', icon: <PushPinIcon /> },
          { label: 'Types', value: 'types', icon: <SpaceDashboardIcon /> },
          { label: 'Tags', value: 'tags', icon: <BoltIcon /> },
          { label: 'Contexts', value: 'contexts', icon: <ApartmentIcon /> },
        ]}
        createLabels={{
          all: 'Create Publication',
          types: 'Create Type',
          tags: 'Create Tag',
          contexts: 'Create Context',
        }}
        createDisabled={activeTab === 'all' && isFormOpen}
        onCreate={handleCreate}
      />
      {visitedTabs.has('all') && (
        <Box component="section" hidden={activeTab !== 'all'}>
          {isFormOpen ? (
            <PublicationFormView
              key={isCreating ? 'new' : editingId}
              onClose={() => navigate('/publications')}
              publicationId={isCreating ? null : editingId}
            />
          ) : (
            <PublicationList />
          )}
        </Box>
      )}
      {visitedTabs.has('types') && (
        <Box component="section" hidden={activeTab !== 'types'}>
          <Types
            isCreateFormOpen={isTypeFormOpen}
            onCreateFormClose={() => setIsTypeFormOpen(false)}
          />
        </Box>
      )}
      {visitedTabs.has('tags') && (
        <Box component="section" hidden={activeTab !== 'tags'}>
          <Tags
            isCreateFormOpen={isTagFormOpen}
            onCreateFormClose={() => setIsTagFormOpen(false)}
          />
        </Box>
      )}
      {visitedTabs.has('contexts') && (
        <Box component="section" hidden={activeTab !== 'contexts'}>
          <Contexts
            isCreateFormOpen={isContextFormOpen}
            onCreateFormClose={() => setIsContextFormOpen(false)}
          />
        </Box>
      )}
    </>
  )
}

export default Publications