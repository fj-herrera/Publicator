import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import TuneIcon from '@mui/icons-material/Tune'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SearchIcon from '@mui/icons-material/Search'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import type { Asset } from '../../entities/asset'
import type {
  PublicationContextRecord,
  PublicationListData,
  PublicationRecord,
  PublicationTagRecord,
  SkillGroupSkillRecord,
} from '../../entities/publication'
import { getErrorMessage } from '../../services/api-error'
import { deletePublicationRequest } from '../../services/publications.service'
import usePublicationsData from '../../hooks/usePublicationsData'
import { getPreviewUrl, isPreviewableImage } from '../assets/asset-utils'
import './publications.css'

type FilterOption = { id: string; label: string }
type FilterKey = 'visibility' | 'contexts' | 'types' | 'clients' | 'tags'
type PublicationFilters = Record<FilterKey, string[]>
type PublicationListAsset = { asset: Asset; role: string; position: number }
type PublicationListRow = PublicationRecord & {
  publicationContexts: PublicationContextRecord[]
  tags: PublicationTagRecord['tag'][]
  skills: SkillGroupSkillRecord['skill'][]
  assets: PublicationListAsset[]
  collectionCount: number
  directAssetCount: number
  collectionAssetCount: number
}
type PublicationColumn = {
  id: string
  label: string
  className: string
  render: (row: PublicationListRow) => ReactNode
}

const initialFilters: PublicationFilters = {
  visibility: [],
  contexts: [],
  types: [],
  clients: [],
  tags: [],
}

const visibilityOptions: FilterOption[] = [
  { id: 'visible', label: 'Visible' },
  { id: 'hidden', label: 'Hidden' },
]

function groupBy<T>(items: T[], keyOf: (item: T) => number) {
  const groups = new Map<number, T[]>()
  items.forEach((item) => {
    const key = keyOf(item)
    groups.set(key, [...(groups.get(key) ?? []), item])
  })
  return groups
}

function buildPublicationRows(data: PublicationListData): PublicationListRow[] {
  const contextsByPublication = groupBy(data.publicationContexts, (item) => item.publication.id)
  const tagsByPublication = groupBy(data.publicationTags, (item) => item.publication.id)
  const groupsByPublication = groupBy(data.publicationSkillGroups, (item) => item.publication.id)
  const skillsByGroup = groupBy(data.skillGroupSkills, (item) => item.skillGroup.id)
  const assetsByPublication = groupBy(data.publicationAssets, (item) => item.publication.id)
  const collectionsByPublication = groupBy(data.collections, (item) => item.publication.id)
  const assetsByCollection = groupBy(data.collectionAssets, (item) => item.collection.id)

  return data.publications.map((publication) => {
    const collectionRows = collectionsByPublication.get(publication.id) ?? []
    const assetCandidates: PublicationListAsset[] = [
      ...(assetsByPublication.get(publication.id) ?? []).map((item) => ({
        asset: item.asset,
        role: item.role,
        position: 0,
      })),
      ...collectionRows.flatMap((collection) => (
        assetsByCollection.get(collection.id) ?? []
      ).map((item) => ({
        asset: item.asset,
        role: item.role,
        position: item.position,
      }))),
    ]
    const uniqueAssets = new Map<number, PublicationListAsset>()
    assetCandidates
      .sort((left, right) => {
        const leftThumbnail = left.role.toLowerCase().includes('thumbnail')
        const rightThumbnail = right.role.toLowerCase().includes('thumbnail')
        return Number(rightThumbnail) - Number(leftThumbnail) || left.position - right.position
      })
      .forEach((item) => {
        if (!uniqueAssets.has(item.asset.id)) {
          uniqueAssets.set(item.asset.id, item)
        }
      })

    const skillGroupIds = new Set(
      (groupsByPublication.get(publication.id) ?? []).map((item) => item.skillGroup.id),
    )
    const uniqueSkills = new Map<number, SkillGroupSkillRecord['skill']>()
    skillGroupIds.forEach((skillGroupId) => {
      ;(skillsByGroup.get(skillGroupId) ?? []).forEach(({ skill }) => {
        uniqueSkills.set(skill.id, skill)
      })
    })

    return {
      ...publication,
      publicationContexts: contextsByPublication.get(publication.id) ?? [],
      tags: (tagsByPublication.get(publication.id) ?? []).map((item) => item.tag),
      skills: [...uniqueSkills.values()],
      assets: [...uniqueAssets.values()],
      collectionCount: collectionRows.length,
      directAssetCount: new Set(
        (assetsByPublication.get(publication.id) ?? []).map((item) => item.asset.id),
      ).size,
      collectionAssetCount: new Set(
        collectionRows.flatMap((collection) => (
          assetsByCollection.get(collection.id) ?? []
        ).map((item) => item.asset.id)),
      ).size,
    }
  })
}

function MultiFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: FilterOption[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <Autocomplete
      className="publication-filter"
      disableCloseOnSelect
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      multiple
      onChange={(_event, selected) => onChange(selected.map((option) => option.id))}
      options={options}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={value.length === 0 ? 'Select' : ''} />
      )}
      renderOption={(props, option) => <li {...props} key={option.id}>{option.label}</li>}
      size="small"
      value={options.filter((option) => value.includes(option.id))}
    />
  )
}

function getThumbnail(row: PublicationListRow) {
  const images = row.assets
    .filter(({ asset }) => asset.type === 'Image' && isPreviewableImage(asset.url))
  return images[0]?.asset.url
}

function getVisibility(row: PublicationListRow) {
  return row.publicationContexts.some((item) => item.visible) ? 'visible' : 'hidden'
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(date)
}

function PublicationList() {
  const navigate = useNavigate()
  const { data, isLoading, error, reload } = usePublicationsData()
  const [filters, setFilters] = useState(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(12)
  const [pendingDelete, setPendingDelete] = useState<PublicationListRow | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const rows = data ? buildPublicationRows(data) : []
  const filterOptions = data ? {
    contexts: data.contexts.map(({ id, name }) => ({ id: String(id), label: name })),
    types: data.types.map(({ id, name }) => ({ id: String(id), label: name })),
    clients: data.clients.map(({ id, name }) => ({ id: String(id), label: name })),
    tags: data.tags.map(({ id, name }) => ({ id: String(id), label: name })),
  } : { contexts: [], types: [], clients: [], tags: [] }
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const activeFilterCount = Object.values(filters).filter((value) => value.length > 0).length
  const filteredRows = rows.filter((row) => {
    const matchesSearch = !normalizedSearch || [row.meta.title, row.meta.slug]
      .some((value) => value.toLocaleLowerCase().includes(normalizedSearch))
    const matchesType = filters.types.length === 0
      || filters.types.includes(String(row.type.id))
    const matchesClient = filters.clients.length === 0
      || (row.meta.client !== null && filters.clients.includes(String(row.meta.client.id)))
    const matchesTags = filters.tags.length === 0
      || row.tags.some((tag) => filters.tags.includes(String(tag.id)))
    const scopedContexts = filters.contexts.length === 0
      ? row.publicationContexts
      : row.publicationContexts.filter((item) => filters.contexts.includes(String(item.context.id)))
    const matchesContext = filters.contexts.length === 0 || scopedContexts.length > 0
    const matchesVisibility = filters.visibility.length === 0 || filters.visibility.some((value) => {
      if (value === 'visible') return scopedContexts.some((item) => item.visible)
      return scopedContexts.some((item) => !item.visible)
        || (filters.contexts.length === 0 && scopedContexts.length === 0)
    })

    return matchesSearch && matchesType && matchesClient && matchesTags
      && matchesContext && matchesVisibility
  })

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1)
    setPage((current) => Math.min(current, lastPage))
  }, [filteredRows.length, rowsPerPage])

  const updateFilter = (key: FilterKey, value: string[]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(0)
  }

  const columns: PublicationColumn[] = [
    {
      id: 'image',
      label: 'Image',
      className: 'publication-image-column',
      render: (row) => {
        const thumbnail = getThumbnail(row)
        return thumbnail ? (
          <img
            className="publication-thumbnail"
            src={getPreviewUrl(thumbnail)}
            alt=""
            loading="lazy"
          />
        ) : <span className="publication-thumbnail-placeholder" aria-label="No image" />
      },
    },
    {
      id: 'mainInfo',
      label: 'Main info',
      className: 'publication-info-column',
      render: (row) => (
        <div className="publication-main-info">
          <div className="publication-meta-line">
            <span className="publication-id">{row.id}</span>
            <span className="publication-meta-separator" aria-hidden="true" />
            {row.publicationContexts.some((item) => item.featured)
              ? <StarIcon className="publication-featured" titleAccess="Featured" />
              : <StarBorderIcon className="publication-featured publication-featured-off" titleAccess="Not featured" />}
            <span className="publication-meta-separator" aria-hidden="true" />
            <span
              className={`publication-visibility publication-visibility-${getVisibility(row)}`}
              title={getVisibility(row)}
            >
              {getVisibility(row) === 'visible'
                ? <VisibilityIcon aria-hidden="true" />
                : <VisibilityOffIcon aria-hidden="true" />}
            </span>
            <span className="publication-meta-separator" aria-hidden="true" />
            <span className="publication-context-names">
              {row.publicationContexts.map((item) => item.context.name).join(', ') || 'No context'}
            </span>
          </div>
          <strong className="publication-title">{row.meta.title}</strong>
          <span className="publication-client">{row.meta.client?.name ?? 'No client'}</span>
          <span className="publication-type">{row.type.name}</span>
          <span className="publication-date">{formatDate(row.meta.date)}</span>
        </div>
      ),
    },
    {
      id: 'tags',
      label: 'Tags',
      className: 'publication-tags-column',
      render: (row) => (
        <div className="publication-chip-list">
          {row.tags.slice(0, 3).map((tag) => <span className="publication-tag-chip" key={tag.id}>{tag.name}</span>)}
          {row.tags.length > 3 && <span className="publication-more-chip">+{row.tags.length - 3}</span>}
          {row.tags.length === 0 && <span className="publication-muted">—</span>}
        </div>
      ),
    },
    {
      id: 'skills',
      label: 'Skills',
      className: 'publication-skills-column',
      render: (row) => (
        <div className="publication-chip-list">
          {row.skills.slice(0, 3).map((skill) => (
            <span className="publication-skill-chip" key={skill.id}>
              {skill.icon && <img src={skill.icon} alt="" loading="lazy" />}
              {skill.name}
            </span>
          ))}
          {row.skills.length > 3 && <span className="publication-more-chip">+{row.skills.length - 3}</span>}
          {row.skills.length === 0 && <span className="publication-muted">—</span>}
        </div>
      ),
    },
    {
      id: 'assets',
      label: 'Assets',
      className: 'publication-assets-column',
      render: (row) => (
        <div className="publication-asset-counts">
          {row.directAssetCount > 0 && (
            <span title="Publication assets"><ImageOutlinedIcon aria-hidden="true" />{row.directAssetCount} publication</span>
          )}
          {row.collectionCount > 0 && (
            <span title="Collections">{row.collectionCount} collections</span>
          )}
          {row.collectionAssetCount > 0 && (
            <span className="publication-asset-counts-nested" title="Collection item assets"><ImageOutlinedIcon aria-hidden="true" />{row.collectionAssetCount} item</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      className: 'publication-actions-column',
      render: (row) => (
        <span className="data-grid-actions">
          <Tooltip title={`Edit ${row.meta.title}`}>
            <IconButton
              aria-label={`Edit ${row.meta.title}`}
              onClick={() => navigate(`/publications/${row.id}/edit`)}
            >
              <EditIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${row.meta.title}`}>
            <IconButton
              aria-label={`Delete ${row.meta.title}`}
              onClick={() => {
                setDeleteError('')
                setPendingDelete(row)
              }}
            >
              <DeleteIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
        </span>
      ),
    },
  ]
  const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.id))
  const columnOptions = columns.map(({ id, label }) => ({ id, label }))
  const pageRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deletePublicationRequest(pendingDelete.id)
      setSuccessMessage(`Publication "${pendingDelete.meta.title}" deleted.`)
      setPendingDelete(null)
      reload()
    } catch (deleteFailure) {
      setDeleteError(getErrorMessage(deleteFailure, 'Could not delete publication.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="publication-list-view" aria-label="Publications list">
      {successMessage && (
        <Alert className="publication-list-message" onClose={() => setSuccessMessage('')} severity="success">
          {successMessage}
        </Alert>
      )}
      {error ? (
        <Alert
          action={<Button color="inherit" onClick={reload} size="small">Retry</Button>}
          className="publication-list-message"
          severity="error"
        >
          {error}
        </Alert>
      ) : isLoading ? (
        <div className="publication-list-loading"><CircularProgress size={28} /><span>Loading publications</span></div>
      ) : data && data.publications.length === 0 ? (
        <div className="publication-list-empty">
          <h2>No publications yet</h2>
          <p>There are no publications to show.</p>
        </div>
      ) : (
        <>
          <div className="publication-list-toolbar">
            <TextField
              className="publication-search"
              label="Search title or slug"
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              size="small"
              value={search}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                },
              }}
            />
            <Button
              aria-expanded={showFilters}
              onClick={() => setShowFilters((isVisible) => !isVisible)}
              size="small"
              startIcon={<TuneIcon />}
              variant={showFilters ? 'contained' : 'outlined'}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
            <Autocomplete
              className="publication-column-picker"
              disableCloseOnSelect
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              multiple
              onChange={(_event, selected) => setHiddenColumns(selected.map((option) => option.id))}
              options={columnOptions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Hide columns"
                  placeholder={hiddenColumns.length === 0 ? 'Select' : ''}
                />
              )}
              renderOption={(props, option) => <li {...props} key={option.id}>{option.label}</li>}
              size="small"
              value={columnOptions.filter((option) => hiddenColumns.includes(option.id))}
            />
          </div>
          {showFilters && (
            <div className="publication-list-filters">
              <MultiFilter
                label="Visibility"
                onChange={(value) => updateFilter('visibility', value)}
                options={visibilityOptions}
                value={filters.visibility}
              />
              <MultiFilter
                label="Context"
                onChange={(value) => updateFilter('contexts', value)}
                options={filterOptions.contexts}
                value={filters.contexts}
              />
              <MultiFilter
                label="Type"
                onChange={(value) => updateFilter('types', value)}
                options={filterOptions.types}
                value={filters.types}
              />
              <MultiFilter
                label="Client"
                onChange={(value) => updateFilter('clients', value)}
                options={filterOptions.clients}
                value={filters.clients}
              />
              <MultiFilter
                label="Tags"
                onChange={(value) => updateFilter('tags', value)}
                options={filterOptions.tags}
                value={filters.tags}
              />
            </div>
          )}
          {filteredRows.length === 0 ? (
            <div className="publication-list-empty publication-list-no-results">
              <h2>No publications found</h2>
              <p>Try changing the search or filters.</p>
            </div>
          ) : (
            <div className="publication-table-wrap">
              <TableContainer>
                <Table className="publication-table" size="small">
                  <TableHead>
                    <TableRow>
                      {visibleColumns.map((column) => (
                        <TableCell className={column.className} key={column.id}>{column.label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageRows.map((row) => (
                      <TableRow key={row.id} hover>
                        {visibleColumns.map((column) => (
                          <TableCell className={column.className} key={column.id}>
                            {column.render(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredRows.length}
                onPageChange={(_event, nextPage) => setPage(nextPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(0)
                }}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[12, 24, 48]}
              />
            </div>
          )}
        </>
      )}
      <Dialog
        aria-labelledby="delete-publication-title"
        onClose={() => !isDeleting && setPendingDelete(null)}
        open={pendingDelete !== null}
      >
        <DialogTitle id="delete-publication-title">Delete publication?</DialogTitle>
        <DialogContent>
          {deleteError && <Alert className="publication-list-message" severity="error">{deleteError}</Alert>}
          <DialogContentText>
            Are you sure you want to delete &quot;{pendingDelete?.meta.title}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="error" disabled={isDeleting} onClick={confirmDelete} variant="contained">
            {isDeleting ? 'Deleting' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default PublicationList
