import React from 'react'
import { useAppStore } from '../store/useAppStore'

const PriceConfigForm: React.FC = () => {
  const { ratio1, ratio2, setRatio1, setRatio2 } = useAppStore()

  const handleRatio1Change = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value) || 1.0
    setRatio1(value)
  }

  const handleRatio2Change = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value) || 1.0
    setRatio2(value)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">إعدادات الأسعار</h3>
      <div className="mb-4 text-sm text-gray-700 bg-white p-3 rounded border border-blue-100">
        <p className="font-semibold mb-2">المعادلات:</p>
        <p>• سعر التكلفة = المجموع</p>
        <p>• السعر المخفض = سعر التكلفة × النسبة ١</p>
        <p>• سعر المنتج = السعر المخفض × النسبة ٢</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">النسبة ١</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: 1.3 (للزيادة بنسبة 30%)"
            value={ratio1}
            onChange={handleRatio1Change}
          />
          <p className="text-xs text-gray-500 mt-1">
            القيمة الحالية: {ratio1.toFixed(2)} (السعر المخفض = سعر التكلفة × {ratio1.toFixed(2)})
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">النسبة ٢</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: 1.2 (للزيادة بنسبة 20%)"
            value={ratio2}
            onChange={handleRatio2Change}
          />
          <p className="text-xs text-gray-500 mt-1">
            القيمة الحالية: {ratio2.toFixed(2)} (سعر المنتج = السعر المخفض × {ratio2.toFixed(2)})
          </p>
        </div>
      </div>
    </div>
  )
}

export default PriceConfigForm
