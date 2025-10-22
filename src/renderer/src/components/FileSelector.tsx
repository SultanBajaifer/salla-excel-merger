import React from 'react'

interface FileSelectorProps {
  label: string
  filePath: string | null
  onSelect: () => void
  showStartRow?: boolean
  startRow?: number
  onStartRowChange?: (row: number) => void
}

const FileSelector: React.FC<FileSelectorProps> = ({
  label,
  filePath,
  onSelect,
  showStartRow = false,
  startRow = 1,
  onStartRowChange
}) => {
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
      {showStartRow && filePath && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رقم الصف الذي تبدأ منه البيانات
          </label>
          <input
            type="number"
            min="1"
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: 9"
            value={startRow}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1
              onStartRowChange?.(value)
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            الصف الذي يحتوي على العناوين في ملف المنتجات (مثلاً: 9 إذا كانت البيانات تبدأ من الصف
            التاسع)
          </p>
        </div>
      )}
    </div>
  )
}

export default FileSelector
