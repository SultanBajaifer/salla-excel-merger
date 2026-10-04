import React from 'react'
import {
  CONTACT_PHONE,
  CONTACT_WHATSAPP_URL,
  type ActivationResult,
  type LicenseStatus
} from '../../../shared/access'

interface LicenseModalProps {
  status: Exclude<LicenseStatus, { state: 'licensed' }>
  onActivated: () => void
}

const activationErrors: Record<Exclude<ActivationResult, { ok: true }>['reason'], string> = {
  'invalid-format': 'صيغة مفتاح الترخيص غير صحيحة. يرجى نسخ المفتاح كاملاً كما وصلك.',
  'invalid-key': 'مفتاح الترخيص غير صالح لهذا الجهاز.',
  error: 'حدث خطأ أثناء تفعيل الترخيص. يرجى المحاولة مرة أخرى.'
}

// Full-screen block-out shown until a valid license key is entered for this machine.
function LicenseModal({ status, onActivated }: LicenseModalProps): React.JSX.Element {
  const [licenseKey, setLicenseKey] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isActivating, setIsActivating] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const machineId = status.state === 'unlicensed' ? status.machineId : null

  const whatsappUrl = machineId
    ? `${CONTACT_WHATSAPP_URL}?text=${encodeURIComponent(
        `مرحباً، أرغب بشراء ترخيص لتطبيق دمج ملفات Excel لمتجر سلة.\nمعرف الجهاز: ${machineId}`
      )}`
    : CONTACT_WHATSAPP_URL

  const handleCopy = async (): Promise<void> => {
    if (!machineId) return
    await window.api.copyToClipboard(machineId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleActivate = async (): Promise<void> => {
    setIsActivating(true)
    setError(null)
    try {
      const result = await window.api.activateLicense(licenseKey)
      if (result.ok) {
        onActivated()
      } else {
        setError(activationErrors[result.reason])
      }
    } catch (err) {
      console.error('خطأ في تفعيل الترخيص:', err)
      setError(activationErrors.error)
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-8">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">تفعيل التطبيق</h2>
        <p className="text-gray-600 mb-6">
          هذه النسخة غير مفعّلة. لشراء ترخيص، تواصل معنا على الرقم{' '}
          <span dir="ltr" className="font-semibold text-gray-800">
            {CONTACT_PHONE}
          </span>{' '}
          وأرسل معرف الجهاز الظاهر أدناه، وسنرسل لك مفتاح الترخيص.
        </p>

        {machineId ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">معرف الجهاز</label>
            <div className="flex items-center gap-2 mb-4">
              <div
                dir="ltr"
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-lg text-center select-all"
              >
                {machineId}
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                {copied ? 'تم النسخ ✓' : 'نسخ'}
              </button>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center px-6 py-3 mb-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-semibold"
            >
              تواصل عبر واتساب
            </a>

            <label className="block text-sm font-medium text-gray-700 mb-2">مفتاح الترخيص</label>
            <textarea
              dir="ltr"
              rows={3}
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXXXXXX-XXXXXXXX-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isActivating || !licenseKey.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isActivating ? 'جاري التفعيل...' : 'تفعيل'}
            </button>
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              تعذر قراءة معرف الجهاز. يرجى التواصل معنا على الرقم{' '}
              <span dir="ltr">{CONTACT_PHONE}</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LicenseModal
