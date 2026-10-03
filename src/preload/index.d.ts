import { ElectronAPI } from '@electron-toolkit/preload'
import type { ActivationResult, LicenseStatus, UpdateState } from '../shared/access'

interface API {
  selectFile: () => Promise<string | null>
  saveFile: (defaultPath: string) => Promise<string | null>
  readExcelFile: (filePath: string) => Promise<unknown[][]>
  saveExcelFile: (
    filePath: string,
    data: unknown[][],
    mainFilePath: string,
    mainFileRowCount: number,
    headerRowIndex: number
  ) => Promise<void>
  cleanExcelFile: (filePath: string) => Promise<string>
  detectBrands: (filePath: string) => Promise<unknown>
  extractByBrands: (filePath: string, selectedBrands: string[]) => Promise<unknown>

  getLicenseStatus: () => Promise<LicenseStatus>
  activateLicense: (licenseKey: string) => Promise<ActivationResult>
  copyToClipboard: (text: string) => Promise<void>

  getUpdateState: () => Promise<UpdateState>
  retryUpdate: () => Promise<void>
  /** Subscribes to updater state changes; returns an unsubscribe function. */
  onUpdateState: (callback: (state: UpdateState) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
