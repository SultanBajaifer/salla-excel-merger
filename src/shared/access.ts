// Types and constants shared by the main process, preload and renderer for the
// license gate and the mandatory updater.

export const CONTACT_PHONE = '00966532839958'
export const CONTACT_WHATSAPP_URL = 'https://wa.me/966532839958'

export type LicenseStatus =
  | { state: 'licensed'; machineId: string }
  | { state: 'unlicensed'; machineId: string }
  | { state: 'error'; message: string }

export type ActivationResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-format' | 'invalid-key' | 'error'; message?: string }

export type UpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'not-available' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; version: string; percent: number }
  | { status: 'downloaded'; version: string }
  // `version` is set when the failure happened after an update was found
  // (i.e. while downloading), in which case the app stays blocked.
  | { status: 'error'; message: string; version?: string }

/**
 * Whether the app must be blocked until the update is installed.
 * A failed check with no known update (e.g. offline) does not block.
 */
export function isUpdateBlocking(state: UpdateState): boolean {
  switch (state.status) {
    case 'available':
    case 'downloading':
    case 'downloaded':
      return true
    case 'error':
      return state.version !== undefined
    default:
      return false
  }
}

export const IPC = {
  licenseGetStatus: 'license:get-status',
  licenseActivate: 'license:activate',
  updateGetState: 'update:get-state',
  updateRetry: 'update:retry',
  updateState: 'update:state',
  clipboardWrite: 'clipboard:write'
} as const
