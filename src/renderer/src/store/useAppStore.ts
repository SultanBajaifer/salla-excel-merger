import { create } from 'zustand'

type CellValue = string | number | boolean | null

interface ColumnMapping {
  newColumn: string | null
  mainColumn: string
  manualValue?: string
}

// Column categories
type ColumnCategory = 'required' | 'price' | 'other'

interface ColumnConfig {
  name: string
  category: ColumnCategory
}

interface AppState {
  mainFilePath: string | null
  newProductsFilePath: string | null
  mainFileData: CellValue[][]
  newProductsData: CellValue[][]
  columnMappings: ColumnMapping[]
  mergedPreviewData: CellValue[][]
  currentView: 'main' | 'mapper' | 'preview' | 'cleaning'

  // Header row indices (1-based, e.g., 1 means row 1 is the header)
  mainFileHeaderRow: number | null
  productsFileHeaderRow: number | null

  // Products file data start row (1-based index, e.g., 9 means data starts at row 9)
  // DEPRECATED: Use productsFileHeaderRow instead
  productsStartRow: number

  // النسبة ١ and النسبة ٢ for price calculations
  ratio1: number // النسبة ١ (e.g., 1.3 for 30% increase)
  ratio2: number // النسبة ٢ (e.g., 1.2 for 20% increase)

  // Column to use for cost in price calculations
  costColumn: string | null

  // Cleaning page state
  cleaningFilePath: string | null
  cleaningFileData: CellValue[][]
  cleanedFilePath: string | null

  setMainFilePath: (path: string | null) => void
  setNewProductsFilePath: (path: string | null) => void
  setMainFileData: (data: CellValue[][]) => void
  setNewProductsData: (data: CellValue[][]) => void
  setColumnMappings: (mappings: ColumnMapping[]) => void
  setMergedPreviewData: (data: CellValue[][]) => void
  setCurrentView: (view: 'main' | 'mapper' | 'preview' | 'cleaning') => void
  setMainFileHeaderRow: (row: number | null) => void
  setProductsFileHeaderRow: (row: number | null) => void
  setProductsStartRow: (row: number) => void
  setRatio1: (rate: number) => void
  setRatio2: (rate: number) => void
  setCostColumn: (column: string | null) => void
  setCleaningFilePath: (path: string | null) => void
  setCleaningFileData: (data: CellValue[][]) => void
  setCleanedFilePath: (path: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  mainFilePath: null,
  newProductsFilePath: null,
  mainFileData: [],
  newProductsData: [],
  columnMappings: [],
  mergedPreviewData: [],
  currentView: 'main',
  mainFileHeaderRow: null, // User must select header row
  productsFileHeaderRow: null, // User must select header row
  productsStartRow: 2, // Default: data starts at row 2 (headers at row 1) - DEPRECATED
  ratio1: 1.0, // Default: no change (النسبة ١)
  ratio2: 1.0, // Default: no change (النسبة ٢)
  costColumn: null,
  cleaningFilePath: null,
  cleaningFileData: [],
  cleanedFilePath: null,

  setMainFilePath: (path) => set({ mainFilePath: path }),
  setNewProductsFilePath: (path) => set({ newProductsFilePath: path }),
  setMainFileData: (data) => set({ mainFileData: data }),
  setNewProductsData: (data) => set({ newProductsData: data }),
  setColumnMappings: (mappings) => set({ columnMappings: mappings }),
  setMergedPreviewData: (data) => set({ mergedPreviewData: data }),
  setCurrentView: (view) => set({ currentView: view }),
  setMainFileHeaderRow: (row) => set({ mainFileHeaderRow: row }),
  setProductsFileHeaderRow: (row) => set({ productsFileHeaderRow: row }),
  setProductsStartRow: (row) => set({ productsStartRow: row }),
  setRatio1: (rate) => set({ ratio1: rate }),
  setRatio2: (rate) => set({ ratio2: rate }),
  setCostColumn: (column) => set({ costColumn: column }),
  setCleaningFilePath: (path) => set({ cleaningFilePath: path }),
  setCleaningFileData: (data) => set({ cleaningFileData: data }),
  setCleanedFilePath: (path) => set({ cleanedFilePath: path })
}))

export type { CellValue, ColumnConfig, ColumnCategory }
