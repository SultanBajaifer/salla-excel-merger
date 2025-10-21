import React from 'react'
import { useAppStore } from './store/useAppStore'
import FileSelector from './components/FileSelector'
import PreviewTable from './components/PreviewTable'
import ColumnMapper from './components/ColumnMapper'
import SaveButton from './components/SaveButton'
import { excelService } from './services/excelService'

function App(): React.JSX.Element {
  const {
    currentView,
    mainFilePath,
    newProductsFilePath,
    mainFileData,
    newProductsData,
    mergedPreviewData,
    setCurrentView,
    setMainFilePath,
    setNewProductsFilePath
  } = useAppStore()

  const handleSelectMainFile = (): void => {
    // Placeholder - in real implementation, this would open a file dialog
    console.log('Select main file clicked')
    setMainFilePath('C:\\Users\\Example\\mainfile.xlsx')
  }

  const handleSelectNewProductsFile = (): void => {
    // Placeholder - in real implementation, this would open a file dialog
    console.log('Select new products file clicked')
    setNewProductsFilePath('C:\\Users\\Example\\newproducts.xlsx')
  }

  const handleOpenMapper = (): void => {
    setCurrentView('mapper')
  }

  const handleSaveFile = async (): Promise<void> => {
    try {
      // Placeholder - in real implementation, this would use actual file paths
      const outputPath = 'mainfile_updated.xlsx'
      await excelService.saveExcelFile(outputPath, mergedPreviewData)
      alert(`File saved successfully as ${outputPath}`)
    } catch (error) {
      console.error('Error saving file:', error)
      alert('Error saving file. Check console for details.')
    }
  }

  // Main View
  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Salla Excel Merger – Project Ready
          </h1>
          <p className="text-gray-600 mb-8">
            Select your Excel files to merge and preview the data
          </p>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <FileSelector
              label="Main File"
              filePath={mainFilePath}
              onSelect={handleSelectMainFile}
            />
            <FileSelector
              label="New Products File"
              filePath={newProductsFilePath}
              onSelect={handleSelectNewProductsFile}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <PreviewTable data={mainFileData} title="Main File Preview" maxRows={5} />
            <PreviewTable data={newProductsData} title="New Products Preview" maxRows={5} />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleOpenMapper}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-lg font-semibold"
            >
              Open Column Mapper
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Merge Preview</h1>

          <PreviewTable data={mergedPreviewData} title="Merged Data Preview" maxRows={10} />

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentView('mapper')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              Back to Mapper
            </button>
            <SaveButton onClick={handleSaveFile} label="Save Main File" />
          </div>
        </div>
      </div>
    )
  }

  return <div>Unknown view</div>
}

export default App
