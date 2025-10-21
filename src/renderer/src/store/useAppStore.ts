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

  // Tax and discount for price calculations
  taxRate: number // الضريبة (e.g., 1.15 for 15% tax)
  discountRate: number // التخفيض (e.g., 1.2 to divide by)

  // Column to use for cost in price calculations
  costColumn: string | null

  setMainFilePath: (path: string | null) => void
  setNewProductsFilePath: (path: string | null) => void
  setMainFileData: (data: CellValue[][]) => void
  setNewProductsData: (data: CellValue[][]) => void
  setColumnMappings: (mappings: ColumnMapping[]) => void
  setMergedPreviewData: (data: CellValue[][]) => void
  setCurrentView: (view: 'main' | 'mapper' | 'preview') => void
  setTaxRate: (rate: number) => void
  setDiscountRate: (rate: number) => void
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
  taxRate: 1.15, // Default 15% tax
  discountRate: 1.0, // Default no discount
  costColumn: null,

  setMainFilePath: (path) => set({ mainFilePath: path }),
  setNewProductsFilePath: (path) => set({ newProductsFilePath: path }),
  setMainFileData: (data) => set({ mainFileData: data }),
  setNewProductsData: (data) => set({ newProductsData: data }),
  setColumnMappings: (mappings) => set({ columnMappings: mappings }),
  setMergedPreviewData: (data) => set({ mergedPreviewData: data }),
  setCurrentView: (view) => set({ currentView: view }),
  setTaxRate: (rate) => set({ taxRate: rate }),
  setDiscountRate: (rate) => set({ discountRate: rate }),
  setCostColumn: (column) => set({ costColumn: column })
}))

export type { CellValue, ColumnConfig, ColumnCategory }
