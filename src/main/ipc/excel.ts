import ExcelJS from 'exceljs'
import log from '../logger'
import { handleProtected } from './access'

export function registerExcelHandlers(): void {
  // Excel file reading handler
  handleProtected('read-excel-file', async (_, filePath: string) => {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filePath)

      const worksheet = workbook.worksheets[0]
      const data: unknown[][] = []

      // Read all rows including empty ones to preserve row numbers
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        const rowData: unknown[] = []
        row.eachCell({ includeEmpty: true }, (cell) => {
          const value = cell.value
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null
          ) {
            rowData.push(value)
          } else if (value && typeof value === 'object' && 'text' in value) {
            rowData.push(value.text)
          } else {
            rowData.push(String(value || ''))
          }
        })
        data.push(rowData)
      })

      return data
    } catch (error) {
      log.error('Error reading Excel file:', error)
      throw error
    }
  })

  // Excel file saving handler with formatting preservation
  handleProtected(
    'save-excel-file',
    async (
      _,
      filePath: string,
      data: unknown[][],
      mainFilePath: string,
      mainFileRowCount: number,
      headerRowIndex: number
    ) => {
      log.log('[save-excel-file] invoked', {
        filePath,
        mainFilePath,
        rows: data?.length ?? 0,
        mainFileRows: mainFileRowCount,
        headerRow: headerRowIndex
      })
      try {
        // Try to read the original main file to preserve formatting; if it fails or has no sheets, proceed without template
        let originalWorksheet: ExcelJS.Worksheet | undefined
        if (mainFilePath) {
          try {
            log.log('[save-excel-file] attempting to read template:', mainFilePath)
            const originalWorkbook = new ExcelJS.Workbook()
            await originalWorkbook.xlsx.readFile(mainFilePath)
            originalWorksheet = originalWorkbook.worksheets[0]
            if (originalWorksheet) {
              log.log(
                '[save-excel-file] template loaded, sheet name:',
                originalWorksheet.name,
                'cols:',
                originalWorksheet.columnCount,
                'rows:',
                originalWorksheet.rowCount
              )
            } else {
              log.warn('[save-excel-file] template workbook has no worksheets')
            }
          } catch (err) {
            log.warn(
              '[save-excel-file] Could not read original workbook, proceeding without template formatting:',
              err
            )
            originalWorksheet = undefined
          }
        } else {
          log.log('[save-excel-file] no template path provided, skipping template read')
        }

        // Create new workbook with same structure (use original name if available)
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet(originalWorksheet?.name || 'البيانات المدمجة')
        log.log('[save-excel-file] created new worksheet:', worksheet.name)

        // Copy column widths from original if available
        if (
          originalWorksheet &&
          Array.isArray(originalWorksheet.columns) &&
          originalWorksheet.columns.length > 0
        ) {
          log.log(
            '[save-excel-file] copying column widths from template, template columns:',
            originalWorksheet.columns.length
          )
          originalWorksheet.columns.forEach((col, index) => {
            // ensure the target column exists
            worksheet.getColumn(index + 1)
            if (worksheet.columns[index]) {
              worksheet.columns[index].width = col.width
            }
          })
        } else {
          log.log('[save-excel-file] no template columns to copy')
        }

        // Add all data rows
        log.log('[save-excel-file] writing rows to worksheet')

        // Preserve formatting for ALL rows from the original main file (up to mainFileRowCount)
        // This includes all rows above the header, the header row itself, and original data rows
        // New product rows (after mainFileRowCount) will have clean/default formatting
        log.log(
          '[save-excel-file] will preserve formatting for first',
          mainFileRowCount,
          'rows (all original file rows)'
        )

        data.forEach((row, rowIndex) => {
          const newRow = worksheet.addRow(row)

          // Determine if this row is the header row (0-based index)
          const isHeaderRow = rowIndex === headerRowIndex - 1

          // Copy formatting for all rows that came from the original main file
          // This preserves the original file's appearance for all its rows
          if (originalWorksheet && rowIndex < mainFileRowCount) {
            const originalRow = originalWorksheet.getRow(rowIndex + 1)
            if (originalRow && originalRow.hasValues) {
              // Copy row height
              newRow.height = originalRow.height

              // Copy cell formatting
              newRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const originalCell = originalRow.getCell(colNumber)
                if (!originalCell) return

                // For data rows (not header), remove bold, italic, and strikethrough
                // Header row keeps its original formatting including bold
                if (!isHeaderRow && rowIndex >= headerRowIndex) {
                  // This is a data row - clean formatting but preserve some properties
                  if (originalCell.font) {
                    cell.font = {
                      ...originalCell.font,
                      bold: false,
                      italic: false,
                      strike: false
                    }
                  }
                } else {
                  // Copy font as-is for title rows and header row
                  if (originalCell.font) {
                    cell.font = { ...originalCell.font }
                  }
                }

                // Copy fill
                if (originalCell.fill) {
                  cell.fill = { ...originalCell.fill }
                }

                // Copy border
                if (originalCell.border) {
                  cell.border = { ...originalCell.border }
                }

                // Copy alignment
                if (originalCell.alignment) {
                  cell.alignment = { ...originalCell.alignment }
                }

                // Copy number format
                if (originalCell.numFmt) {
                  cell.numFmt = originalCell.numFmt
                }
              })
            }
          }
          // New product rows (rowIndex >= mainFileRowCount) automatically get clean/default formatting

          // Log the first few rows for debugging
          if (rowIndex < 3) {
            log.debug('[save-excel-file] row', rowIndex, row)
          }
        })

        // Merge the first row across all used columns and ensure it becomes a single cell with one value
        // UNLESS the first cell contains "No. (غير قابل للتعديل)" - in that case, skip merging
        const firstRowIndex = 1
        const totalCols = Math.max(worksheet.columnCount, data[0]?.length ?? 1)
        log.log(
          '[save-excel-file] computed totalCols:',
          totalCols,
          'worksheet.columnCount:',
          worksheet.columnCount,
          'firstDataRowLength:',
          data[0]?.length
        )

        // helper: convert column number to letter (1 -> A, 27 -> AA)
        const colNumToLetter = (n: number): string => {
          let s = ''
          while (n > 0) {
            const rem = (n - 1) % 26
            s = String.fromCharCode(65 + rem) + s
            n = Math.floor((n - 1) / 26)
          }
          return s
        }

        // Ensure first row exists
        const firstRow = worksheet.getRow(firstRowIndex)

        // Determine the title value (prefer existing cell value, fall back to first data item or empty string)
        const existingValues = firstRow.values as unknown[] // ExcelJS stores values with 1-based index
        const titleValue = (existingValues?.[1] ?? data[0]?.[0] ?? '') as ExcelJS.CellValue
        log.log('[save-excel-file] titleValue determined:', titleValue)

        // Check if the first cell contains "No. (غير قابل للتعديل)"
        // If so, skip merging, centering, and clearing
        const titleValueStr = String(titleValue || '').trim()
        const skipMerging = titleValueStr.includes('No. (غير قابل للتعديل)')
        log.log('[save-excel-file] skipMerging:', skipMerging, 'titleValue:', titleValueStr)

        if (!skipMerging) {
          // Unmerge any existing merges that intersect the first row to avoid merge conflicts
          if (totalCols > 1) {
            try {
              const range = `A${firstRowIndex}:${colNumToLetter(totalCols)}${firstRowIndex}`
              log.log('[save-excel-file] attempting to unmerge range (if any):', range)
              worksheet.unMergeCells(range)
            } catch (err) {
              log.warn('[save-excel-file] unmergeCells failed or nothing to unmerge:', err)
            }
          }

          // Clear other cells in the first row so the merge will be clean. Keep only the top-left cell's value.
          for (let c = 2; c <= totalCols; c++) {
            const cell = firstRow.getCell(c)
            cell.value = null
            // best-effort clear style properties that might interfere; leave undefined-safe properties alone
            try {
              cell.style = {}
            } catch {
              // ignore style clear errors
            }
          }

          // Set the top-left cell value before merging
          const topLeft = firstRow.getCell(1)
          topLeft.value = titleValue

          // Merge only if there's more than one column
          if (totalCols > 1) {
            log.log(
              '[save-excel-file] merging first row from A1 to',
              colNumToLetter(totalCols) + '1'
            )
            worksheet.mergeCells(firstRowIndex, 1, firstRowIndex, totalCols)
          } else {
            log.log('[save-excel-file] only one column, skipping merge')
          }

          // After merging, always reference the merged master cell (A1)
          const titleCell = worksheet.getCell(firstRowIndex, 1)
          titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

          // Preserve some original styling for the merged title cell if available
          if (originalWorksheet) {
            const origFirstCell = originalWorksheet.getRow(1)?.getCell(1)
            if (origFirstCell) {
              if (origFirstCell.font) titleCell.font = { ...origFirstCell.font }
              if (origFirstCell.fill) titleCell.fill = { ...origFirstCell.fill }
              if (origFirstCell.border) titleCell.border = { ...origFirstCell.border }
              if (origFirstCell.alignment)
                titleCell.alignment = { ...titleCell.alignment, ...origFirstCell.alignment }
              log.log('[save-excel-file] applied original title cell styles')
            } else {
              log.log(
                '[save-excel-file] original first cell not found; skipped applying original title styles'
              )
            }
          }
        } else {
          log.log(
            '[save-excel-file] skipping merge/center/clear because first cell contains "No. (غير قابل للتعديل)"'
          )
          // Keep the first row as-is without merging or centering
        }

        // Apply RTL to worksheet
        worksheet.views = [{ rightToLeft: true }]
        log.log('[save-excel-file] set worksheet to RTL')

        // Save the file
        log.log('[save-excel-file] writing file to disk:', filePath)
        await workbook.xlsx.writeFile(filePath)
        log.log('[save-excel-file] File saved successfully with formatting preserved:', filePath)
      } catch (error) {
        log.error('[save-excel-file] Error saving Excel file:', error)
        throw error
      }
    }
  )
}
