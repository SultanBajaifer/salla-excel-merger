import { BrowserWindow, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import log from './logger'
import { IPC, isUpdateBlocking, type UpdateState } from '../shared/access'

// Updates are mandatory: once one is found it downloads immediately, the
// renderer shows a modal that cannot be dismissed, and the app restarts into
// the new version as soon as the download finishes.

const RECHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
const RESTART_DELAY_MS = 3000

let state: UpdateState = { status: 'idle' }
// Version of the update currently being handled, kept so a download error stays blocking.
let pendingVersion: string | undefined

function setState(next: UpdateState): void {
  state = next
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC.updateState, state)
  }
}

export function getUpdateState(): UpdateState {
  return state
}

export function isUpdatePending(): boolean {
  return isUpdateBlocking(state)
}

function checkForUpdates(): void {
  if (is.dev) {
    log.info('[updater] Skipping update check in development mode')
    return
  }
  // Don't restart a check or a download that is already in progress.
  if (state.status === 'checking' || (isUpdateBlocking(state) && state.status !== 'error')) return

  autoUpdater.checkForUpdates().catch((error) => {
    // Also reported through the 'error' event; logged here so the rejection is handled.
    log.error('[updater] checkForUpdates failed:', error)
  })
}

export function initUpdater(): void {
  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    // A retry after a failed download must keep the app blocked.
    setState(
      pendingVersion ? { status: 'available', version: pendingVersion } : { status: 'checking' }
    )
  })

  autoUpdater.on('update-available', (info) => {
    pendingVersion = info.version
    setState({ status: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    pendingVersion = undefined
    setState({ status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    setState({
      status: 'downloading',
      version: pendingVersion ?? '',
      percent: Math.round(progress.percent)
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    setState({ status: 'downloaded', version: info.version })
    log.info(`[updater] Update ${info.version} downloaded, restarting to install`)
    setTimeout(() => {
      // Silent install, then relaunch the app.
      autoUpdater.quitAndInstall(true, true)
    }, RESTART_DELAY_MS)
  })

  autoUpdater.on('error', (error) => {
    log.error('[updater] Error:', error)
    setState({ status: 'error', message: error?.message ?? String(error), version: pendingVersion })
  })

  ipcMain.handle(IPC.updateGetState, () => state)
  ipcMain.handle(IPC.updateRetry, () => checkForUpdates())

  checkForUpdates()
  setInterval(checkForUpdates, RECHECK_INTERVAL_MS)
}
