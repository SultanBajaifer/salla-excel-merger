import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

const PriceConfigForm: React.FC = () => {
  const { ratio1, ratio2, setRatio1, setRatio2 } = useAppStore()

  // Convert multipliers to percentages for display (1.3 → 30)
  const [percent1, setPercent1] = useState<number>((ratio1 - 1) * 100)
  const [percent2, setPercent2] = useState<number>((ratio2 - 1) * 100)

  // Update the store values when percentages change
  const handlePercent1Change = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value
    const parsed = raw === '' ? NaN : parseFloat(raw)
    const percentValue = isNaN(parsed) ? 0 : parsed
    setPercent1(percentValue)
    // Convert percentage to multiplier (30 → 1.3)
    setRatio1(1 + percentValue / 100)
  }

  const handlePercent2Change = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value
    const parsed = raw === '' ? NaN : parseFloat(raw)
    const percentValue = isNaN(parsed) ? 0 : parsed
    setPercent2(percentValue)
    // Convert percentage to multiplier (20 → 1.2)
    setRatio2(1 + percentValue / 100)
  }

  // Update percentage states if ratio values change externally
  useEffect(() => {
    // keep two decimal places in state for consistent display
    setPercent1(Number(((ratio1 - 1) * 100).toFixed(2)))
    setPercent2(Number(((ratio2 - 1) * 100).toFixed(2)))
  }, [ratio1, ratio2])

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">إعدادات الأسعار</h3>
      <div className="mb-4 text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
        <p className="font-semibold mb-2">المعادلات:</p>
        <p>• سعر التكلفة = المجموع</p>
        <p>
          • السعر المخفض = سعر التكلفة × {ratio1.toFixed(2)} (زيادة بنسبة {percent1.toFixed(2)}%)
        </p>
        <p>
          • سعر المنتج = السعر المخفض × {ratio2.toFixed(2)} (زيادة بنسبة {percent2.toFixed(2)}%)
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نسبة الزيادة ١ (%)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: 30.00 (للزيادة بنسبة 30%)"
              value={percent1.toFixed(2)}
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
              type="number"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: 20.00 (للزيادة بنسبة 20%)"
              value={percent2.toFixed(2)}
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
