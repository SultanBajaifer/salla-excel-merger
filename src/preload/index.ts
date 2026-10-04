import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC, type UpdateState } from '../shared/access'

// Custom APIs for renderer
const api = {
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (defaultPath: string) => ipcRenderer.invoke('save-file', defaultPath),
  readExcelFile: (filePath: string) => ipcRenderer.invoke('read-excel-file', filePath),
  saveExcelFile: (
    filePath: string,
    data: unknown[][],
    mainFilePath: string,
    mainFileRowCount: number,
    headerRowIndex: number
  ) =>
    ipcRenderer.invoke(
      'save-excel-file',
      filePath,
      data,
      mainFilePath,
      mainFileRowCount,
      headerRowIndex
    ),
  cleanExcelFile: (filePath: string) => ipcRenderer.invoke('clean-excel-file', filePath),
  detectBrands: (filePath: string) => ipcRenderer.invoke('detect-brands', filePath),
  extractByBrands: (filePath: string, selectedBrands: string[]) =>
    ipcRenderer.invoke('extract-by-brands', filePath, selectedBrands),

  // License gate
  getLicenseStatus: () => ipcRenderer.invoke(IPC.licenseGetStatus),
  activateLicense: (licenseKey: string) => ipcRenderer.invoke(IPC.licenseActivate, licenseKey),
  copyToClipboard: (text: string) => ipcRenderer.invoke(IPC.clipboardWrite, text),

  // Mandatory updater
  getUpdateState: () => ipcRenderer.invoke(IPC.updateGetState),
  retryUpdate: () => ipcRenderer.invoke(IPC.updateRetry),
  onUpdateState: (callback: (state: UpdateState) => void) => {
    const listener = (_: Electron.IpcRendererEvent, state: UpdateState): void => callback(state)
    ipcRenderer.on(IPC.updateState, listener)
    return () => {
      ipcRenderer.removeListener(IPC.updateState, listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
