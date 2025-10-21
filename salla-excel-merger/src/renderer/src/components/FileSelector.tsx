import React from 'react'

interface FileSelectorProps {
  label: string
  filePath: string | null
  onSelect: () => void
}

const FileSelector: React.FC<FileSelectorProps> = ({ label, filePath, onSelect }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <button
          onClick={onSelect}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Select File
        </button>
        {filePath && <span className="text-sm text-gray-600 truncate max-w-md">{filePath}</span>}
      </div>
    </div>
  )
}

export default FileSelector
