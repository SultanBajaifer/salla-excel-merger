import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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
    ipcRenderer.invoke('extract-by-brands', filePath, selectedBrands)
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
