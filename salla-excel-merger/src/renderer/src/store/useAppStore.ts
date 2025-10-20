import { create } from 'zustand'

type CellValue = string | number | boolean | null

interface ColumnMapping {
  newColumn: string
  mainColumn: string
  manualValue?: string
}

interface AppState {
  mainFilePath: string | null
  newProductsFilePath: string | null
  mainFileData: CellValue[][]
  newProductsData: CellValue[][]
  columnMappings: ColumnMapping[]
  mergedPreviewData: CellValue[][]
  currentView: 'main' | 'mapper' | 'preview'

  setMainFilePath: (path: string | null) => void
  setNewProductsFilePath: (path: string | null) => void
  setMainFileData: (data: CellValue[][]) => void
  setNewProductsData: (data: CellValue[][]) => void
  setColumnMappings: (mappings: ColumnMapping[]) => void
  setMergedPreviewData: (data: CellValue[][]) => void
  setCurrentView: (view: 'main' | 'mapper' | 'preview') => void
}

export const useAppStore = create<AppState>((set) => ({
  mainFilePath: null,
  newProductsFilePath: null,
  mainFileData: [
    ['ID', 'Name', 'Price', 'Stock'],
    ['1', 'Product A', '100', '50'],
    ['2', 'Product B', '200', '30'],
    ['3', 'Product C', '150', '20'],
    ['4', 'Product D', '300', '10']
  ],
  newProductsData: [
    ['ID', 'Title', 'Cost', 'Quantity', 'Brand'],
    ['5', 'Product E', '120', '25', 'BrandX'],
    ['6', 'Product F', '180', '15', 'BrandY'],
    ['7', 'Product G', '220', '35', 'BrandX'],
    ['8', 'Product H', '90', '40', 'BrandZ']
  ],
  columnMappings: [],
  mergedPreviewData: [
    ['ID', 'Name', 'Price', 'Stock', 'Brand'],
    ['1', 'Product A', '100', '50', 'N/A'],
    ['2', 'Product B', '200', '30', 'N/A'],
    ['3', 'Product C', '150', '20', 'N/A'],
    ['4', 'Product D', '300', '10', 'N/A'],
    ['5', 'Product E', '120', '25', 'BrandX']
  ],
  currentView: 'main',

  setMainFilePath: (path) => set({ mainFilePath: path }),
  setNewProductsFilePath: (path) => set({ newProductsFilePath: path }),
  setMainFileData: (data) => set({ mainFileData: data }),
  setNewProductsData: (data) => set({ newProductsData: data }),
  setColumnMappings: (mappings) => set({ columnMappings: mappings }),
  setMergedPreviewData: (data) => set({ mergedPreviewData: data }),
  setCurrentView: (view) => set({ currentView: view })
}))

export type { CellValue }
