import { Autocomplete, TextField } from '@mui/material'

type CollectionTypeFieldProps = {
  className: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

// Free-text field with suggestions: new types are created by typing them.
function CollectionTypeField({ className, options, value, onChange }: CollectionTypeFieldProps) {
  return (
    <Autocomplete
      className={className}
      forcePopupIcon={options.length > 0}
      freeSolo
      inputValue={value}
      noOptionsText="Create new type"
      open={options.length > 0 ? undefined : false}
      onInputChange={(_event, nextValue) => onChange(nextValue)}
      options={options}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Collection type"
          placeholder={options.length === 0 ? 'Create new type' : undefined}
          required
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, maxLength: 50 },
          }}
        />
      )}
    />
  )
}

export default CollectionTypeField
