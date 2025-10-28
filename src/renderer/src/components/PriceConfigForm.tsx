import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const PriceConfigForm: React.FC = () => {
  const { ratio1, ratio2, setRatio1, setRatio2 } = useAppStore()

  // Store display values as strings for better UX
  const [percent1Display, setPercent1Display] = useState<string>('')
  const [percent2Display, setPercent2Display] = useState<string>('')

  // Validation function for number input
  const isValidNumber = (value: string): boolean => {
    if (value === '') return true // Allow empty input
    // Allow numbers with optional decimal places: 30, 30.1, 30.10, etc.
    const numberRegex = /^\d+(\.\d*)?$/
    return numberRegex.test(value)
  }

  // Update the store values when percentages change
  const handlePercent1Change = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value

    // Only update display if it's a valid format
    if (isValidNumber(value)) {
      setPercent1Display(value)

      // Only update store if it's a valid number and not empty
      if (value !== '') {
        const numValue = parseFloat(value)
        if (!isNaN(numValue) && numValue >= 0) {
          setRatio1(1 + numValue / 100)
        }
      }
    }
  }

  const handlePercent2Change = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value

    // Only update display if it's a valid format
    if (isValidNumber(value)) {
      setPercent2Display(value)

      // Only update store if it's a valid number and not empty
      if (value !== '') {
        const numValue = parseFloat(value)
        if (!isNaN(numValue) && numValue >= 0) {
          setRatio2(1 + numValue / 100)
        }
      }
    }
  }

  // Calculate current percentages for display in formulas
  const currentPercent1 = (ratio1 - 1) * 100
  const currentPercent2 = (ratio2 - 1) * 100

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">إعدادات الأسعار</h3>
      <div className="mb-4 text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
        <p className="font-semibold mb-2">المعادلات:</p>
        <p>• سعر التكلفة = المجموع</p>
        <p>
          • السعر المخفض = سعر التكلفة × {ratio1.toFixed(2)} (زيادة بنسبة{' '}
          {currentPercent1.toFixed(1)}%)
        </p>
        <p>
          • سعر المنتج = السعر المخفض × {ratio2.toFixed(2)} (زيادة بنسبة{' '}
          {currentPercent2.toFixed(1)}%)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نسبة الزيادة ١ (%)</label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="30"
              value={percent1Display}
              onChange={handlePercent1Change}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            السعر المخفض = سعر التكلفة × {ratio1.toFixed(2)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نسبة الزيادة ٢ (%)</label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="20"
              value={percent2Display}
              onChange={handlePercent2Change}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            سعر المنتج = السعر المخفض × {ratio2.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PriceConfigForm
