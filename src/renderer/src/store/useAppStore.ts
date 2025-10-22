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
  currentView: 'main' | 'mapper' | 'preview'

  // Products file data start row (1-based index, e.g., 9 means data starts at row 9)
  productsStartRow: number

  // النسبة ١ and النسبة ٢ for price calculations
  ratio1: number // النسبة ١ (e.g., 1.3 for 30% increase)
  ratio2: number // النسبة ٢ (e.g., 1.2 for 20% increase)

  // Column to use for cost in price calculations
  costColumn: string | null

  setMainFilePath: (path: string | null) => void
  setNewProductsFilePath: (path: string | null) => void
  setMainFileData: (data: CellValue[][]) => void
  setNewProductsData: (data: CellValue[][]) => void
  setColumnMappings: (mappings: ColumnMapping[]) => void
  setMergedPreviewData: (data: CellValue[][]) => void
  setCurrentView: (view: 'main' | 'mapper' | 'preview') => void
  setProductsStartRow: (row: number) => void
  setRatio1: (rate: number) => void
  setRatio2: (rate: number) => void
  setCostColumn: (column: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  mainFilePath: null,
  newProductsFilePath: null,
  mainFileData: [],
  newProductsData: [],
  columnMappings: [],
  mergedPreviewData: [],
  currentView: 'main',
  productsStartRow: 1, // Default: data starts at row 1 (0-indexed would be row 2 in Excel)
  ratio1: 1.0, // Default: no change (النسبة ١)
  ratio2: 1.0, // Default: no change (النسبة ٢)
  costColumn: null,

  setMainFilePath: (path) => set({ mainFilePath: path }),
  setNewProductsFilePath: (path) => set({ newProductsFilePath: path }),
  setMainFileData: (data) => set({ mainFileData: data }),
  setNewProductsData: (data) => set({ newProductsData: data }),
  setColumnMappings: (mappings) => set({ columnMappings: mappings }),
  setMergedPreviewData: (data) => set({ mergedPreviewData: data }),
  setCurrentView: (view) => set({ currentView: view }),
  setProductsStartRow: (row) => set({ productsStartRow: row }),
  setRatio1: (rate) => set({ ratio1: rate }),
  setRatio2: (rate) => set({ ratio2: rate }),
  setCostColumn: (column) => set({ costColumn: column })
}))

export type { CellValue, ColumnConfig, ColumnCategory }
