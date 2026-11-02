import type { ReactNode } from 'react'
import './empty-state.css'

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description: string
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

export default EmptyState
