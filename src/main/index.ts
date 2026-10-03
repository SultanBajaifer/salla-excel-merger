import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import log from './logger'
import { createWindow } from './window'
import { initUpdater } from './updater'
import { registerAccessHandlers } from './ipc/access'
import { registerDialogHandlers } from './ipc/dialogs'
import { registerExcelHandlers } from './ipc/excel'
import { registerPythonHandlers } from './ipc/python'

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  log.info(`Starting ${app.getName()} v${app.getVersion()}`)

  // Must match `appId` in electron-builder.yml
  electronApp.setAppUserModelId('com.electron.salla-excel-merger')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAccessHandlers()
  registerDialogHandlers()
  registerExcelHandlers()
  registerPythonHandlers()

  createWindow()
  initUpdater()

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
