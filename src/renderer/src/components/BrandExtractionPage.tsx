import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

interface DetectBrandsResult {
  success: boolean
  brands?: Array<{ name: string; count: number }>
  product_column?: string
  total_products?: number
  error?: string
}

interface ExtractResult {
  success: boolean
  output_path?: string
  filtered_count?: number
  total_count?: number
  error?: string
}

const BrandExtractionPage: React.FC = () => {
  const {
    brandExtractionFilePath,
    detectedBrands,
    selectedBrands,
    extractedFilePath,
    setCurrentView,
    setBrandExtractionFilePath,
    setDetectedBrands,
    setSelectedBrands,
    setExtractedFilePath
  } = useAppStore()

  const [isDetecting, setIsDetecting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [productColumn, setProductColumn] = useState<string>('')
  const [totalProducts, setTotalProducts] = useState<number>(0)

  const handleSelectFile = async (): Promise<void> => {
    try {
      const filePath = await window.api.selectFile()
      if (filePath) {
        setBrandExtractionFilePath(filePath)
        setDetectedBrands([])
        setSelectedBrands([])
        setExtractedFilePath(null)
        setProductColumn('')
        setTotalProducts(0)
      }
    } catch (error) {
      console.error('خطأ في اختيار الملف:', error)
      alert('حدث خطأ أثناء اختيار الملف')
    }
  }

  const handleDetectBrands = async (): Promise<void> => {
    if (!brandExtractionFilePath) {
      alert('يرجى اختيار ملف أولاً')
      return
    }

    try {
      setIsDetecting(true)

      // Call the detect-brands IPC handler
      const result = (await window.api.detectBrands(brandExtractionFilePath)) as DetectBrandsResult

      if (!result.success) {
        throw new Error(result.error || 'فشل في اكتشاف العلامات التجارية')
      }

      if (!result.brands || result.brands.length === 0) {
        alert('لم يتم العثور على أي علامات تجارية في الملف')
        return
      }

      setDetectedBrands(result.brands)
      setProductColumn(result.product_column || 'المنتج')
      setTotalProducts(result.total_products || 0)
    } catch (error) {
      console.error('خطأ في اكتشاف العلامات التجارية:', error)
      alert(
        'حدث خطأ أثناء اكتشاف العلامات التجارية: ' +
          (error instanceof Error ? error.message : 'خطأ غير معروف')
      )
    } finally {
      setIsDetecting(false)
    }
  }

  const handleToggleBrand = (brandName: string): void => {
    if (selectedBrands.includes(brandName)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brandName))
    } else {
      setSelectedBrands([...selectedBrands, brandName])
    }
  }

  const handleSelectAll = (): void => {
    setSelectedBrands(detectedBrands.map((b) => b.name))
  }

  const handleDeselectAll = (): void => {
    setSelectedBrands([])
  }

  const handleExtractProducts = async (): Promise<void> => {
    if (selectedBrands.length === 0) {
      alert('يرجى اختيار علامة تجارية واحدة على الأقل')
      return
    }

    if (!brandExtractionFilePath) {
      alert('لم يتم تحديد ملف')
      return
    }

    try {
      setIsExtracting(true)

      // Call the extract-by-brands IPC handler
      const result = (await window.api.extractByBrands(
        brandExtractionFilePath,
        selectedBrands
      )) as ExtractResult

      if (!result.success) {
        throw new Error(result.error || 'فشل في استخراج المنتجات')
      }

      setExtractedFilePath(result.output_path || null)

      alert(
        `تم استخراج ${result.filtered_count} منتج من أصل ${result.total_count} منتج بنجاح!\n\nالملف محفوظ في:\n${result.output_path}`
      )
    } catch (error) {
      console.error('خطأ في استخراج المنتجات:', error)
      alert(
        'حدث خطأ أثناء استخراج المنتجات: ' +
          (error instanceof Error ? error.message : 'خطأ غير معروف')
      )
    } finally {
      setIsExtracting(false)
    }
  }

  const handleBackToMain = (): void => {
    setCurrentView('main')
    setBrandExtractionFilePath(null)
    setDetectedBrands([])
    setSelectedBrands([])
    setExtractedFilePath(null)
    setProductColumn('')
    setTotalProducts(0)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBackToMain}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md mb-4"
          >
            ← العودة للصفحة الرئيسية
          </button>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          استخراج المنتجات حسب العلامة التجارية
        </h1>
        <p className="text-gray-600 mb-8">
          اختر ملف Excel وسنقوم باكتشاف العلامات التجارية تلقائيًا، ثم يمكنك اختيار العلامات التي
          تريد استخراجها.
        </p>

        {/* File Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">اختيار ملف Excel</label>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                disabled={isDetecting || isExtracting}
              >
                اختيار ملف
              </button>
              {brandExtractionFilePath && (
                <span className="text-sm text-gray-600 truncate max-w-md">
                  {brandExtractionFilePath}
                </span>
              )}
            </div>
          </div>

          {brandExtractionFilePath && detectedBrands.length === 0 && (
            <div className="mt-4">
              <button
                onClick={handleDetectBrands}
                disabled={isDetecting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDetecting ? 'جاري اكتشاف العلامات التجارية...' : 'اكتشاف العلامات التجارية'}
              </button>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {isDetecting && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="mr-4 text-lg text-gray-700">
                جاري تحليل الملف واكتشاف العلامات...
              </span>
            </div>
          </div>
        )}

        {/* Detected Brands */}
        {detectedBrands.length > 0 && !isDetecting && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">العلامات التجارية المكتشفة</h2>
              <p className="text-sm text-gray-600">
                تم اكتشاف {detectedBrands.length} علامة تجارية من أصل {totalProducts} منتج في عمود
                &quot;{productColumn}&quot;
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                تحديد الكل
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                إلغاء تحديد الكل
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 max-h-96 overflow-y-auto">
              {detectedBrands.map((brand) => (
                <label
                  key={brand.name}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.name)}
                    onChange={() => handleToggleBrand(brand.name)}
                    className="ml-3 w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{brand.name}</span>
                    <span className="text-sm text-gray-500 mr-2">({brand.count} منتج)</span>
                  </div>
                </label>
              ))}
            </div>

            {selectedBrands.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  ✓ تم اختيار {selectedBrands.length} علامة تجارية
                </p>
              </div>
            )}

            <button
              onClick={handleExtractProducts}
              disabled={isExtracting || selectedBrands.length === 0}
              className="w-full px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg text-xl font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExtracting
                ? 'جاري استخراج المنتجات...'
                : `استخراج المنتجات (${selectedBrands.length} علامة)`}
            </button>
          </div>
        )}

        {/* Extraction in Progress */}
        {isExtracting && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="mr-4 text-lg text-gray-700">جاري استخراج المنتجات...</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {extractedFilePath && !isExtracting && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-lg text-green-800 font-semibold mb-2">
                ✓ تم استخراج المنتجات بنجاح!
              </p>
              <p className="text-sm text-green-700">
                الملف محفوظ في: <br />
                <span className="font-mono text-xs break-all">{extractedFilePath}</span>
              </p>
            </div>

            <div className="mt-4 flex gap-4">
              <button
                onClick={handleSelectFile}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                استخراج من ملف آخر
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrandExtractionPage
