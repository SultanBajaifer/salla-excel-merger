import React from 'react'
import type { UpdateState } from '../../../shared/access'

interface UpdateModalProps {
  state: UpdateState
}

// Full-screen, non-dismissible: the app stays blocked until the update is installed.
function UpdateModal({ state }: UpdateModalProps): React.JSX.Element {
  const version = 'version' in state ? state.version : ''
  const percent =
    state.status === 'downloading' ? state.percent : state.status === 'downloaded' ? 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-8">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">تحديث إلزامي</h2>
        <p className="text-gray-600 mb-6">
          يتوفر إصدار جديد من التطبيق{version && ` (${version})`}. يجب تثبيت التحديث للاستمرار في
          استخدام التطبيق.
        </p>

        {state.status === 'error' ? (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                تعذر تحميل التحديث. يرجى التأكد من اتصالك بالإنترنت ثم المحاولة مرة أخرى.
              </p>
            </div>
            <button
              onClick={() => window.api.retryUpdate()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-sm text-gray-700 text-center">
              {state.status === 'downloaded'
                ? 'تم تحميل التحديث. سيتم إعادة تشغيل التطبيق وتثبيت التحديث الآن...'
                : state.status === 'downloading'
                  ? `جاري تحميل التحديث... ${percent}%`
                  : 'جاري بدء تحميل التحديث...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpdateModal
