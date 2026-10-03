import { homedir } from 'os'
import { join, resolve } from 'path'

// The private key lives outside the repository so it can never be committed.
export const PRIVATE_KEY_PATH = resolve(
  process.env.LICENSE_PRIVATE_KEY_PATH ||
    join(homedir(), '.salla-excel-merger', 'license-private-key.pem')
)

export const ISSUED_LOG_PATH = join(resolve(PRIVATE_KEY_PATH, '..'), 'issued-licenses.csv')

export const PUBLIC_KEY_SOURCE = resolve(__dirname, '../../src/main/license/publicKey.ts')
