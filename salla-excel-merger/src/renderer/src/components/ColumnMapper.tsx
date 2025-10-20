import React from 'react'
import { useAppStore } from '../store/useAppStore'

const ColumnMapper: React.FC = () => {
  const { newProductsData, mainFileData, setCurrentView } = useAppStore()

  // Extract column headers
  const newColumns = (newProductsData[0] || []).map((col) => String(col))
  const mainColumns = (mainFileData[0] || []).map((col) => String(col))

  const [mappings, setMappings] = React.useState<Record<string, string>>({})
  const [manualValues, setManualValues] = React.useState<Record<string, string>>({})

  const handleMappingChange = (newCol: string, mainCol: string): void => {
    setMappings((prev) => ({ ...prev, [newCol]: mainCol }))
  }

  const handleManualValueChange = (column: string, value: string): void => {
    setManualValues((prev) => ({ ...prev, [column]: value }))
  }

  const handlePreview = (): void => {
    console.log('Column Mappings:', mappings)
    console.log('Manual Values:', manualValues)
    setCurrentView('preview')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Column Mapper</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* New Products Columns */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">New Products Columns</h2>
          <div className="space-y-4">
            {newColumns.map((col: string, idx: number) => (
              <div key={idx} className="border-b pb-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">{col}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mappings[col] || ''}
                  onChange={(e) => handleMappingChange(col, e.target.value)}
                >
                  <option value="">-- Select Main Column --</option>
                  {mainColumns.map((mainCol: string, mainIdx: number) => (
                    <option key={mainIdx} value={mainCol}>
                      {mainCol}
                    </option>
                  ))}
                  <option value="manual">Manual Value</option>
                </select>
                {mappings[col] === 'manual' && (
                  <input
                    type="text"
                    placeholder="Enter default value"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={manualValues[col] || ''}
                    onChange={(e) => handleManualValueChange(col, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main File Columns */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Main File Columns</h2>
          <div className="space-y-2">
            {mainColumns.map((col: string, idx: number) => (
              <div key={idx} className="px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
                <span className="text-sm font-medium text-gray-700">{col}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentView('main')}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
        >
          Back to Main
        </button>
        <button
          onClick={handlePreview}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          Preview Merge
        </button>
      </div>
    </div>
  )
}

export default ColumnMapper
