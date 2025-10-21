import React from 'react'
import { useAppStore } from '../store/useAppStore'
import type { CellValue } from '../store/useAppStore'

const ColumnMapper: React.FC = () => {
  const { 
    newProductsData, 
    mainFileData, 
    setCurrentView, 
    setColumnMappings, 
    setMergedPreviewData 
  } = useAppStore()

  // Extract column headers
  const newColumns = (newProductsData[0] || []).map((col) => String(col))
  const mainColumns = (mainFileData[0] || []).map((col) => String(col))

  const [mappings, setMappings] = React.useState<Record<string, string>>({})
  const [manualValues, setManualValues] = React.useState<Record<string, string>>({})

  const handleMappingChange = (mainCol: string, newCol: string): void => {
    setMappings((prev) => ({ ...prev, [mainCol]: newCol }))
  }

  const handleManualValueChange = (column: string, value: string): void => {
    setManualValues((prev) => ({ ...prev, [column]: value }))
  }

  const handlePreview = (): void => {
    // Create merged data
    const mergedData: CellValue[][] = []
    
    // Add header row
    mergedData.push(mainColumns)
    
    // Process each row from new products
    const newRows = newProductsData.slice(1)
    newRows.forEach((newRow) => {
      const mergedRow: CellValue[] = []
      
      mainColumns.forEach((mainCol) => {
        const mapping = mappings[mainCol]
        
        if (mapping === 'manual') {
          // Use manual value
          mergedRow.push(manualValues[mainCol] || '')
        } else if (mapping) {
          // Map from new column
          const newColIndex = newColumns.indexOf(mapping)
          if (newColIndex !== -1) {
            mergedRow.push(newRow[newColIndex])
          } else {
            mergedRow.push('')
          }
        } else {
          // No mapping
          mergedRow.push('')
        }
      })
      
      mergedData.push(mergedRow)
    })
    
    // Save mappings and preview data
    const columnMappings = Object.entries(mappings).map(([mainCol, newCol]) => ({
      mainColumn: mainCol,
      newColumn: newCol === 'manual' ? null : newCol,
      manualValue: newCol === 'manual' ? manualValues[mainCol] : undefined
    }))
    
    setColumnMappings(columnMappings)
    setMergedPreviewData(mergedData)
    setCurrentView('preview')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">أداة مطابقة الأعمدة</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Main File Columns (Right side in RTL) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">أعمدة الملف الرئيسي</h2>
          <div className="space-y-4">
            {mainColumns.map((col: string, idx: number) => (
              <div key={idx} className="border-b pb-3">
                <label className="block text-sm font-medium text-gray-600 mb-2">{col}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mappings[col] || ''}
                  onChange={(e) => handleMappingChange(col, e.target.value)}
                >
                  <option value="">-- اختر عمود من المنتجات الجديدة --</option>
                  {newColumns.map((newCol: string, newIdx: number) => (
                    <option key={newIdx} value={newCol}>
                      {newCol}
                    </option>
                  ))}
                  <option value="manual">إدخال قيمة يدوياً</option>
                </select>
                {mappings[col] === 'manual' && (
                  <input
                    type="text"
                    placeholder="أدخل القيمة الافتراضية"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={manualValues[col] || ''}
                    onChange={(e) => handleManualValueChange(col, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* New Products Columns (Left side in RTL) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">أعمدة المنتجات الجديدة</h2>
          <div className="space-y-2">
            {newColumns.map((col: string, idx: number) => (
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
          العودة إلى الصفحة الرئيسية
        </button>
        <button
          onClick={handlePreview}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          عرض النتيجة
        </button>
      </div>
    </div>
  )
}

export default ColumnMapper
