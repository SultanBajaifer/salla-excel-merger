import { describe, expect, it } from 'vitest'
import { isUpdateBlocking } from './access'

describe('isUpdateBlocking', () => {
  it('blocks while an update is found, downloading or ready to install', () => {
    expect(isUpdateBlocking({ status: 'available', version: '2.0.1' })).toBe(true)
    expect(isUpdateBlocking({ status: 'downloading', version: '2.0.1', percent: 40 })).toBe(true)
    expect(isUpdateBlocking({ status: 'downloaded', version: '2.0.1' })).toBe(true)
  })

  it('keeps blocking when the download of a known update fails', () => {
    expect(isUpdateBlocking({ status: 'error', message: 'net', version: '2.0.1' })).toBe(true)
  })

  it('does not block when there is no update or the check itself fails (offline)', () => {
    expect(isUpdateBlocking({ status: 'idle' })).toBe(false)
    expect(isUpdateBlocking({ status: 'checking' })).toBe(false)
    expect(isUpdateBlocking({ status: 'not-available' })).toBe(false)
    expect(isUpdateBlocking({ status: 'error', message: 'offline' })).toBe(false)
  })
})
