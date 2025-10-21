import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ExcelJS from 'exceljs'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    title: 'دمج ملفات Excel لمتجر سلة',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // File selection handlers
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'ملفات Excel', extensions: ['xlsx', 'xls'] },
        { name: 'جميع الملفات', extensions: ['*'] }
      ]
    })

    if (result.canceled) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('save-file', async (_, defaultPath: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'ملفات Excel', extensions: ['xlsx'] }]
    })

    if (result.canceled) {
      return null
    }

    return result.filePath
  })

  // Excel file reading handler
  ipcMain.handle('read-excel-file', async (_, filePath: string) => {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filePath)

      const worksheet = workbook.worksheets[0]
      const data: unknown[][] = []

      // Read all rows
      worksheet.eachRow((row) => {
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
      console.error('Error reading Excel file:', error)
      throw error
    }
  })

  // Excel file saving handler with formatting preservation
  ipcMain.handle(
    'save-excel-file',
    async (_, filePath: string, data: unknown[][], mainFilePath: string) => {
      console.log('[save-excel-file] invoked', { filePath, mainFilePath, rows: data?.length ?? 0 })
      try {
        // Try to read the original main file to preserve formatting; if it fails or has no sheets, proceed without template
        let originalWorksheet: ExcelJS.Worksheet | undefined
        if (mainFilePath) {
          try {
            console.log('[save-excel-file] attempting to read template:', mainFilePath)
            const originalWorkbook = new ExcelJS.Workbook()
            await originalWorkbook.xlsx.readFile(mainFilePath)
            originalWorksheet = originalWorkbook.worksheets[0]
            if (originalWorksheet) {
              console.log(
                '[save-excel-file] template loaded, sheet name:',
                originalWorksheet.name,
                'cols:',
                originalWorksheet.columnCount,
                'rows:',
                originalWorksheet.rowCount
              )
            } else {
              console.warn('[save-excel-file] template workbook has no worksheets')
            }
          } catch (err) {
            console.warn(
              '[save-excel-file] Could not read original workbook, proceeding without template formatting:',
              err
            )
            originalWorksheet = undefined
          }
        } else {
          console.log('[save-excel-file] no template path provided, skipping template read')
        }

        // Create new workbook with same structure (use original name if available)
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet(originalWorksheet?.name || 'البيانات المدمجة')
        console.log('[save-excel-file] created new worksheet:', worksheet.name)

        // Copy column widths from original if available
        if (
          originalWorksheet &&
          Array.isArray(originalWorksheet.columns) &&
          originalWorksheet.columns.length > 0
        ) {
          console.log(
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
          console.log('[save-excel-file] no template columns to copy')
        }

        // Add all data rows
        console.log('[save-excel-file] writing rows to worksheet')
        data.forEach((row, rowIndex) => {
          const newRow = worksheet.addRow(row)

          // Copy formatting from original worksheet for title row (row 0) and header row (row 1) only if originalWorksheet exists
          if (originalWorksheet && (rowIndex === 0 || rowIndex === 1)) {
            const originalRow = originalWorksheet.getRow(rowIndex + 1)
            if (originalRow) {
              // Copy row height
              newRow.height = originalRow.height

              // Copy cell formatting
              newRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const originalCell = originalRow.getCell(colNumber)
                if (!originalCell) return

                // Copy font
                if (originalCell.font) {
                  cell.font = { ...originalCell.font }
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
            } else {
              console.warn('[save-excel-file] expected original row not found:', rowIndex + 1)
            }
          }

          // Log the first few rows for debugging
          if (rowIndex < 3) {
            console.debug('[save-excel-file] row', rowIndex, row)
          }
        })

        // Merge the first row across all used columns and ensure it becomes a single cell with one value
        const firstRowIndex = 1
        const totalCols = Math.max(worksheet.columnCount, data[0]?.length ?? 1)
        console.log(
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
        console.log('[save-excel-file] titleValue determined:', titleValue)

        // Unmerge any existing merges that intersect the first row to avoid merge conflicts
        if (totalCols > 1) {
          try {
            const range = `A${firstRowIndex}:${colNumToLetter(totalCols)}${firstRowIndex}`
            console.log('[save-excel-file] attempting to unmerge range (if any):', range)
            worksheet.unMergeCells(range)
          } catch (err) {
            console.warn('[save-excel-file] unmergeCells failed or nothing to unmerge:', err)
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
          console.log(
            '[save-excel-file] merging first row from A1 to',
            colNumToLetter(totalCols) + '1'
          )
          worksheet.mergeCells(firstRowIndex, 1, firstRowIndex, totalCols)
        } else {
          console.log('[save-excel-file] only one column, skipping merge')
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
            console.log('[save-excel-file] applied original title cell styles')
          } else {
            console.log(
              '[save-excel-file] original first cell not found; skipped applying original title styles'
            )
          }
        }

        // Apply RTL to worksheet
        worksheet.views = [{ rightToLeft: true }]
        console.log('[save-excel-file] set worksheet to RTL')

        // Save the file
        console.log('[save-excel-file] writing file to disk:', filePath)
        await workbook.xlsx.writeFile(filePath)
        console.log(
          '[save-excel-file] File saved successfully with formatting preserved:',
          filePath
        )
      } catch (error) {
        console.error('[save-excel-file] Error saving Excel file:', error)
        throw error
      }
    }
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
