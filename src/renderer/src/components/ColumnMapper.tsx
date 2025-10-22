import React from 'react'
import { useAppStore } from '../store/useAppStore'
import type { CellValue, ColumnConfig } from '../store/useAppStore'
import PriceConfigForm from './PriceConfigForm'

const ColumnMapper: React.FC = () => {
  const {
    newProductsData,
    mainFileData,
    productsStartRow,
    setCurrentView,
    setColumnMappings,
    setMergedPreviewData,
    ratio1,
    ratio2,
    costColumn,
    setCostColumn
  } = useAppStore()

  // Extract column headers
  // For products file: use the row before productsStartRow as headers (0-indexed, so productsStartRow - 1)
  // Note: productsStartRow is 1-based (e.g., 9 means row 9 in Excel, which is index 8 in array)
  const newColumnsRowIndex = productsStartRow - 1 // Headers are at the start row
  const newColumns = (newProductsData[newColumnsRowIndex] || []).map((col) => String(col))

  // Main file: skip first row as it's the title row, row 1 is header (0-indexed)
  const mainColumns = (mainFileData[1] || []).map((col) => String(col))

  // Define column configurations
  const columnConfigs: ColumnConfig[] = [
    { name: 'أسم المنتج', category: 'required' },
    { name: 'الباركود', category: 'required' },
    { name: 'سعر المنتج', category: 'price' },
    { name: 'سعر التكلفة', category: 'price' },
    { name: 'السعر المخفض', category: 'price' }
  ]

  // Get category for a column
  const getColumnCategory = (colName: string): 'required' | 'price' | 'other' => {
    const config = columnConfigs.find((c) => c.name === colName)
    return config?.category || 'other'
  }

  const [mappings, setMappings] = React.useState<Record<string, string>>({})
  const [manualValues, setManualValues] = React.useState<Record<string, string>>({})

  const handleMappingChange = (mainCol: string, newCol: string): void => {
    setMappings((prev) => ({ ...prev, [mainCol]: newCol }))
  }

  const handleManualValueChange = (column: string, value: string): void => {
    setManualValues((prev) => ({ ...prev, [column]: value }))
  }

  const handlePreview = (): void => {
    // Validate required columns
    const requiredColumns = columnConfigs
      .filter((c) => c.category === 'required')
      .map((c) => c.name)
    const priceColumns = columnConfigs.filter((c) => c.category === 'price').map((c) => c.name)

    for (const reqCol of requiredColumns) {
      if (mainColumns.includes(reqCol) && !mappings[reqCol]) {
        alert(`يرجى مطابقة العمود المطلوب: ${reqCol}`)
        return
      }
    }

    // Check if cost column is selected for price columns
    const hasPriceColumns = priceColumns.some((col) => mainColumns.includes(col))
    if (hasPriceColumns && !costColumn) {
      alert('يرجى اختيار عمود التكلفة لحساب الأسعار')
      return
    }

    // Create merged data
    const mergedData: CellValue[][] = []

    // Add title row from main file (row 0)
    if (mainFileData[0]) {
      mergedData.push(mainFileData[0])
    }

    // Add header row (row 1 from main file)
    mergedData.push(mainColumns)

    // Add existing data rows from main file (skip title and header rows)
    const existingRows = mainFileData.slice(2)
    existingRows.forEach((row) => {
      mergedData.push(row)
    })

    // Process each row from new products (skip rows before productsStartRow)
    // productsStartRow is 1-based, so we need to start from index productsStartRow
    const newRows = newProductsData.slice(productsStartRow)
    newRows.forEach((newRow) => {
      const mergedRow: CellValue[] = []
      const costColIndex = costColumn ? newColumns.indexOf(costColumn) : -1
      const costValue = costColIndex !== -1 ? parseFloat(String(newRow[costColIndex])) : 0

      mainColumns.forEach((mainCol) => {
        const category = getColumnCategory(mainCol)
        const mapping = mappings[mainCol]

        if (category === 'price' && costColumn) {
          // Calculate price based on new formula:
          // سعر التكلفة = المجموع
          // السعر المخفض = سعر التكلفة × النسبة ١
          // سعر المنتج = السعر المخفض × النسبة ٢
          if (mainCol === 'سعر التكلفة') {
            // سعر التكلفة = المجموع (cost)
            mergedRow.push(costValue)
          } else if (mainCol === 'السعر المخفض') {
            // السعر المخفض = سعر التكلفة × النسبة ١
            mergedRow.push(costValue * ratio1)
          } else if (mainCol === 'سعر المنتج') {
            // سعر المنتج = السعر المخفض × النسبة ٢
            const discountedPrice = costValue * ratio1
            mergedRow.push(discountedPrice * ratio2)
          } else {
            mergedRow.push('')
          }
        } else if (mapping === 'manual') {
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

  // Check if there are any price columns
  const hasPriceColumns = columnConfigs
    .filter((c) => c.category === 'price')
    .some((c) => mainColumns.includes(c.name))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">أداة مطابقة الأعمدة</h1>

      {/* Price Configuration */}
      {hasPriceColumns && (
        <>
          <PriceConfigForm />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">اختيار عمود التكلفة</h3>
            <p className="text-sm text-gray-600 mb-3">
              اختر العمود من ملف المنتجات الذي يحتوي على تكلفة المنتج (سيتم استخدامه لحساب الأسعار)
            </p>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={costColumn || ''}
              onChange={(e) => setCostColumn(e.target.value)}
            >
              <option value="">-- اختر عمود التكلفة --</option>
              {newColumns.map((col: string, idx: number) => (
                <option key={idx} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Main File Columns (Right side in RTL) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">أعمدة الملف الرئيسي</h2>
          <div className="space-y-4">
            {mainColumns.map((col: string, idx: number) => {
              const category = getColumnCategory(col)
              const isPriceColumn = category === 'price'
              const isRequired = category === 'required'

              return (
                <div key={idx} className="border-b pb-3">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    {col}
                    {isRequired && <span className="text-red-500 mr-1">*</span>}
                    {isPriceColumn && (
                      <span className="text-xs text-blue-600 mr-2">(محسوب تلقائياً)</span>
                    )}
                  </label>
                  {isPriceColumn ? (
                    <div className="text-sm text-gray-500 italic">
                      سيتم حساب هذا العمود تلقائياً من عمود التكلفة
                    </div>
                  ) : (
                    <>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={mappings[col] || ''}
                        onChange={(e) => handleMappingChange(col, e.target.value)}
                      >
                        <option value="">
                          {isRequired ? '-- يجب اختيار عمود --' : '-- اختر عمود أو اترك فارغاً --'}
                        </option>
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
                    </>
                  )}
                </div>
              )
            })}
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
