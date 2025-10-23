import React from 'react'
import { useAppStore } from '../store/useAppStore'

export default function FormattingOptions(): React.JSX.Element {
  const {
    clearFormattingFromRow,
    preserveFirstRowFormatting,
    mainFileData,
    setClearFormattingFromRow,
    setPreserveFirstRowFormatting
  } = useAppStore()

  // Generate row options based on file data
  const rowCount = mainFileData.length
  const rowOptions: number[] = []
  for (let i = 1; i <= Math.min(rowCount, 20); i++) {
    rowOptions.push(i)
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">خيارات التنسيق للملف النهائي</h3>

      <div className="space-y-4">
        {/* Preserve first row formatting */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <input
            type="checkbox"
            id="preserveFirstRow"
            checked={preserveFirstRowFormatting}
            onChange={(e) => setPreserveFirstRowFormatting(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="preserveFirstRow" className="text-sm text-gray-700">
            الحفاظ على تنسيق الصف الأول (صف العنوان)
          </label>
        </div>

        {/* Clear formatting from row */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            إزالة التنسيق ابتداءً من الصف:
          </label>
          <select
            value={clearFormattingFromRow || ''}
            onChange={(e) => {
              const value = e.target.value
              setClearFormattingFromRow(value ? parseInt(value) : null)
            }}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">لا تقم بإزالة التنسيق (الافتراضي)</option>
            {rowOptions.map((rowNum) => (
              <option key={rowNum} value={rowNum}>
                الصف {rowNum}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            سيتم إزالة كل التنسيقات (خط عريض، مائل، يتوسطه خط) من الصف المحدد وما بعده
          </p>
        </div>

        {/* Preview message */}
        {clearFormattingFromRow && (
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              📋 معاينة: سيتم إزالة التنسيق من{' '}
              {preserveFirstRowFormatting && clearFormattingFromRow > 1
                ? `الصف ${clearFormattingFromRow}`
                : clearFormattingFromRow === 1
                  ? 'جميع الصفوف'
                  : `الصف ${clearFormattingFromRow}`}{' '}
              وما بعده
              {preserveFirstRowFormatting &&
                clearFormattingFromRow > 1 &&
                ' (مع الحفاظ على الصف الأول)'}
            </p>
          </div>
        )}

        {!clearFormattingFromRow && (
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              💡 لن يتم إزالة أي تنسيق. سيتم الحفاظ على التنسيق الأصلي للملف الرئيسي
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
