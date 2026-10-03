# Dynamic Header Row Selection - Testing Guide

## Overview

This document describes the new **Dynamic Header Row Selection** feature and provides testing instructions.

## Feature Description

The application now allows users to dynamically select which row contains the headers for both the **Main File** and the **Products File**, instead of automatically assuming or skipping rows.

### Key Changes

1. **File Selection with Preview**
   - After selecting a file, the system displays the first 15 rows in a preview table
   - A dropdown allows users to select which row contains the headers (1-15)
   - The selected header row is highlighted in blue in the preview

2. **Flexible Header Position**
   - Both files support headers at any row position
   - Rows before the header are preserved in the final output
   - Data rows are correctly identified as everything after the header row

3. **Validation**
   - Users must select a header row for both files before proceeding
   - Clear error messages guide users if header rows are not selected

4. **Backward Compatibility**
   - The old `productsStartRow` field is preserved but deprecated
   - New files should use `mainFileHeaderRow` and `productsFileHeaderRow`

## User Interface Changes

### Main File Selection

```
اختيار الملف الرئيسي
[اختيار ملف] filename.xlsx

┌─────────────────────────────────────────────────────┐
│ حدد الصف الذي يحتوي على العناوين (الملف الرئيسي)  │
│ [Dropdown: الصف 1, الصف 2, ... الصف 15]            │
│                                                      │
│ معاينة أول 15 صف:                                  │
│ ┌────────────────────────────────────────────────┐  │
│ │ 1  │ Cell 1  │ Cell 2  │ Cell 3  │ Cell 4  │   │
│ │ 2  │ Header1 │ Header2 │ Header3 │ Header4 │ ← │ (Highlighted if selected)
│ │ 3  │ Data 1  │ Data 2  │ Data 3  │ Data 4  │   │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Products File Selection

Same interface with label: "حدد الصف الذي يحتوي على العناوين (ملف المنتجات)"

## Testing Scenarios

### Test Files

You can create test files using the provided script in `/tmp/create-test-files.js`:

```bash
cd /home/runner/work/salla-excel-merger/salla-excel-merger
node /tmp/create-test-files.js
```

This creates:

- `main_header_row1.xlsx` - Header at row 1
- `main_header_row2.xlsx` - Header at row 2 (with title in row 1)
- `main_header_row5.xlsx` - Header at row 5 (with empty rows above)
- `products_header_row1.xlsx` - Header at row 1
- `products_header_row9.xlsx` - Header at row 9 (with empty rows above)

### Test Case 1: Both Headers at Row 1

**Scenario**: Standard case where both files have headers in the first row

**Steps**:

1. Select `main_header_row1.xlsx` as main file
2. Select row 1 as header for main file
3. Select `products_header_row1.xlsx` as products file
4. Select row 1 as header for products file
5. Proceed to column mapping
6. Map columns and preview
7. Save the merged file

**Expected Result**:

- Headers correctly identified
- Data rows start from row 2 in both files
- Merged file has correct structure

### Test Case 2: Main at Row 2, Products at Row 1

**Scenario**: Main file has a title row, products file is standard

**Steps**:

1. Select `main_header_row2.xlsx` as main file
2. Select row 2 as header for main file
3. Select `products_header_row1.xlsx` as products file
4. Select row 1 as header for products file
5. Proceed to column mapping
6. Map columns and preview
7. Save the merged file

**Expected Result**:

- Title row (row 1) from main file is preserved in output
- Headers correctly identified from row 2 of main file
- Merged file maintains title row formatting

### Test Case 3: Both Headers at Non-Standard Positions

**Scenario**: Testing maximum flexibility with headers at rows 5 and 9

**Steps**:

1. Select `main_header_row5.xlsx` as main file
2. Select row 5 as header for main file
3. Select `products_header_row9.xlsx` as products file
4. Select row 9 as header for products file
5. Proceed to column mapping
6. Map columns and preview
7. Save the merged file

**Expected Result**:

- All rows before row 5 in main file are preserved
- Headers correctly identified from row 5 of main file
- Products data correctly read from row 10 onwards
- Merged file maintains all original structure

### Test Case 4: File with Fewer Than 15 Rows

**Scenario**: Ensure dropdown handles files with fewer rows

**Steps**:

1. Select a file with only 8 rows
2. Verify dropdown only shows options 1-8
3. Select appropriate header row
4. Proceed with merge

**Expected Result**:

- Dropdown adapts to actual number of rows
- No errors when file has fewer than 15 rows

### Test Case 5: No Header Selected

**Scenario**: Validation prevents proceeding without header selection

**Steps**:

1. Select both files
2. Do NOT select header rows
3. Try to click "فتح أداة مطابقة الأعمدة"

**Expected Result**:

- Alert message: "يرجى اختيار الصف الذي يحتوي على العناوين للملف الرئيسي"
- Button is disabled until both header rows are selected

### Test Case 6: Edge Case - Header at Last Row

**Scenario**: Testing edge case where header is at the last row

**Steps**:

1. Create or use a file where the header is the last row
2. Select that row as header
3. Proceed with merge

**Expected Result**:

- System handles case gracefully
- No data rows to merge (0 data rows)
- Existing data in main file is preserved

## Technical Implementation

### State Management (Zustand Store)

```typescript
interface AppState {
  mainFileHeaderRow: number | null // 1-based index
  productsFileHeaderRow: number | null // 1-based index
  // ... other fields
}
```

### Column Extraction Logic

```typescript
// Main file headers (1-based to 0-based conversion)
const mainHeaderIndex = (mainFileHeaderRow || 2) - 1
const mainColumns = mainFileData[mainHeaderIndex] || []

// Products file headers
const productsHeaderIndex = (productsFileHeaderRow || 1) - 1
const newColumns = newProductsData[productsHeaderIndex] || []
```

### Data Slicing Logic

```typescript
// Rows before header (preserved in output)
for (let i = 0; i < mainHeaderIndex; i++) {
  mergedData.push(mainFileData[i])
}

// Header row
mergedData.push(mainColumns)

// Existing data (after header)
const existingRows = mainFileData.slice(mainHeaderIndex + 1)

// New products data (after header)
const newRows = newProductsData.slice(productsHeaderIndex + 1)
```

### Formatting Preservation

The save logic now preserves formatting for ALL rows from the original file (not just the first 2):

```typescript
// Copy formatting for all rows that existed in original file
if (originalWorksheet && rowIndex < originalRowCount) {
  const originalRow = originalWorksheet.getRow(rowIndex + 1)
  // Copy formatting...
}
```

## Verification Checklist

After implementation, verify:

- [ ] File preview shows first 15 rows correctly
- [ ] Dropdown shows correct number of options (1-15 or fewer)
- [ ] Selected header row is highlighted in preview
- [ ] Validation prevents proceeding without header selection
- [ ] Column mapper shows correct headers based on selection
- [ ] Data rows are correctly identified
- [ ] Rows before header are preserved in output
- [ ] Formatting is preserved for all original rows
- [ ] Merged file has correct structure and alignment
- [ ] No regression in existing functionality

## Common Issues and Solutions

### Issue: Preview not updating after file selection

**Solution**: Ensure file data is loaded before rendering FileSelector component

### Issue: Dropdown shows wrong number of options

**Solution**: Check that `fileData.length` is correctly passed to FileSelector

### Issue: Headers not extracted correctly

**Solution**: Verify 1-based to 0-based index conversion in ColumnMapper

### Issue: Formatting lost in merged file

**Solution**: Check that save logic preserves formatting for all original rows

## Performance Considerations

- Preview limited to first 15 rows for performance
- Full file data is still loaded for processing
- Formatting preservation only applied to rows from original file

## Browser/Platform Support

- This is an Electron application
- Tested on Windows (as per original requirements)
- Should work on other platforms where Electron is supported

## Future Enhancements

Potential improvements for future versions:

1. **Auto-detect header row**: Analyze data to suggest most likely header row
2. **Multiple worksheet support**: Allow selection of which worksheet to use
3. **Header row preview**: Show a better visual indicator of which row is the header
4. **Save header preferences**: Remember user's header selections for similar files
5. **Batch processing**: Support multiple files with same header row settings

## Conclusion

The dynamic header row selection feature provides flexibility for users working with Excel files where headers are not in standard positions. This is particularly useful for files exported from various systems that may include title rows, empty rows, or metadata before the actual data headers.
