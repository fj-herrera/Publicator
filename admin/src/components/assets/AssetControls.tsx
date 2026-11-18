import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'

type AssetControlsProps = {
  query: string
  selectedType: string
  assetTypes: string[]
  isSelectingAssets: boolean
  visibleDeletableCount: number
  selectedDeletableCount: number
  allVisibleDeletableAssetsSelected: boolean
  isDeletingAsset: boolean
  onQueryChange: (query: string) => void
  onTypeChange: (type: string) => void
  onStartSelection: () => void
  onToggleVisibleSelection: () => void
  onDeleteSelected: () => void
  onCancelSelection: () => void
}

function AssetControls({
  query,
  selectedType,
  assetTypes,
  isSelectingAssets,
  visibleDeletableCount,
  selectedDeletableCount,
  allVisibleDeletableAssetsSelected,
  isDeletingAsset,
  onQueryChange,
  onTypeChange,
  onStartSelection,
  onToggleVisibleSelection,
  onDeleteSelected,
  onCancelSelection,
}: AssetControlsProps) {
  return (
    <div className="gallery-controls">
      {!isSelectingAssets ? (
        <button
          className="gallery-selection-button"
          onClick={onStartSelection}
          type="button"
        >
          Select assets
        </button>
      ) : (
        <>
          <button
            className="gallery-selection-button"
            disabled={visibleDeletableCount === 0}
            onClick={onToggleVisibleSelection}
            title="Select or deselect unassociated assets currently visible."
            type="button"
          >
            {allVisibleDeletableAssetsSelected ? 'Deselect' : 'Select'} visible unassociated
            ({visibleDeletableCount})
          </button>
          <span aria-live="polite" className="gallery-selection-count">
            {selectedDeletableCount} selected
          </span>
          <button
            className="gallery-selection-button gallery-selection-delete"
            disabled={selectedDeletableCount === 0 || isDeletingAsset}
            onClick={onDeleteSelected}
            type="button"
          >
            <DeleteIcon aria-hidden="true" />
            Delete selected
          </button>
          <button
            className="gallery-selection-button"
            onClick={onCancelSelection}
            type="button"
          >
            Cancel selection
          </button>
        </>
      )}
      <label className="gallery-search">
        <SearchIcon aria-hidden="true" />
        <input
          aria-label="Search assets"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search assets"
          type="search"
          value={query}
        />
      </label>
      <label className="gallery-type-filter">
        <span>Type</span>
        <select
          aria-label="Filter by asset type"
          onChange={(event) => onTypeChange(event.target.value)}
          value={selectedType}
        >
          <option value="all">All types</option>
          {assetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>
    </div>
  )
}

export default AssetControls
