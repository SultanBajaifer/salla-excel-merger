import { execFileSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { deriveMachineId, parseMacPlatformUuid, parseWindowsMachineGuid } from './core'

function readWindowsMachineGuid(): string | null {
  const windir = process.env.WINDIR || 'C:\\Windows'
  // A 32-bit process on 64-bit Windows must go through Sysnative to reach the 64-bit registry view.
  const system32 =
    process.arch === 'ia32' && process.env.PROCESSOR_ARCHITEW6432 ? 'Sysnative' : 'System32'
  const output = execFileSync(
    join(windir, system32, 'reg.exe'),
    ['query', 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
    { encoding: 'utf8', windowsHide: true }
  )
  return parseWindowsMachineGuid(output)
}

function readMacPlatformUuid(): string | null {
  const output = execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], {
    encoding: 'utf8'
  })
  return parseMacPlatformUuid(output)
}

function readLinuxMachineId(): string | null {
  for (const file of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
    if (existsSync(file)) {
      const id = readFileSync(file, 'utf8').trim()
      if (id) return id
    }
  }
  return null
}

function readRawMachineId(): string | null {
  switch (process.platform) {
    case 'win32':
      return readWindowsMachineGuid()
    case 'darwin':
      return readMacPlatformUuid()
    default:
      return readLinuxMachineId()
  }
}

let cached: string | undefined

/** The user-facing machine id (XXXX-XXXX-XXXX-XXXX). Throws if the OS id cannot be read. */
export function getMachineId(): string {
  if (cached) return cached
  const raw = readRawMachineId()
  if (!raw) throw new Error(`Unable to read the machine id on ${process.platform}`)
  cached = deriveMachineId(raw)
  return cached
}
