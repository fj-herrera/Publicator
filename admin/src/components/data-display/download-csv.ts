function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const fileUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(fileUrl)
}
