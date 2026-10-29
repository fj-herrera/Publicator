import { useState } from 'react'
import { Button, Checkbox } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import SearchIcon from '@mui/icons-material/Search'
import type { Asset } from '../../entities/asset'
import {
  getAssetName,
  getPreviewUrl,
  isPreviewableImage,
} from '../assets/asset-utils'
import RoleCombobox from '../assets/RoleCombobox'
import './collections.css'

type CollectionAssetPickerProps = {
  assets: Asset[]
  roles: string[]
  onAdd: (assets: Asset[], role: string) => void
  onClose: () => void
}

function CollectionAssetPicker({ assets, roles, onAdd, onClose }: CollectionAssetPickerProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [role, setRole] = useState('')
  const [error, setError] = useState('')

  const assetTypes = Array.from(new Set(assets.map((asset) => asset.type))).sort()
  const normalizedQuery = query.trim().toLowerCase()
  const visibleAssets = assets.filter((asset) => (
    (typeFilter === 'all' || asset.type === typeFilter)
    && [getAssetName(asset), asset.url, asset.type]
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  ))

  const toggleAsset = (id: number) => setSelectedIds((current) => {
    const next = new Set(current)
    if (!next.delete(id)) {
      next.add(id)
    }
    return next
  })

  const handleAdd = () => {
    const trimmedRole = role.trim()

    if (!trimmedRole || trimmedRole.length > 50) {
      setError('Enter a role of 1 to 50 characters for the selected assets.')
      return
    }

    onAdd(assets.filter((asset) => selectedIds.has(asset.id)), trimmedRole)
  }

  return (
    <section aria-label="Add assets to the collection" className="collection-picker">
      <header className="collection-picker-header">
        <label className="collection-picker-search">
          <SearchIcon aria-hidden="true" />
          <input
            aria-label="Search assets"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assets"
            type="search"
            value={query}
          />
        </label>
        <select
          aria-label="Filter by asset type"
          onChange={(event) => setTypeFilter(event.target.value)}
          value={typeFilter}
        >
          <option value="all">All types</option>
          {assetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <button
          aria-label="Close asset picker"
          className="collection-icon-button"
          onClick={onClose}
          type="button"
        >
          <CloseIcon aria-hidden="true" />
        </button>
      </header>

      {assets.length === 0 ? (
        <p className="collection-picker-empty">All the assets of the gallery are already in this collection.</p>
      ) : visibleAssets.length === 0 ? (
        <p className="collection-picker-empty">No assets found.</p>
      ) : (
        <ul className="collection-picker-list">
          {visibleAssets.map((asset) => (
            <li key={asset.id}>
              <label className="collection-picker-item">
                <Checkbox
                  checked={selectedIds.has(asset.id)}
                  onChange={() => toggleAsset(asset.id)}
                  size="small"
                />
                <span className="collection-picker-preview">
                  {asset.type === 'Image' && isPreviewableImage(asset.url)
                    ? <img alt="" loading="lazy" src={getPreviewUrl(asset.url)} />
                    : <InsertDriveFileOutlinedIcon aria-hidden="true" />}
                </span>
                <span className="collection-picker-name" title={getAssetName(asset)}>
                  {getAssetName(asset)}
                </span>
                <span className="collection-picker-type">{asset.type}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <footer className="collection-picker-footer">
        <div className="collection-picker-role">
          <label htmlFor="collection-picker-role-input">Asset role</label>
          <RoleCombobox
            id="collection-picker-role-input"
            label="Role of the selected assets"
            onChange={(value) => {
              setRole(value)
              setError('')
            }}
            options={roles}
            value={role}
          />
        </div>
        <Button
          disabled={selectedIds.size === 0}
          onClick={handleAdd}
          type="button"
          variant="contained"
        >
          Add selected ({selectedIds.size})
        </Button>
      </footer>
      {error && <p className="collection-form-error" role="alert">{error}</p>}
    </section>
  )
}

export default CollectionAssetPicker
