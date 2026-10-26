import { Chip } from '@mui/material'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import './object-chips.css'

export type ObjectChipItem = {
  id: number | string
  label: string
  iconUrl?: string | null
}

// variantes de los chips y modos de icono
type ObjectChipsVariant = 'filled' | 'outlined'
type ObjectChipsIconMode = 'bookmark' | 'none' | 'url'

// Props for the ObjectChips component
type ObjectChipsProps = {
  items: ObjectChipItem[]
  variant?: ObjectChipsVariant
  iconMode?: ObjectChipsIconMode
  selectedId?: number | string | null
  onSelect?: (id: number | string) => void
}

// ObjectChips component
function ObjectChips({
  items,
  variant = 'filled',
  iconMode = 'bookmark',
  selectedId = null,
  onSelect,
}: ObjectChipsProps) {
  return (
    <div className="object-chips">
      {items.map((item) => {
        const selected = item.id === selectedId

        return (
          <Chip
            key={item.id}
            className={`object-chip${selected ? ' object-chip-selected' : ''}${iconMode === 'none' || (iconMode === 'url' && !item.iconUrl) ? ' object-chip-no-icon' : ''}`}
            variant={variant}
            icon={
              iconMode === 'bookmark' ? (
                <BookmarkBorderIcon />
              ) : iconMode === 'url' && item.iconUrl ? (
                <img src={item.iconUrl} alt="" />
              ) : undefined
            }
            label={item.label}
            clickable={Boolean(onSelect)}
            onClick={onSelect ? () => onSelect(item.id) : undefined}
            aria-pressed={onSelect ? selected : undefined}
          />
        )
      })}
    </div>
  )
}

export default ObjectChips