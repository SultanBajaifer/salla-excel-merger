import { generateKeyPairSync } from 'crypto'
import { describe, expect, it } from 'vitest'
import {
  base32Decode,
  base32Encode,
  deriveMachineId,
  formatMachineId,
  issueLicenseKey,
  normalizeMachineId,
  parseMacPlatformUuid,
  parseWindowsMachineGuid,
  publicKeyFromBase64,
  publicKeyToBase64,
  verifyLicenseKey
} from './core'

const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const other = generateKeyPairSync('ed25519')

const machineA = deriveMachineId('4c4c4544-0042-3510-8051-b4c04f4e3732')
const machineB = deriveMachineId('a1b2c3d4-0000-1111-2222-333344445555')

describe('base32', () => {
  it('round-trips arbitrary bytes', () => {
    for (const length of [0, 1, 5, 10, 63, 64]) {
      const bytes = Buffer.from(Array.from({ length }, (_, i) => (i * 37 + 11) & 0xff))
      expect(base32Decode(base32Encode(bytes))).toEqual(bytes)
    }
  })

  it('rejects characters outside the alphabet', () => {
    expect(base32Decode('ABCU')).toBeNull()
  })
})

describe('machine id', () => {
  it('is deterministic and formatted as XXXX-XXXX-XXXX-XXXX', () => {
    expect(machineA).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/)
    expect(deriveMachineId(' 4C4C4544-0042-3510-8051-B4C04F4E3732\n')).toBe(machineA)
    expect(machineB).not.toBe(machineA)
  })

  it('normalizes user-typed ids', () => {
    const canonical = machineA.replace(/-/g, '')
    expect(normalizeMachineId(machineA.toLowerCase())).toBe(canonical)
    expect(normalizeMachineId(` ${canonical} `)).toBe(canonical)
    expect(formatMachineId(canonical)).toBe(machineA)
  })

  it('rejects malformed ids', () => {
    expect(normalizeMachineId('')).toBeNull()
    expect(normalizeMachineId('ABCD-EFGH')).toBeNull()
    expect(normalizeMachineId('UUUU-UUUU-UUUU-UUUU')).toBeNull()
  })
})

describe('license keys', () => {
  const key = issueLicenseKey(machineA, privateKey)

  it('verifies on the machine it was issued for', () => {
    expect(verifyLicenseKey(machineA, key, publicKey)).toBe('valid')
  })

  it('is rejected on a different machine', () => {
    expect(verifyLicenseKey(machineB, key, publicKey)).toBe('invalid-key')
  })

  it('is rejected when signed by a different private key', () => {
    const forged = issueLicenseKey(machineA, other.privateKey)
    expect(verifyLicenseKey(machineA, forged, publicKey)).toBe('invalid-key')
  })

  it('is rejected when tampered with', () => {
    const chars = key.split('')
    const index = chars.findIndex((c) => c !== '-')
    chars[index] = chars[index] === 'A' ? 'B' : 'A'
    expect(verifyLicenseKey(machineA, chars.join(''), publicKey)).toBe('invalid-key')
  })

  it('tolerates formatting changes from copy/paste', () => {
    const pasted = `  ${key.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o')}\n`
    expect(verifyLicenseKey(machineA, pasted, publicKey)).toBe('valid')
  })

  it('reports malformed input as invalid-format', () => {
    expect(verifyLicenseKey(machineA, '', publicKey)).toBe('invalid-format')
    expect(verifyLicenseKey(machineA, 'not a key', publicKey)).toBe('invalid-format')
    expect(verifyLicenseKey(machineA, key.slice(0, -3), publicKey)).toBe('invalid-format')
    expect(verifyLicenseKey('bad-id', key, publicKey)).toBe('invalid-format')
  })

  it('survives a public key round-trip through base64', () => {
    const restored = publicKeyFromBase64(publicKeyToBase64(publicKey))
    expect(verifyLicenseKey(machineA, key, restored)).toBe('valid')
  })

  it('refuses to issue a key for a malformed machine id', () => {
    expect(() => issueLicenseKey('nope', privateKey)).toThrow()
  })
})

describe('OS machine id parsing', () => {
  it('parses Windows reg query output', () => {
    const output = `
HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography
    MachineGuid    REG_SZ    4c4c4544-0042-3510-8051-b4c04f4e3732

`
    expect(parseWindowsMachineGuid(output)).toBe('4c4c4544-0042-3510-8051-b4c04f4e3732')
    expect(parseWindowsMachineGuid('ERROR: not found')).toBeNull()
  })

  it('parses macOS ioreg output', () => {
    const output = '    "IOPlatformUUID" = "564D1C2A-1234-5678-9ABC-DEF012345678"\n'
    expect(parseMacPlatformUuid(output)).toBe('564D1C2A-1234-5678-9ABC-DEF012345678')
  })
})
