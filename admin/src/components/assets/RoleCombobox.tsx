import { useState } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import './role-combobox.css'

interface RoleComboboxProps {
  id: string
  label: string
  value: string
  options: string[]
  disabled?: boolean
  createLabel?: string
  onChange: (value: string) => void
}

function RoleCombobox({
  id,
  label,
  value,
  options,
  disabled = false,
  createLabel = 'Create new role',
  onChange,
}: RoleComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFiltering, setIsFiltering] = useState(false)
  const normalizedValue = value.trim().toLowerCase()
  const filteredOptions = isFiltering
    ? options.filter((option) => option.toLowerCase().includes(normalizedValue))
    : options
  const canCreateRole = isFiltering && Boolean(value.trim()) && !options.some((option) => (
    option.toLowerCase() === normalizedValue
  ))
  const visibleOptions = [
    ...filteredOptions.map((option) => ({ value: option, label: option })),
    ...(canCreateRole ? [{ value: value.trim(), label: `${createLabel}: ${value.trim()}` }] : []),
  ]
  const listId = `${id}-options`

  const selectOption = (option: { value: string }) => {
    onChange(option.value)
    setIsOpen(false)
    setActiveIndex(-1)
    setIsFiltering(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (event.key === 'ArrowDown' && visibleOptions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((currentIndex) => (currentIndex + 1) % visibleOptions.length)
      return
    }

    if (event.key === 'ArrowUp' && visibleOptions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((currentIndex) => (
        currentIndex <= 0 ? visibleOptions.length - 1 : currentIndex - 1
      ))
      return
    }

    if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault()
      selectOption(visibleOptions[activeIndex])
    }
  }

  return (
    <div
      className="asset-role-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false)
          setActiveIndex(-1)
          setIsFiltering(false)
        }
      }}
    >
      <input
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-label={label}
        autoComplete="off"
        disabled={disabled}
        id={id}
        maxLength={50}
        onChange={(event) => {
          onChange(event.target.value)
          setActiveIndex(-1)
          setIsFiltering(true)
          setIsOpen(true)
        }}
        onFocus={() => {
          setIsFiltering(false)
          setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        value={value}
      />
      <button
        aria-label={isOpen ? 'Hide role options' : 'Show role options'}
        className="asset-role-toggle"
        disabled={disabled}
        onClick={() => {
          setIsFiltering(false)
          setIsOpen((open) => !open)
        }}
        onMouseDown={(event) => event.preventDefault()}
        type="button"
      >
        <ArrowDropDownIcon aria-hidden="true" />
      </button>
      {isOpen && !disabled && visibleOptions.length > 0 && (
        <div className="asset-role-options" id={listId} role="listbox">
          {visibleOptions.map((option, index) => (
            <button
              aria-selected={activeIndex === index}
              className={activeIndex === index ? 'asset-role-option-active' : ''}
              id={`${listId}-${index}`}
              key={`${option.value}-${index}`}
              onClick={() => selectOption(option)}
              onMouseDown={(event) => event.preventDefault()}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default RoleCombobox