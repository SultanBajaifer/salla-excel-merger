// Pure license primitives (no Electron imports) so they can be unit-tested and
// reused by the key-issuing scripts in scripts/license.
//
// Scheme:
//   machineId  = Crockford-base32(first 10 bytes of SHA-256(salt + raw OS machine id)),
//                shown to the user as XXXX-XXXX-XXXX-XXXX
//   licenseKey = Crockford-base32(Ed25519 signature over `${LICENSE_MESSAGE_PREFIX}${machineId}`)
//
// Only the public key ships with the app, so keys cannot be forged without the
// private key, and a key only verifies on the machine it was issued for.

import { createHash, createPrivateKey, createPublicKey, sign, verify, KeyObject } from 'crypto'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const MACHINE_ID_SALT = 'salla-excel-merger/machine-id/v1:'
const LICENSE_MESSAGE_PREFIX = 'salla-excel-merger/license/v1:'
const MACHINE_ID_BYTES = 10
const MACHINE_ID_LENGTH = 16 // 10 bytes * 8 / 5
const SIGNATURE_BYTES = 64
const LICENSE_KEY_LENGTH = 103 // ceil(64 bytes * 8 / 5)

export function base32Encode(bytes: Uint8Array): string {
  let out = ''
  let buffer = 0
  let bits = 0
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(buffer >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    out += ALPHABET[(buffer << (5 - bits)) & 31]
  }
  return out
}

/** Decodes Crockford base32. Returns null on any character outside the alphabet. */
export function base32Decode(text: string): Buffer | null {
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (const char of text) {
    const value = ALPHABET.indexOf(char)
    if (value === -1) return null
    buffer = ((buffer << 5) | value) & 0xffff
    bits += 5
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/**
 * Uppercases, drops separators/whitespace and maps the characters Crockford
 * base32 treats as look-alikes (O→0, I/L→1). Tolerates keys pasted from chat apps.
 */
function canonicalize(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
}

function group(text: string, size: number): string {
  return text.match(new RegExp(`.{1,${size}}`, 'g'))?.join('-') ?? ''
}

export function deriveMachineId(rawMachineId: string): string {
  const digest = createHash('sha256')
    .update(MACHINE_ID_SALT + rawMachineId.trim().toLowerCase())
    .digest()
  return group(base32Encode(digest.subarray(0, MACHINE_ID_BYTES)), 4)
}

/** Returns the canonical 16-character machine id, or null if malformed. */
export function normalizeMachineId(input: string): string | null {
  const canonical = canonicalize(input)
  if (canonical.length !== MACHINE_ID_LENGTH || base32Decode(canonical) === null) return null
  return canonical
}

export function formatMachineId(machineId: string): string {
  const normalized = normalizeMachineId(machineId)
  return normalized ? group(normalized, 4) : machineId
}

function licenseMessage(normalizedMachineId: string): Buffer {
  return Buffer.from(LICENSE_MESSAGE_PREFIX + normalizedMachineId, 'utf8')
}

export function publicKeyFromBase64(spkiDerBase64: string): KeyObject {
  return createPublicKey({ key: Buffer.from(spkiDerBase64, 'base64'), format: 'der', type: 'spki' })
}

export function publicKeyToBase64(key: KeyObject): string {
  return key.export({ format: 'der', type: 'spki' }).toString('base64')
}

export function privateKeyFromPem(pem: string): KeyObject {
  return createPrivateKey(pem)
}

export function issueLicenseKey(machineId: string, privateKey: KeyObject): string {
  const normalized = normalizeMachineId(machineId)
  if (!normalized) throw new Error(`Invalid machine id: ${machineId}`)
  const signature = sign(null, licenseMessage(normalized), privateKey)
  return group(base32Encode(signature), 8)
}

export type LicenseCheck = 'valid' | 'invalid-format' | 'invalid-key'

export function verifyLicenseKey(
  machineId: string,
  licenseKey: string,
  publicKey: KeyObject
): LicenseCheck {
  const normalizedMachineId = normalizeMachineId(machineId)
  const canonicalKey = canonicalize(licenseKey)
  if (!normalizedMachineId || canonicalKey.length !== LICENSE_KEY_LENGTH) return 'invalid-format'

  const signature = base32Decode(canonicalKey)
  if (!signature || signature.length !== SIGNATURE_BYTES) return 'invalid-format'

  try {
    return verify(null, licenseMessage(normalizedMachineId), publicKey, signature)
      ? 'valid'
      : 'invalid-key'
  } catch {
    return 'invalid-key'
  }
}

/** Extracts MachineGuid from `reg query HKLM\SOFTWARE\Microsoft\Cryptography /v MachineGuid`. */
export function parseWindowsMachineGuid(regOutput: string): string | null {
  return regOutput.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]{36})/)?.[1] ?? null
}

/** Extracts IOPlatformUUID from `ioreg -rd1 -c IOPlatformExpertDevice`. */
export function parseMacPlatformUuid(ioregOutput: string): string | null {
  return ioregOutput.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/)?.[1] ?? null
}
