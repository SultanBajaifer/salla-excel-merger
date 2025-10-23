import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  selectFile: () => Promise<string | null>
  saveFile: (defaultPath: string) => Promise<string | null>
  readExcelFile: (filePath: string) => Promise<unknown[][]>
  saveExcelFile: (
    filePath: string,
    data: unknown[][],
    mainFilePath: string,
    mainFileRowCount: number,
    headerRowIndex: number,
    clearFormattingFromRow: number | null,
    preserveFirstRowFormatting: boolean
  ) => Promise<void>
  cleanExcelFile: (filePath: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
