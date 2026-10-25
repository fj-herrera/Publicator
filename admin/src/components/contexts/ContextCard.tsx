import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from '@mui/material'
import type { Context } from '../../entities/context'
import './context-card.css'

type ContextCardProps = {
  context: Context
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
}

const contextDomain = 'javierherrera.es'

function ContextCard({ context, isSelected, onSelect, onEdit }: ContextCardProps) {
  const subdomain = context.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const contextUrl = `https://${subdomain}.${contextDomain}`

  return (
    <Card
      className={`context-card${isSelected ? ' context-card-selected' : ''}`}
      variant="outlined"
    >
      <CardActionArea aria-pressed={isSelected} onClick={onSelect}>
        <CardContent className="context-card-content">
          <Typography
            className="context-card-url"
            component="span"
          >
            {`${subdomain}.${contextDomain}`}
          </Typography>
          <Typography className="context-card-name" component="h3">
            {context.name.toUpperCase()}
          </Typography>
          <Typography className="context-card-count" variant="body2">
            {context.inPublications} publications
          </Typography>
        </CardContent>
      </CardActionArea>
      <div className="context-card-actions">
        <Button
          className="context-card-action"
          component="a"
          href={contextUrl}
          target="_blank"
          rel="noreferrer"
        >
          View
        </Button>
        <Button className="context-card-action" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </Card>
  )
}

export default ContextCard