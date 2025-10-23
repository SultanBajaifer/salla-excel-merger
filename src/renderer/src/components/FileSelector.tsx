import React from 'react'
import type { CellValue } from '../store/useAppStore'

interface FileSelectorProps {
  label: string
  filePath: string | null
  onSelect: () => void
  fileData?: CellValue[][]
  headerRow?: number | null
  onHeaderRowChange?: (row: number) => void
  headerLabel?: string
}

const FileSelector: React.FC<FileSelectorProps> = ({
  label,
  filePath,
  onSelect,
  fileData = [],
  headerRow = null,
  onHeaderRowChange,
  headerLabel
}) => {
  // Get first 15 rows for preview
  const previewRows = fileData.slice(0, 15)
  const maxRows = Math.min(fileData.length, 15)

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <button
          onClick={onSelect}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          اختيار ملف
        </button>
        {filePath && <span className="text-sm text-gray-600 truncate max-w-md">{filePath}</span>}
      </div>

      {/* Header row selection and preview */}
      {filePath && fileData.length > 0 && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Header row dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {headerLabel || 'حدد الصف الذي يحتوي على العناوين'}
            </label>
            <select
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={headerRow || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (value && onHeaderRowChange) {
                  onHeaderRowChange(value)
                }
              }}
            >
              <option value="">-- اختر رقم الصف --</option>
              {Array.from({ length: maxRows }, (_, i) => i + 1).map((rowNum) => (
                <option key={rowNum} value={rowNum}>
                  الصف {rowNum}
                </option>
              ))}
            </select>
            {!headerRow && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ يرجى اختيار الصف الذي يحتوي على العناوين قبل المتابعة
              </p>
            )}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">معاينة أول 15 صف:</h4>
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <tbody className="bg-white divide-y divide-gray-200">
                {previewRows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={`${
                      headerRow === rowIdx + 1
                        ? 'bg-blue-100 border-2 border-blue-500 font-bold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-2 py-1 text-gray-500 font-medium text-center border-l border-gray-300">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-2 py-1 text-gray-700 whitespace-nowrap text-right border-l border-gray-200"
                      >
                        {String(cell || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {fileData.length > 15 && (
              <p className="text-xs text-gray-500 mt-2">
                عرض أول 15 صف من إجمالي {fileData.length} صف
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileSelector
