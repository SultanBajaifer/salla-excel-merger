import React from 'react'
import { useAppStore, type CellValue } from './store/useAppStore'
import FileSelector from './components/FileSelector'
import PreviewTable from './components/PreviewTable'
import ColumnMapper from './components/ColumnMapper'
import SaveButton from './components/SaveButton'
import CleaningPage from './components/CleaningPage'

function App(): React.JSX.Element {
  const {
    currentView,
    mainFilePath,
    newProductsFilePath,
    mainFileData,
    newProductsData,
    mergedPreviewData,
    mainFileHeaderRow,
    productsFileHeaderRow,
    setCurrentView,
    setMainFilePath,
    setNewProductsFilePath,
    setMainFileData,
    setNewProductsData,
    setMainFileHeaderRow,
    setProductsFileHeaderRow
  } = useAppStore()

  const handleSelectMainFile = async (): Promise<void> => {
    try {
      const filePath = await window.api.selectFile()
      if (filePath) {
        setMainFilePath(filePath)
        // Read the file
        const data = (await window.api.readExcelFile(filePath)) as CellValue[][]
        setMainFileData(data)
      }
    } catch (error) {
      console.error('خطأ في اختيار الملف الرئيسي:', error)
      alert('حدث خطأ أثناء قراءة الملف الرئيسي')
    }
  }

  const handleSelectNewProductsFile = async (): Promise<void> => {
    try {
      const filePath = await window.api.selectFile()
      if (filePath) {
        setNewProductsFilePath(filePath)
        // Read the file
        const data = (await window.api.readExcelFile(filePath)) as CellValue[][]
        setNewProductsData(data)
      }
    } catch (error) {
      console.error('خطأ في اختيار ملف المنتجات:', error)
      alert('حدث خطأ أثناء قراءة ملف المنتجات الجديدة')
    }
  }

  const handleOpenMapper = (): void => {
    if (!mainFileData.length || !newProductsData.length) {
      alert('يرجى اختيار كلا الملفين أولاً')
      return
    }
    if (!mainFileHeaderRow) {
      alert('يرجى اختيار الصف الذي يحتوي على العناوين للملف الرئيسي')
      return
    }
    if (!productsFileHeaderRow) {
      alert('يرجى اختيار الصف الذي يحتوي على العناوين لملف المنتجات')
      return
    }
    setCurrentView('mapper')
  }

  const handleSaveFile = async (): Promise<void> => {
    try {
      if (!mainFilePath) {
        alert('لم يتم تحديد مسار الملف الرئيسي')
        return
      }

      if (!mergedPreviewData || !mergedPreviewData.length) {
        alert('لا توجد بيانات لحفظها. يرجى إنشاء معاينة الدمج أولاً')
        return
      }

      // Support both Windows and POSIX path separators
      const sepIndex = Math.max(mainFilePath.lastIndexOf('\\'), mainFilePath.lastIndexOf('/'))
      const dir = sepIndex !== -1 ? mainFilePath.substring(0, sepIndex) : ''
      const useBackslash = mainFilePath.includes('\\')
      const separator = useBackslash ? '\\' : '/'
      const defaultPath = dir
        ? `${dir}${separator}الملف_الرئيسي_محدث.xlsx`
        : `الملف_الرئيسي_محدث.xlsx`

      const outputPath = await window.api.saveFile(defaultPath)
      if (outputPath) {
        // Pass the number of rows from main file so we know which rows to preserve formatting for
        await window.api.saveExcelFile(
          outputPath,
          mergedPreviewData,
          mainFilePath,
          mainFileData.length
        )
        alert('تم حفظ الملف بنجاح')
        setCurrentView('main')
      }
    } catch (error) {
      console.error('خطأ في حفظ الملف:', error)
      alert('حدث خطأ أثناء حفظ الملف')
    }
  }

  // Main View
  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">دمج ملفات Excel لمتجر سلة</h1>
          <p className="text-gray-600 mb-8">اختر ملفات Excel للدمج ومعاينة البيانات</p>

          {/* Navigation to Cleaning Page */}
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('cleaning')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg text-lg font-semibold"
            >
              تنظيف ملف الإكسل
            </button>
            <p className="text-xs text-gray-500 mt-2">
              هل لديك ملف إكسل يحتاج إلى تنظيف قبل المعالجة؟ استخدم هذه الأداة لتنظيفه تلقائيًا
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <FileSelector
              label="اختيار الملف الرئيسي"
              filePath={mainFilePath}
              onSelect={handleSelectMainFile}
              fileData={mainFileData}
              headerRow={mainFileHeaderRow}
              onHeaderRowChange={setMainFileHeaderRow}
              headerLabel="حدد الصف الذي يحتوي على العناوين (الملف الرئيسي)"
            />
            <div>
              <FileSelector
                label="اختيار ملف المنتجات الجديدة"
                filePath={newProductsFilePath}
                onSelect={handleSelectNewProductsFile}
                fileData={newProductsData}
                headerRow={productsFileHeaderRow}
                onHeaderRowChange={setProductsFileHeaderRow}
                headerLabel="حدد الصف الذي يحتوي على العناوين (ملف المنتجات)"
              />
              {newProductsFilePath && productsFileHeaderRow && productsFileHeaderRow > 2 && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    💡 نصيحة: إذا كان ملفك يحتوي على بيانات غير منظمة أو صفوف فارغة في الأعلى، يمكنك
                    استخدام أداة &quot;تنظيف ملف الإكسل&quot; لتنظيفه تلقائيًا أولاً. هذا سيجعل
                    البيانات تبدأ مباشرة من الصف الأول.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              {mainFileHeaderRow && mainFileData.length > 0 ? (
                <>
                  <PreviewTable
                    data={[
                      mainFileData[mainFileHeaderRow - 1] || [], // Header row
                      ...mainFileData.slice(mainFileHeaderRow, mainFileHeaderRow + 5) // First 5 data rows
                    ]}
                    title="معاينة الملف الرئيسي"
                    maxRows={5}
                  />
                  <p className="text-xs text-gray-500 mt-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                    ملاحظة: العناوين في الصف {mainFileHeaderRow}، والبيانات تبدأ من الصف{' '}
                    {mainFileHeaderRow + 1}
                    {mainFileHeaderRow > 1 && '. الصفوف أعلاه سيتم الحفاظ عليها في الملف النهائي'}
                  </p>
                </>
              ) : (
                mainFileData.length > 0 && (
                  <p className="text-sm text-gray-500 bg-yellow-50 p-4 rounded border border-yellow-200">
                    يرجى اختيار صف العناوين للملف الرئيسي
                  </p>
                )
              )}
            </div>
            <div>
              {productsFileHeaderRow && newProductsData.length > 0 ? (
                <>
                  <PreviewTable
                    data={[
                      newProductsData[productsFileHeaderRow - 1] || [], // Header row
                      ...newProductsData.slice(productsFileHeaderRow, productsFileHeaderRow + 5) // First 5 data rows
                    ]}
                    title="معاينة المنتجات الجديدة"
                    maxRows={5}
                  />
                  <p className="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                    ملاحظة: العناوين في الصف {productsFileHeaderRow}، والبيانات تبدأ من الصف{' '}
                    {productsFileHeaderRow + 1}
                  </p>
                </>
              ) : (
                newProductsData.length > 0 && (
                  <p className="text-sm text-gray-500 bg-blue-50 p-4 rounded border border-blue-200">
                    يرجى اختيار صف العناوين لملف المنتجات
                  </p>
                )
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleOpenMapper}
              disabled={
                !mainFileData.length ||
                !newProductsData.length ||
                !mainFileHeaderRow ||
                !productsFileHeaderRow
              }
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              فتح أداة مطابقة الأعمدة
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mapper View
  if (currentView === 'mapper') {
    return (
      <div className="min-h-screen bg-gray-100">
        <ColumnMapper />
      </div>
    )
  }

  // Preview View
  if (currentView === 'preview') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">معاينة الدمج</h1>

          <PreviewTable data={mergedPreviewData} title="معاينة البيانات المدمجة" maxRows={10} />

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentView('mapper')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              العودة إلى أداة المطابقة
            </button>
            <SaveButton onClick={handleSaveFile} label="حفظ الملف الرئيسي" />
          </div>
        </div>
      </div>
    )
  }

  // Cleaning View
  if (currentView === 'cleaning') {
    return <CleaningPage />
  }

  return <div>عرض غير معروف</div>
}

export default App
