import React, { useState } from 'react'
import { useAppStore, type CellValue } from '../store/useAppStore'
import PreviewTable from './PreviewTable'

const CleaningPage: React.FC = () => {
  const {
    cleaningFilePath,
    cleaningFileData,
    cleanedFilePath,
    setCurrentView,
    setCleaningFilePath,
    setCleaningFileData,
    setCleanedFilePath
  } = useAppStore()

  const [isLoading, setIsLoading] = useState(false)

  const handleSelectFile = async (): Promise<void> => {
    try {
      const filePath = await window.api.selectFile()
      if (filePath) {
        setCleaningFilePath(filePath)
        setCleaningFileData([])
        setCleanedFilePath(null)
      }
    } catch (error) {
      console.error('خطأ في اختيار الملف:', error)
      alert('حدث خطأ أثناء اختيار الملف')
    }
  }

  const handleCleanFile = async (): Promise<void> => {
    if (!cleaningFilePath) {
      alert('يرجى اختيار ملف أولاً')
      return
    }

    try {
      setIsLoading(true)

      // Clean the file using the main process
      const cleanedPath = (await window.api.cleanExcelFile(cleaningFilePath)) as string

      // Read the cleaned file data
      const data = (await window.api.readExcelFile(cleanedPath)) as CellValue[][]

      setCleanedFilePath(cleanedPath)
      setCleaningFileData(data)
    } catch (error) {
      console.error('خطأ في تنظيف الملف:', error)
      alert('حدث خطأ أثناء تنظيف الملف')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = (): void => {
    if (cleanedFilePath) {
      alert(`تم حفظ الملف المنظف في:\n${cleanedFilePath}`)
    }
  }

  const handleBackToMain = (): void => {
    setCurrentView('main')
    setCleaningFilePath(null)
    setCleaningFileData([])
    setCleanedFilePath(null)
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

        <h1 className="text-4xl font-bold text-gray-800 mb-2">تنظيف ملف الإكسل</h1>
        <p className="text-gray-600 mb-8">
          قم برفع ملف الإكسل الخاص بك وسنقوم بتنظيفه تلقائيًا لتسهيل معالجته في النظام.
        </p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">اختيار ملف Excel</label>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                disabled={isLoading}
              >
                اختيار ملف
              </button>
              {cleaningFilePath && (
                <span className="text-sm text-gray-600 truncate max-w-md">{cleaningFilePath}</span>
              )}
            </div>
          </div>

          {cleaningFilePath && !cleanedFilePath && (
            <div className="mt-4">
              <button
                onClick={handleCleanFile}
                disabled={isLoading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'جاري تنظيف الملف...' : 'تنظيف الملف'}
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="mr-4 text-lg text-gray-700">جاري تنظيف الملف...</span>
            </div>
          </div>
        )}

        {cleaningFileData.length > 0 && !isLoading && (
          <div>
            <PreviewTable data={cleaningFileData} title="معاينة البيانات المنظفة" maxRows={10} />

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-lg font-semibold"
              >
                عرض موقع الملف المنظف
              </button>
              <button
                onClick={handleSelectFile}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg text-lg font-semibold"
              >
                تنظيف ملف آخر
              </button>
            </div>

            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ تم تنظيف الملف بنجاح! الملف المنظف محفوظ في: <br />
                <span className="font-mono text-xs break-all">{cleanedFilePath}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CleaningPage
