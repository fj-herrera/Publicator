import { Card, CardActionArea } from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import type { Client } from '../../entities/client'
import './client-card.css'

type ClientCardProps = {
  client: Client
  isSelected: boolean
  onSelect: () => void
}

function ClientCard({ client, isSelected, onSelect }: ClientCardProps) {
  return (
    <Card
      className={`client-logo-card${isSelected ? ' client-logo-card-selected' : ''}`}
      variant="outlined"
    >
      <CardActionArea
        className="client-logo-card-action"
        aria-label={`Filter by ${client.name}`}
        aria-pressed={isSelected}
        onClick={onSelect}
      >
        {client.logo ? (
          <img className="client-logo-image" src={client.logo} alt={client.name} />
        ) : (
          <BusinessIcon className="client-logo-placeholder" aria-hidden="true" />
        )}
      </CardActionArea>
    </Card>
  )
}

export default ClientCard