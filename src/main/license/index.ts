import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { KeyObject } from 'crypto'
import log from '../logger'
import type { ActivationResult, LicenseStatus } from '../../shared/access'
import { formatMachineId, publicKeyFromBase64, verifyLicenseKey } from './core'
import { getMachineId } from './machineId'
import { LICENSE_PUBLIC_KEY } from './publicKey'

interface StoredLicense {
  version: 1
  machineId: string
  licenseKey: string
  activatedAt: string
}

const licenseFile = (): string => join(app.getPath('userData'), 'license.json')

// Development-only escape hatch so the app can be run before a key pair exists.
const skipInDev = is.dev && process.env.SALLA_SKIP_LICENSE === '1'

let status: LicenseStatus | undefined
let publicKey: KeyObject | undefined

function getPublicKey(): KeyObject {
  if (!LICENSE_PUBLIC_KEY) {
    throw new Error('No license public key is configured (run `npm run license:keygen`)')
  }
  publicKey ??= publicKeyFromBase64(LICENSE_PUBLIC_KEY)
  return publicKey
}

function readStoredKey(): string | null {
  const file = licenseFile()
  if (!existsSync(file)) return null
  try {
    const stored = JSON.parse(readFileSync(file, 'utf8')) as Partial<StoredLicense>
    return typeof stored.licenseKey === 'string' ? stored.licenseKey : null
  } catch (error) {
    log.warn('[license] Could not read stored license:', error)
    return null
  }
}

function computeStatus(): LicenseStatus {
  try {
    const machineId = getMachineId()
    if (skipInDev) {
      log.warn('[license] SALLA_SKIP_LICENSE=1 — license check skipped (development only)')
      return { state: 'licensed', machineId }
    }

    const storedKey = readStoredKey()
    // Always verify against the current machine, so a copied license.json does not carry over.
    if (storedKey && verifyLicenseKey(machineId, storedKey, getPublicKey()) === 'valid') {
      return { state: 'licensed', machineId }
    }
    return { state: 'unlicensed', machineId }
  } catch (error) {
    log.error('[license] Failed to determine license status:', error)
    return { state: 'error', message: error instanceof Error ? error.message : String(error) }
  }
}

export function getLicenseStatus(): LicenseStatus {
  status ??= computeStatus()
  return status
}

export function isLicensed(): boolean {
  return getLicenseStatus().state === 'licensed'
}

export function activateLicense(licenseKey: string): ActivationResult {
  try {
    const machineId = getMachineId()
    const result = verifyLicenseKey(machineId, licenseKey, getPublicKey())
    if (result !== 'valid') {
      log.warn('[license] Activation rejected:', result)
      return { ok: false, reason: result }
    }

    const stored: StoredLicense = {
      version: 1,
      machineId: formatMachineId(machineId),
      licenseKey: licenseKey.trim(),
      activatedAt: new Date().toISOString()
    }
    const file = licenseFile()
    writeFileSync(`${file}.tmp`, JSON.stringify(stored, null, 2), 'utf8')
    renameSync(`${file}.tmp`, file)

    status = { state: 'licensed', machineId }
    log.info('[license] Activated for machine', machineId)
    return { ok: true }
  } catch (error) {
    log.error('[license] Activation failed:', error)
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : String(error)
    }
  }
}
