import { Autocomplete, TextField } from '@mui/material'
import type { CollectionFilterValues, FilterOption } from './collection-filter-types'

type FilterSelectProps = {
  label: string
  options: FilterOption[]
  value: string[]
  onChange: (value: string[]) => void
}

function FilterSelect({ label, options, value, onChange }: FilterSelectProps) {
  return (
    <Autocomplete
      className="collection-filter"
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      multiple
      onChange={(_event, selected) => onChange(selected.map((option) => option.id))}
      options={options}
      renderInput={(params) => <TextField {...params} label={label} placeholder="Select" />}
      size="small"
      value={options.filter((option) => value.includes(option.id))}
    />
  )
}

type CollectionFiltersProps = {
  values: CollectionFilterValues
  publications: FilterOption[]
  contexts: FilterOption[]
  types: FilterOption[]
  clients: FilterOption[]
  onChange: (values: CollectionFilterValues) => void
}

function CollectionFilters({
  values,
  publications,
  contexts,
  types,
  clients,
  onChange,
}: CollectionFiltersProps) {
  return (
    <div className="collection-filters">
      <FilterSelect
        label="Publication"
        onChange={(selected) => onChange({ ...values, publications: selected })}
        options={publications}
        value={values.publications}
      />
      <div className="collection-filters-row">
        <FilterSelect
          label="Context"
          onChange={(selected) => onChange({ ...values, contexts: selected })}
          options={contexts}
          value={values.contexts}
        />
        <FilterSelect
          label="Type"
          onChange={(selected) => onChange({ ...values, types: selected })}
          options={types}
          value={values.types}
        />
        <FilterSelect
          label="Client"
          onChange={(selected) => onChange({ ...values, clients: selected })}
          options={clients}
          value={values.clients}
        />
      </div>
    </div>
  )
}

export default CollectionFilters
