import React from 'react'
import { isUpdateBlocking, type LicenseStatus, type UpdateState } from '../../../shared/access'
import UpdateModal from './UpdateModal'
import LicenseModal from './LicenseModal'

interface AccessGateProps {
  children: React.ReactNode
}

// Renders the app only when it is licensed and no mandatory update is pending.
// The main process enforces the same rules on every protected IPC call.
function AccessGate({ children }: AccessGateProps): React.JSX.Element | null {
  const [license, setLicense] = React.useState<LicenseStatus | null>(null)
  const [update, setUpdate] = React.useState<UpdateState>({ status: 'idle' })

  const refreshLicense = React.useCallback(() => {
    window.api.getLicenseStatus().then(setLicense)
  }, [])

  React.useEffect(() => {
    refreshLicense()
    const unsubscribe = window.api.onUpdateState(setUpdate)
    window.api.getUpdateState().then(setUpdate)
    return unsubscribe
  }, [refreshLicense])

  if (isUpdateBlocking(update)) {
    return <UpdateModal state={update} />
  }

  if (license === null) {
    return null
  }

  if (license.state !== 'licensed') {
    return <LicenseModal status={license} onActivated={refreshLicense} />
  }

  return <>{children}</>
}

export default AccessGate
