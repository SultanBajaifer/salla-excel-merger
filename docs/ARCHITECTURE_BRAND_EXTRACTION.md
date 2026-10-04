# Brand Extraction Feature - Architecture Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron App                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Renderer Process (React/TypeScript)          │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │      BrandExtractionPage Component           │   │  │
│  │  │                                               │   │  │
│  │  │  1. User selects Excel file                  │   │  │
│  │  │  2. Clicks "Detect Brands"                   │   │  │
│  │  │  3. Brands displayed with counts             │   │  │
│  │  │  4. User selects brands                      │   │  │
│  │  │  5. Clicks "Extract Products"                │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                        ↕                              │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │        Zustand Store (State Management)       │   │  │
│  │  │  - brandExtractionFilePath                    │   │  │
│  │  │  - detectedBrands                             │   │  │
│  │  │  - selectedBrands                             │   │  │
│  │  │  - extractedFilePath                          │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↕                               │
│                    window.api (IPC)                          │
│                              ↕                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Preload Layer (Security Bridge)            │  │
│  │                                                        │  │
│  │  - detectBrands(filePath)                             │  │
│  │  - extractByBrands(filePath, selectedBrands)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↕                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Main Process (Node.js/Electron)            │  │
│  │                                                        │  │
│  │  IPC Handlers:                                        │  │
│  │  - 'detect-brands'                                    │  │
│  │  - 'extract-by-brands'                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↕                               │
│                      execFileAsync                           │
│                              ↕                               │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│              Python Script (extract_brands.py)               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Command: python3 extract_brands.py detect <file_path>       │
│           ↓                                                   │
│  1. Read Excel file                                          │
│  2. Find "المنتج" column                                     │
│  3. Analyze product names                                    │
│  4. Count word frequencies                                   │
│  5. Return JSON with detected brands                         │
│                                                               │
│  Command: python3 extract_brands.py extract <file> <brands>  │
│           ↓                                                   │
│  1. Read Excel file                                          │
│  2. Filter rows by selected brands                           │
│  3. Save filtered file as *_filtered_brands.xlsx             │
│  4. Return JSON with result                                  │
│                                                               │
│  Dependencies: pandas, openpyxl, json, re                    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### 1. Brand Detection Flow

```
User Action                           System Response
─────────────────────────────────────────────────────────────
Select Excel File  ─────►  Store file path in state
                           
Click "Detect Brands" ────►  Call window.api.detectBrands()
                           
                           IPC to Main Process
                           
                           Execute Python script:
                           python3 extract_brands.py detect <file>
                           
                           Python analyzes المنتج column:
                           - Split product names into words
                           - Count word frequencies
                           - Filter by minimum frequency
                           - Return top brands with counts
                           
                           Return JSON:
                           {
                             "success": true,
                             "brands": [
                               {"name": "سامسونج", "count": 4},
                               {"name": "أبل", "count": 3}
                             ],
                             "product_column": "المنتج",
                             "total_products": 14
                           }
                           
                           Update state with detected brands
                           
Display Brands with Counts ◄── Render brand list in UI
```

### 2. Product Extraction Flow

```
User Action                           System Response
─────────────────────────────────────────────────────────────
Select Brands  ─────────►  Update selectedBrands in state
(Checkboxes)
                           
Click "Extract Products" ──►  Call window.api.extractByBrands()
                           
                           IPC to Main Process
                           
                           Execute Python script:
                           python3 extract_brands.py extract <file> <brands_json>
                           
                           Python filters products:
                           - Read Excel file
                           - Filter rows where product name contains
                             any of the selected brands (case-insensitive)
                           - Preserve all columns and structure
                           - Save as *_filtered_brands.xlsx
                           
                           Return JSON:
                           {
                             "success": true,
                             "output_path": "/path/to/file_filtered.xlsx",
                             "filtered_count": 8,
                             "total_count": 14
                           }
                           
                           Update state with output path
                           
Show Success Message  ◄──── Display file path and statistics
```

## Component Structure

```
App.tsx
├── currentView === 'main'
│   ├── FileSelector (Main File)
│   ├── FileSelector (New Products)
│   ├── Button: "تنظيف ملف الإكسل" → CleaningPage
│   └── Button: "استخراج المنتجات حسب العلامة التجارية" → BrandExtractionPage
│
├── currentView === 'brand-extraction'
│   └── BrandExtractionPage
│       ├── File Selection Section
│       │   ├── Select File Button
│       │   └── Detect Brands Button
│       │
│       ├── Brand Detection Results (if brands detected)
│       │   ├── Statistics Display
│       │   ├── Select All / Deselect All Buttons
│       │   ├── Brand Checkboxes Grid
│       │   │   └── [Checkbox] Brand Name (Count)
│       │   └── Extract Products Button
│       │
│       └── Success Message (if extracted)
│           ├── File Path Display
│           ├── Statistics (filtered/total)
│           └── Extract Another File Button
│
├── currentView === 'cleaning'
│   └── CleaningPage (existing)
│
└── currentView === 'mapper' | 'preview'
    └── ... (existing features)
```

## State Management (Zustand Store)

```typescript
interface AppState {
  // ... existing state ...
  
  // Brand Extraction State
  brandExtractionFilePath: string | null      // Selected Excel file
  detectedBrands: Array<{                     // Detected brands from file
    name: string
    count: number
  }>
  selectedBrands: string[]                    // User-selected brands
  extractedFilePath: string | null            // Output file path
  
  // Actions
  setBrandExtractionFilePath(path)
  setDetectedBrands(brands)
  setSelectedBrands(brands)
  setExtractedFilePath(path)
}
```

## Error Handling

```
┌─────────────────────────────────────────────────┐
│              Error Scenarios                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. File Not Found                              │
│     → Display: "الملف غير موجود"                │
│                                                  │
│  2. Missing المنتج Column                       │
│     → Display: "لم يتم العثور على عمود المنتج"  │
│                                                  │
│  3. Empty Product Column                        │
│     → Display: "لا توجد منتجات في العمود"       │
│                                                  │
│  4. No Brands Detected                          │
│     → Display: "لم يتم العثور على علامات"      │
│                                                  │
│  5. No Brands Selected                          │
│     → Display: "يرجى اختيار علامة واحدة"        │
│                                                  │
│  6. No Matching Products                        │
│     → Display: "لم يتم العثور على منتجات"       │
│                                                  │
│  7. File Read/Write Error                       │
│     → Display error message from Python          │
│                                                  │
│  All errors returned as JSON with success=false │
└─────────────────────────────────────────────────┘
```
