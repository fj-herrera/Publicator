import { Alert, Autocomplete, Button, MenuItem, TextField } from '@mui/material'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import type {
  MainInfoErrors,
  MainInfoValues,
  PublicationFormCatalogs,
} from '../../entities/publication-form'
import './publication-form.css'

type Option = { id: number; name: string; description?: string | null }

type MultiSelectProps = {
  label: string
  options: Option[]
  selectedIds: number[]
  variant: 'standard' | 'outlined'
  required?: boolean
  error?: string
  onChange: (ids: number[]) => void
}

type PublicationMainInfoProps = {
  values: MainInfoValues
  errors: MainInfoErrors
  catalogs: PublicationFormCatalogs
  onTitleChange: (title: string) => void
  onSlugChange: (slug: string) => void
  onChange: (changes: Partial<MainInfoValues>) => void
  onContextsChange: (contextIds: number[]) => void
  onContinue: () => void
  isSaving: boolean
  saveError: string
}

function MultiSelect({
  label,
  options,
  selectedIds,
  variant,
  required,
  error,
  onChange,
}: MultiSelectProps) {
  const selected = selectedIds
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is Option => option !== undefined)

  return (
    <Autocomplete
      filterSelectedOptions
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      multiple
      onChange={(_event, next) => onChange(next.map((option) => option.id))}
      options={options}
      renderOption={(props, option) => (
        <li {...props}>
          <span className="publication-autocomplete-option">
            <span>{option.name}</span>
            {option.description && (
              <span className="publication-autocomplete-option-description">
                {option.description}
              </span>
            )}
          </span>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          error={Boolean(error)}
          helperText={error}
          label={label}
          required={required}
          variant={variant}
        />
      )}
      value={selected}
    />
  )
}

function PublicationMainInfo({
  values,
  errors,
  catalogs,
  onTitleChange,
  onSlugChange,
  onChange,
  onContextsChange,
  onContinue,
  isSaving,
  saveError,
}: PublicationMainInfoProps) {
  return (
    <div className="publication-main-info-form">
      <TextField
        className="publication-field-half"
        error={Boolean(errors.title)}
        helperText={errors.title}
        label="Title"
        onChange={(event) => onTitleChange(event.target.value)}
        required
        value={values.title}
        variant="standard"
      />
      <TextField
        className="publication-field-half"
        error={Boolean(errors.slug)}
        helperText={errors.slug}
        label="Slug"
        onChange={(event) => onSlugChange(event.target.value)}
        required
        value={values.slug}
        variant="standard"
      />
      <div className="publication-field-third">
        <MultiSelect
          error={errors.contexts}
          label="Context"
          onChange={onContextsChange}
          options={catalogs.contexts}
          required
          selectedIds={values.contexts.map((draft) => draft.contextId)}
          variant="standard"
        />
      </div>
      <TextField
        className="publication-field-third"
        error={Boolean(errors.typeId)}
        helperText={errors.typeId}
        label="Type"
        onChange={(event) => onChange({
          typeId: event.target.value === '' ? null : Number(event.target.value),
        })}
        required
        select
        value={values.typeId ?? ''}
        variant="standard"
      >
        {catalogs.types.map((type) => (
          <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
        ))}
      </TextField>
      <TextField
        className="publication-field-third"
        label="Client"
        onChange={(event) => onChange({
          clientId: event.target.value === '' ? null : Number(event.target.value),
        })}
        select
        value={values.clientId ?? ''}
        variant="standard"
      >
        <MenuItem value="">No client</MenuItem>
        {catalogs.clients.map((client) => (
          <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
        ))}
      </TextField>
      <div className="publication-field-full">
        <MultiSelect
          label="Tags"
          onChange={(tagIds) => onChange({ tagIds })}
          options={catalogs.tags}
          selectedIds={values.tagIds}
          variant="outlined"
        />
      </div>
      <div className="publication-field-full">
        <MultiSelect
          label="Skill Groups"
          onChange={(skillGroupIds) => onChange({ skillGroupIds })}
          options={catalogs.skillGroups.map((group) => ({
            ...group,
            description: group.description?.trim()
              || group.skills.map((skill) => skill.name).join(', '),
          }))}
          selectedIds={values.skillGroupIds}
          variant="outlined"
        />
      </div>
      <div className="publication-form-section-actions">
        {saveError && <Alert className="publication-main-info-save-error" severity="error">{saveError}</Alert>}
        <Button disabled={isSaving} endIcon={<ArrowDownwardIcon />} onClick={onContinue} variant="contained">
          {isSaving ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

export default PublicationMainInfo
