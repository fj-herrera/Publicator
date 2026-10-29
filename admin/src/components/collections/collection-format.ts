const dateFormatter = new Intl.DateTimeFormat('es-ES')

// Dates arrive as YYYY-MM-DD; parsing them as local time avoids a one-day shift.
export function formatCollectionDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}
