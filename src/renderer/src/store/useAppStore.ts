import { create } from 'zustand'

type CellValue = string | number | boolean | null

interface ColumnMapping {
  newColumn: string | null
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
  mainFileData: [],
  newProductsData: [],
  columnMappings: [],
  mergedPreviewData: [],
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
