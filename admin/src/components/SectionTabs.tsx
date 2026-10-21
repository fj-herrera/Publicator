import type { ReactElement } from 'react'
import { Tabs, Tab, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import './section-tabs.css'

type TabItem = {
  label: string
  value: string
  icon: ReactElement
}

type SectionTabsProps = {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  onCreate: () => void
  createLabels: Record<string, string>
}

function SectionTabs({ items, value, onChange, onCreate, createLabels }: SectionTabsProps) {
  return (
    <div className="section-tabs-container">
      <Tabs
        value={value}
        onChange={(_, newValue: string) => onChange(newValue)}
        className="section-tabs"
      >
        {items.map((item) => (
          <Tab
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      <Button onClick={onCreate} startIcon={<AddIcon />}>
        {createLabels[value] ?? 'Create'}
      </Button>
    </div>
  )
}

export default SectionTabs