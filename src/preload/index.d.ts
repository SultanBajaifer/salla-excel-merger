import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  selectFile: () => Promise<string | null>
  saveFile: (defaultPath: string) => Promise<string | null>
  readExcelFile: (filePath: string) => Promise<any>
  saveExcelFile: (filePath: string, data: any) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
