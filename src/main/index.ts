import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import ExcelJS from 'exceljs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execFileAsync = promisify(execFile)

// Get the path to the Python script/executable
const getPythonScriptPath = (scriptName: string): string => {
  const isDev = import.meta.env.DEV
  if (isDev) {
    return join(__dirname, `../../scripts/${scriptName}.py`)
  }
  // In production, use the bundled executable
  const extension = process.platform === 'win32' ? '.exe' : ''
  return join(process.resourcesPath, 'python', `${scriptName}${extension}`)
}

// Configure auto-updater
autoUpdater.logger = console
autoUpdater.autoDownload = false // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true

function createWindow(): BrowserWindow {
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
  if (is.dev && import.meta.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(import.meta.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info)
  dialog
    .showMessageBox({
      type: 'info',
      title: 'تحديث متوفر',
      message: `تحديث جديد متاح (${info.version})`,
      detail: 'هل تريد تحميل التحديث الآن؟',
      buttons: ['نعم', 'لاحقاً']
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
})

autoUpdater.on('update-not-available', () => {
  console.log('Update not available.')
})

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err)
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond}`
  log_message = log_message + ` - Downloaded ${progressObj.percent}%`
  log_message = log_message + ` (${progressObj.transferred}/${progressObj.total})`
  console.log(log_message)
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info)
  dialog
    .showMessageBox({
      type: 'info',
      title: 'تحديث جاهز',
      message: 'تم تحميل التحديث بنجاح',
      detail: 'سيتم تثبيت التحديث عند إعادة تشغيل التطبيق. هل تريد إعادة التشغيل الآن؟',
      buttons: ['إعادة التشغيل', 'لاحقاً']
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
})

function checkForUpdates(): void {
  // Don't check for updates in development
  if (is.dev) {
    console.log('Skipping update check in development mode')
    return
  }

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('Failed to check for updates:', err)
  })
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
      console.error('Error reading Excel file:', error)
      throw error
    }
  })

  // Clean Excel file handler using Python script
  ipcMain.handle('clean-excel-file', async (_, filePath: string) => {
    try {
      const pythonPath = getPythonScriptPath('clean_excel')
      const isDev = process.env.NODE_ENV === 'development'

      console.log('[clean-excel-file] Environment:', {
        isDev,
        processResourcePath: process.resourcesPath,
        execPath: process.execPath,
        cwd: process.cwd(),
        pythonPath
      })
      console.log('[clean-excel-file] Using Python script at:', pythonPath)
      console.log('[clean-excel-file] Cleaning file:', filePath)

      // Check if Python executable exists
      const exists = existsSync(pythonPath)
      console.log('[clean-excel-file] Python executable exists:', exists)

      let stdout: string, stderr: string

      if (isDev) {
        // In development, run the Python script directly
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
        const result = await execFileAsync(pythonCmd, [pythonPath, filePath])
        stdout = result.stdout
        stderr = result.stderr
      } else {
        // In production, run the bundled executable
        const result = await execFileAsync(pythonPath, [filePath])
        stdout = result.stdout
        stderr = result.stderr
      }

      if (stderr) {
        console.warn('[clean-excel-file] Python stderr:', stderr)
      }

      // The Python script prints the cleaned file path to stdout
      const cleanedPath = stdout.trim()
      console.log('[clean-excel-file] File cleaned successfully:', cleanedPath)

      return cleanedPath
    } catch (error) {
      console.error('[clean-excel-file] Error cleaning Excel file:', error)
      throw error
    }
  })

  // Detect brands from Excel file
  ipcMain.handle('detect-brands', async (_, filePath: string) => {
    try {
      const pythonPath = getPythonScriptPath('extract_brands')
      const isDev = process.env.NODE_ENV === 'development'

      console.log('[detect-brands] Using Python script at:', pythonPath)
      console.log('[detect-brands] Detecting brands in file:', filePath)

      let stdout: string, stderr: string

      if (isDev) {
        // In development, run the Python script directly
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
        const result = await execFileAsync(pythonCmd, [pythonPath, 'detect', filePath])
        stdout = result.stdout
        stderr = result.stderr
      } else {
        // In production, run the bundled executable
        const result = await execFileAsync(pythonPath, ['detect', filePath])
        stdout = result.stdout
        stderr = result.stderr
      }

      if (stderr) {
        console.warn('[detect-brands] Python stderr:', stderr)
      }

      // Parse the JSON response from the Python script
      const result = JSON.parse(stdout.trim())
      console.log('[detect-brands] Detected brands:', result)

      return result
    } catch (error) {
      console.error('[detect-brands] Error detecting brands:', error)
      throw error
    }
  })

  // Extract products by selected brands
  ipcMain.handle('extract-by-brands', async (_, filePath: string, selectedBrands: string[]) => {
    try {
      const pythonPath = getPythonScriptPath('extract_brands')
      const isDev = process.env.NODE_ENV === 'development'

      console.log('[extract-by-brands] Using Python script at:', pythonPath)
      console.log('[extract-by-brands] Extracting products for brands:', selectedBrands)
      console.log('[extract-by-brands] From file:', filePath)

      const brandsJson = JSON.stringify(selectedBrands)

      let stdout: string, stderr: string

      if (isDev) {
        // In development, run the Python script directly
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
        const result = await execFileAsync(pythonCmd, [pythonPath, 'extract', filePath, brandsJson])
        stdout = result.stdout
        stderr = result.stderr
      } else {
        // In production, run the bundled executable
        const result = await execFileAsync(pythonPath, ['extract', filePath, brandsJson])
        stdout = result.stdout
        stderr = result.stderr
      }

      if (stderr) {
        console.warn('[extract-by-brands] Python stderr:', stderr)
      }

      // Parse the JSON response from the Python script
      const result = JSON.parse(stdout.trim())
      console.log('[extract-by-brands] Extraction result:', result)

      if (!result.success) {
        throw new Error(result.error)
      }

      return result
    } catch (error) {
      console.error('[extract-by-brands] Error extracting by brands:', error)
      throw error
    }
  })

  // Excel file saving handler with formatting preservation
  ipcMain.handle(
    'save-excel-file',
    async (
      _,
      filePath: string,
      data: unknown[][],
      mainFilePath: string,
      mainFileRowCount: number,
      headerRowIndex: number
    ) => {
      console.log('[save-excel-file] invoked', {
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

        // Preserve formatting for ALL rows from the original main file (up to mainFileRowCount)
        // This includes all rows above the header, the header row itself, and original data rows
        // New product rows (after mainFileRowCount) will have clean/default formatting
        console.log(
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
            console.debug('[save-excel-file] row', rowIndex, row)
          }
        })

        // Merge the first row across all used columns and ensure it becomes a single cell with one value
        // UNLESS the first cell contains "No. (غير قابل للتعديل)" - in that case, skip merging
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

        // Check if the first cell contains "No. (غير قابل للتعديل)"
        // If so, skip merging, centering, and clearing
        const titleValueStr = String(titleValue || '').trim()
        const skipMerging = titleValueStr.includes('No. (غير قابل للتعديل)')
        console.log('[save-excel-file] skipMerging:', skipMerging, 'titleValue:', titleValueStr)

        if (!skipMerging) {
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
        } else {
          console.log(
            '[save-excel-file] skipping merge/center/clear because first cell contains "No. (غير قابل للتعديل)"'
          )
          // Keep the first row as-is without merging or centering
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

  // Check for updates after a short delay to let the app initialize
  setTimeout(() => {
    checkForUpdates()
  }, 3000)

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
