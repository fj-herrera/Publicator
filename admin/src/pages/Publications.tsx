import { useState } from 'react'
import { Box } from '@mui/material'
import SectionTabs from '../components/SectionTabs'
import Types from '../views/types/Types'
import Tags from '../views/tags/Tags'
import PushPinIcon from '@mui/icons-material/PushPin'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import BoltIcon from '@mui/icons-material/Bolt'
import ApartmentIcon from '@mui/icons-material/Apartment'

function Publications() {
  const [activeTab, setActiveTab] = useState('all')
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]))
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false)
  const [isTagFormOpen, setIsTagFormOpen] = useState(false)
  const tabContent: Record<string, string> = {
    all: 'Publications',
    types: 'Types',
    tags: 'Tags',
    contexts: 'Contexts',
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setVisitedTabs((previousTabs) => new Set(previousTabs).add(value))
  }

  const handleCreate = () => {
    if (activeTab === 'types') {
      setIsTypeFormOpen(true)
      return
    }

    if (activeTab === 'tags') {
      setIsTagFormOpen(true)
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
        onCreate={handleCreate}
      />
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
      {activeTab !== 'types' && activeTab !== 'tags' && (
        <section><span>{tabContent[activeTab]}</span></section>
      )}
    </>
  )
}

export default Publications