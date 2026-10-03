# Brand Extraction Feature

## Overview

The brand extraction feature allows users to automatically detect brand names from product names in an Excel file and filter products by selected brands.

## How It Works

### 1. Brand Detection

The system analyzes the "المنتج" (Product) column in the Excel file and uses word frequency analysis to detect the most common brand names that appear at the beginning of product names.

**Algorithm:**
- Reads all product names from the المنتج column
- Splits each product name into words
- Focuses on the first 3 words (brands typically appear at the beginning)
- Counts word frequencies
- Returns brands that appear at least 2 times (configurable)
- Filters out very short words (< 2 characters) and numbers

### 2. Brand Selection

Users can:
- View all detected brands with their product counts
- Select/deselect individual brands
- Use "Select All" / "Deselect All" buttons
- See how many products match each brand

### 3. Product Extraction

Once brands are selected, the system:
- Filters the Excel file to include only products containing the selected brand names
- Preserves all columns and formatting from the original file
- Generates a new file with suffix `_filtered_brands.xlsx`
- Shows statistics (filtered count vs total count)

## File Structure

### Python Script
- **Location**: `scripts/extract_brands.py`
- **Functions**:
  - `detect_brands(file_path)` - Detects brands from the product column
  - `extract_by_brands(file_path, selected_brands)` - Filters products by brands

### TypeScript Integration
- **Main Process**: `src/main/index.ts`
  - IPC handler: `detect-brands` - Calls Python script to detect brands
  - IPC handler: `extract-by-brands` - Calls Python script to filter products
  
- **Preload Layer**: `src/preload/index.ts`
  - API: `detectBrands(filePath)` - Exposed to renderer
  - API: `extractByBrands(filePath, selectedBrands)` - Exposed to renderer

- **Renderer**: `src/renderer/src/components/BrandExtractionPage.tsx`
  - Full-featured UI for brand detection and extraction
  - State management via Zustand store

## Usage

### From the UI

1. Click "استخراج المنتجات حسب العلامة التجارية" from the main page
2. Select an Excel file containing products
3. Click "اكتشاف العلامات التجارية" to detect brands
4. Select the brands you want to extract
5. Click "استخراج المنتجات" to generate the filtered file

### From Command Line (for testing)

```bash
# Detect brands
python3 scripts/extract_brands.py detect path/to/file.xlsx

# Extract products by brands
python3 scripts/extract_brands.py extract path/to/file.xlsx '["Brand1", "Brand2"]'
```

## API Response Format

### Detect Brands Response
```json
{
  "success": true,
  "brands": [
    {"name": "سامسونج", "count": 4},
    {"name": "أبل", "count": 3}
  ],
  "product_column": "المنتج",
  "total_products": 14
}
```

### Extract By Brands Response
```json
{
  "success": true,
  "output_path": "/path/to/file_filtered_brands.xlsx",
  "filtered_count": 8,
  "total_count": 14
}
```

## Error Handling

The feature handles various error scenarios:
- Missing product column
- Empty product column
- File read/write errors
- Invalid brand selection
- JSON parsing errors

All errors are returned as JSON with `success: false` and an `error` message.

## Dependencies

### Python
- pandas
- openpyxl
- json (built-in)
- re (built-in)

These are already listed in `requirements.txt`.

## Testing

A comprehensive test suite is available in `/tmp/test_integration.py` that verifies:
- Brand detection accuracy
- Product filtering correctness
- File generation
- Arabic text handling

## Future Enhancements

Potential improvements:
- Machine learning-based brand detection
- Support for multiple product columns
- Brand name normalization (handling variations)
- Export brand statistics
- Preview filtered products before saving
- Batch processing of multiple files

## Arabic Language Support

The feature fully supports Arabic text:
- UTF-8 encoding throughout
- Right-to-left (RTL) UI layout
- Arabic error messages
- Proper handling of Arabic characters in brand names
