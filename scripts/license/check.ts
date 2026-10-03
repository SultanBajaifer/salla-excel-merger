// Fails when no license public key is configured. Run by the release workflow
// so a build that would reject every license key can never be published.

import { publicKeyFromBase64 } from '../../src/main/license/core'
import { LICENSE_PUBLIC_KEY } from '../../src/main/license/publicKey'

if (!LICENSE_PUBLIC_KEY) {
  console.error('No license public key is configured in src/main/license/publicKey.ts.')
  console.error('Run `npm run license:keygen` locally and commit the result before releasing.')
  process.exit(1)
}

try {
  const key = publicKeyFromBase64(LICENSE_PUBLIC_KEY)
  if (key.asymmetricKeyType !== 'ed25519')
    throw new Error(`unexpected key type ${key.asymmetricKeyType}`)
} catch (error) {
  console.error('The license public key is invalid:', error)
  process.exit(1)
}

console.log('License public key is configured.')
