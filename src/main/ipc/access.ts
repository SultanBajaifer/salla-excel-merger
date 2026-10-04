import { clipboard, ipcMain } from 'electron'
import { IPC } from '../../shared/access'
import { activateLicense, getLicenseStatus, isLicensed } from '../license'
import { isUpdatePending } from '../updater'

type Handler = Parameters<typeof ipcMain.handle>[1]

/**
 * Registers an IPC handler that only runs when the app is licensed and no
 * mandatory update is pending. The renderer gate hides the UI in those cases;
 * this enforces the same rule in the main process so it can't be bypassed
 * from the renderer (e.g. by calling window.api from DevTools).
 */
export function handleProtected(channel: string, handler: Handler): void {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isLicensed()) throw new Error('ACCESS_DENIED: license required')
    if (isUpdatePending()) throw new Error('ACCESS_DENIED: update required')
    return handler(event, ...args)
  })
}

export function registerAccessHandlers(): void {
  ipcMain.handle(IPC.licenseGetStatus, () => getLicenseStatus())

  ipcMain.handle(IPC.licenseActivate, (_, licenseKey: unknown) =>
    typeof licenseKey === 'string'
      ? activateLicense(licenseKey)
      : { ok: false, reason: 'invalid-format' }
  )

  ipcMain.handle(IPC.clipboardWrite, (_, text: unknown) => {
    if (typeof text === 'string') clipboard.writeText(text)
  })
}
