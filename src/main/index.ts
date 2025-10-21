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
      try {
        // Read the original main file to preserve formatting
        const originalWorkbook = new ExcelJS.Workbook()
        await originalWorkbook.xlsx.readFile(mainFilePath)
        const originalWorksheet = originalWorkbook.worksheets[0]

        // Create new workbook with same structure
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet(originalWorksheet.name || 'البيانات المدمجة')

        // Copy column widths from original
        originalWorksheet.columns.forEach((col, index) => {
          if (worksheet.columns[index]) {
            worksheet.columns[index].width = col.width
          }
        })

        // Add all data rows
        data.forEach((row, rowIndex) => {
          const newRow = worksheet.addRow(row)

          // Copy formatting from original worksheet for title row (row 0) and header row (row 1)
          if (rowIndex === 0 || rowIndex === 1) {
            const originalRow = originalWorksheet.getRow(rowIndex + 1)

            // Copy row height
            newRow.height = originalRow.height

            // Copy cell formatting
            newRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const originalCell = originalRow.getCell(colNumber)

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
          }
        })

        // Apply RTL to worksheet
        worksheet.views = [{ rightToLeft: true }]

        // Save the file
        await workbook.xlsx.writeFile(filePath)
        console.log('File saved successfully with formatting preserved:', filePath)
      } catch (error) {
        console.error('Error saving Excel file:', error)
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
