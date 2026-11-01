import { Button } from '@mui/material'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import './publication-form.css'

type PublicationSectionPlaceholderProps = {
  label: string
  onContinue?: () => void
}

// Stand-in until the section content is implemented.
function PublicationSectionPlaceholder({ label, onContinue }: PublicationSectionPlaceholderProps) {
  return (
    <div className="publication-section-placeholder">
      <p>{label} will be available in a later phase.</p>
      {onContinue && (
        <div className="publication-form-section-actions">
          <Button endIcon={<ArrowDownwardIcon />} onClick={onContinue} variant="contained">
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}

export default PublicationSectionPlaceholder
