// Issues a license key for one machine.
//   npm run license:issue -- <MACHINE-ID> [customer note]
// The customer finds their machine id on the activation screen.

import { appendFileSync, existsSync, readFileSync } from 'fs'
import { createPublicKey } from 'crypto'
import {
  formatMachineId,
  issueLicenseKey,
  normalizeMachineId,
  privateKeyFromPem,
  publicKeyFromBase64,
  publicKeyToBase64,
  verifyLicenseKey
} from '../../src/main/license/core'
import { LICENSE_PUBLIC_KEY } from '../../src/main/license/publicKey'
import { ISSUED_LOG_PATH, PRIVATE_KEY_PATH } from './paths'

const [machineIdArg, ...noteParts] = process.argv.slice(2)
const note = noteParts.join(' ')

if (!machineIdArg) {
  console.error('Usage: npm run license:issue -- <MACHINE-ID> [customer note]')
  process.exit(1)
}

const machineId = normalizeMachineId(machineIdArg)
if (!machineId) {
  console.error(`"${machineIdArg}" is not a valid machine id (expected XXXX-XXXX-XXXX-XXXX).`)
  process.exit(1)
}

if (!existsSync(PRIVATE_KEY_PATH)) {
  console.error(`Private key not found at:\n  ${PRIVATE_KEY_PATH}`)
  console.error('Restore it from your backup, or set LICENSE_PRIVATE_KEY_PATH.')
  process.exit(1)
}

const privateKey = privateKeyFromPem(readFileSync(PRIVATE_KEY_PATH, 'utf8'))

// Refuse to issue keys that the shipped app would reject.
if (!LICENSE_PUBLIC_KEY || publicKeyToBase64(createPublicKey(privateKey)) !== LICENSE_PUBLIC_KEY) {
  console.error('This private key does not match src/main/license/publicKey.ts.')
  console.error('Keys issued with it would not activate. Check you are using the right key file.')
  process.exit(1)
}

const licenseKey = issueLicenseKey(machineId, privateKey)
if (verifyLicenseKey(machineId, licenseKey, publicKeyFromBase64(LICENSE_PUBLIC_KEY)) !== 'valid') {
  console.error('Self-check failed: the issued key does not verify.')
  process.exit(1)
}

if (!existsSync(ISSUED_LOG_PATH)) {
  appendFileSync(ISSUED_LOG_PATH, 'issued_at,machine_id,note\n')
}
appendFileSync(
  ISSUED_LOG_PATH,
  `${new Date().toISOString()},${formatMachineId(machineId)},"${note.replace(/"/g, '""')}"\n`
)

console.log(`Machine ID:  ${formatMachineId(machineId)}`)
console.log(`License key:\n\n${licenseKey}\n`)
console.log(`Logged to ${ISSUED_LOG_PATH}`)
