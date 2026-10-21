import { useState } from 'react'
import { Box } from '@mui/material'
import SectionTabs from '../components/SectionTabs'
import PublicationTypes from './PublicationTypes'
import PushPinIcon from '@mui/icons-material/PushPin'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import BoltIcon from '@mui/icons-material/Bolt'
import ApartmentIcon from '@mui/icons-material/Apartment'

function Publications() {
  const [activeTab, setActiveTab] = useState('all')
  const [isTypeFormOpen, setIsTypeFormOpen] = useState(false)
  const tabContent: Record<string, string> = {
    all: 'Publications',
    types: 'Types',
    tags: 'Tags',
    contexts: 'Contexts',
  }

  const handleCreate = () => {
    if (activeTab === 'types') {
      setIsTypeFormOpen(true)
      return
    }

    console.log('Create resource')
  }

  return (
    <>
      <SectionTabs
        value={activeTab}
        onChange={setActiveTab}
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
      <Box component="section" hidden={activeTab !== 'types'}>
        <PublicationTypes
          isCreateFormOpen={isTypeFormOpen}
          onCreateFormClose={() => setIsTypeFormOpen(false)}
        />
      </Box>
      {activeTab !== 'types' && <section><span>{tabContent[activeTab]}</span></section>}
    </>
  )
}

export default Publications