import React from 'react'
import { useAppStore } from '../store/useAppStore'

const PriceConfigForm: React.FC = () => {
  const { taxRate, discountRate, setTaxRate, setDiscountRate } = useAppStore()

  // Convert rate to percentage for display (e.g., 1.15 -> 15)
  const taxPercent = ((taxRate - 1) * 100).toFixed(0)
  const discountPercent = ((discountRate - 1) * 100).toFixed(0)

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value) || 0
    setTaxRate(1 + value / 100)
  }

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value) || 0
    setDiscountRate(value === 0 ? 1.0 : 1 + value / 100)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">إعدادات الأسعار</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نسبة الضريبة (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: 15 (لضريبة 15%)"
            value={taxPercent}
            onChange={handleTaxChange}
          />
          <p className="text-xs text-gray-500 mt-1">سيتم ضرب سعر التكلفة بـ {taxRate.toFixed(2)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نسبة التخفيض (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="مثال: 20 (لتخفيض 20%)"
            value={discountPercent}
            onChange={handleDiscountChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            {discountRate === 1.0
              ? 'لا يوجد تخفيض'
              : `سيتم قسمة السعر على ${discountRate.toFixed(2)}`}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PriceConfigForm
