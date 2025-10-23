import type { CellValue } from '../store/useAppStore'

/**
 * Clean Excel data by:
 * - Finding the first valid header row
 * - Removing empty rows and columns
 * - Cleaning spaces, newlines from cell values
 */
export function cleanExcelData(data: CellValue[][]): CellValue[][] {
  if (!data || data.length === 0) {
    return []
  }

  // Find the first valid header row (row with at least 3 non-empty cells)
  const headerRowIndex = findHeaderRow(data)
  if (headerRowIndex === -1) {
    return data // Return original if no valid header found
  }

  // Extract headers and data rows
  const headers: CellValue[] = data[headerRowIndex].map((v) =>
    typeof v === 'string' ? v.trim().replace(/\r|\n/g, ' ') : v
  )

  const rows: CellValue[][] = []
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i]
    const cleanedRow = row.map((v) => (typeof v === 'string' ? v.trim().replace(/\r|\n/g, ' ') : v))

    // Skip completely empty rows
    if (cleanedRow.some((v) => v !== null && v !== '' && v !== undefined)) {
      rows.push(cleanedRow)
    }
  }

  // Find columns that have at least one non-empty value
  const validColumns = headers.map((_, colIndex) => {
    // Check if header is non-empty
    const headerValid = headers[colIndex] !== null && headers[colIndex] !== ''
    // Check if at least one data cell in this column is non-empty
    const hasData = rows.some((row) => {
      const cell = row[colIndex]
      return cell !== null && cell !== '' && cell !== undefined
    })
    return headerValid || hasData
  })

  // Filter headers and rows to keep only valid columns
  const filteredHeaders = headers.filter((_, i) => validColumns[i])
  const filteredRows = rows.map((row) => row.filter((_, i) => validColumns[i]))

  // Return cleaned data with headers as first row
  return [filteredHeaders, ...filteredRows]
}

/**
 * Find the first row that appears to be a header row
 * (has at least 3 non-empty cells)
 */
function findHeaderRow(data: CellValue[][]): number {
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const filledCells = row.filter((v) => v !== null && v !== '' && v !== undefined).length
    if (filledCells >= 3) {
      return i
    }
  }
  return -1 // No valid header row found
}
