# UI Changes - Dynamic Header Row Selection

## Overview

This document illustrates the user interface changes for the dynamic header row selection feature.

## Before vs After

### BEFORE: Old Interface

The old interface only allowed specifying a start row number for the products file:

```
┌─────────────────────────────────────────────────────────────┐
│ اختيار ملف المنتجات الجديدة                                 │
│ [اختيار ملف] products.xlsx                                  │
│                                                              │
│ رقم الصف الذي تبدأ منه البيانات                             │
│ [Input: 9]                                                   │
│ الصف الذي يحتوي على العناوين في ملف المنتجات (مثلاً: 9...) │
└─────────────────────────────────────────────────────────────┘
```

**Limitations**:

- No visual preview of the file
- Manual input prone to errors
- Only for products file
- Main file assumed header at row 2

---

### AFTER: New Interface

The new interface provides visual preview and dropdown selection for BOTH files:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ اختيار الملف الرئيسي                                                    │
│ [اختيار ملف] main_file.xlsx                                             │
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ حدد الصف الذي يحتوي على العناوين (الملف الرئيسي)                │   │
│ │ [Dropdown: -- اختر رقم الصف -- ▼]                                 │   │
│ │         ├─ الصف 1                                                  │   │
│ │         ├─ الصف 2                                                  │   │
│ │         ├─ الصف 3                                                  │   │
│ │         └─ ... الصف 15                                             │   │
│ │                                                                     │   │
│ │ ⚠️ يرجى اختيار الصف الذي يحتوي على العناوين قبل المتابعة        │   │
│ │                                                                     │   │
│ │ معاينة أول 15 صف:                                                 │   │
│ │ ┌──────────────────────────────────────────────────────────────┐  │   │
│ │ │ #  │ عمود 1    │ عمود 2    │ عمود 3    │ عمود 4    │        │  │   │
│ │ ├────┼───────────┼───────────┼───────────┼───────────┤        │  │   │
│ │ │ 1  │ العنوان  │ العنوان  │ العنوان  │ العنوان  │        │  │   │
│ │ │ 2  │ رقم       │ الاسم     │ السعر     │ الكمية    │ ◄─ SELECTED│
│ │ │ 3  │ 001       │ منتج أ    │ 100       │ 50        │        │  │   │
│ │ │ 4  │ 002       │ منتج ب    │ 200       │ 30        │        │  │   │
│ │ │ 5  │ 003       │ منتج ج    │ 150       │ 20        │        │  │   │
│ │ └──────────────────────────────────────────────────────────────┘  │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ اختيار ملف المنتجات الجديدة                                             │
│ [اختيار ملف] products.xlsx                                              │
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ حدد الصف الذي يحتوي على العناوين (ملف المنتجات)                  │   │
│ │ [Dropdown: الصف 9 ▼]                                               │   │
│ │                                                                     │   │
│ │ معاينة أول 15 صف:                                                 │   │
│ │ ┌──────────────────────────────────────────────────────────────┐  │   │
│ │ │ #  │ عمود 1    │ عمود 2    │ عمود 3    │ عمود 4    │        │  │   │
│ │ ├────┼───────────┼───────────┼───────────┼───────────┤        │  │   │
│ │ │ 1  │ صف فارغ 1 │           │           │           │        │  │   │
│ │ │ 2  │ صف فارغ 2 │           │           │           │        │  │   │
│ │ │ ... (rows 3-8 omitted)                             │        │  │   │
│ │ │ 9  │ رقم       │ الاسم     │ السعر     │ الكمية    │ ◄─ SELECTED│
│ │ │ 10 │ 001       │ منتج أ    │ 100       │ 50        │        │  │   │
│ │ │ 11 │ 002       │ منتج ب    │ 200       │ 30        │        │  │   │
│ │ └──────────────────────────────────────────────────────────────┘  │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│ 💡 نصيحة: إذا كان ملفك يحتوي على بيانات غير منظمة...                  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Improvements**:

- ✅ Visual preview of first 15 rows
- ✅ Dropdown selection (no manual input errors)
- ✅ Works for BOTH main and products files
- ✅ Selected row highlighted in preview
- ✅ Validation messages guide the user
- ✅ Tip message for messy files

---

## Preview Section Details

### Preview Table Features

1. **Row Numbering**: Shows Excel row numbers (1-based)
2. **Row Highlighting**: Selected header row has blue background
3. **Column Display**: Shows first 5 columns of each row
4. **Truncation**: Shows first 15 characters of each cell
5. **Scrollable**: Can scroll horizontally if many columns

### Visual Indicators

```
Normal Row:     │ 3  │ 001       │ منتج أ    │ 100       │ 50        │
                └────┴───────────┴───────────┴───────────┴───────────┘

Header Row:     │ 2  │ رقم       │ الاسم     │ السعر     │ الكمية    │ ◄─ SELECTED
                └────┴───────────┴───────────┴───────────┴───────────┘
                ╰───────────────────── BLUE BACKGROUND ─────────────────╯
```

---

## Updated Main Page Preview

After selecting header rows, the main page shows updated previews:

```
┌────────────────────────────────────┬────────────────────────────────────┐
│  معاينة الملف الرئيسي             │  معاينة المنتجات الجديدة          │
├────────────────────────────────────┼────────────────────────────────────┤
│ [Shows data with selected header] │ [Shows data with selected header]  │
│                                    │                                    │
│ ┌──────────────────────────────┐  │ ┌──────────────────────────────┐   │
│ │ رقم  │ الاسم │ السعر │ ... │  │ │ رقم  │ الاسم │ السعر │ ... │   │
│ ├──────┼───────┼───────┼─────┤  │ ├──────┼───────┼───────┼─────┤   │
│ │ 001  │ منتج أ│ 100   │ ... │  │ │ 001  │ منتج أ│ 100   │ ... │   │
│ │ 002  │ منتج ب│ 200   │ ... │  │ │ 002  │ منتج ب│ 200   │ ... │   │
│ └──────────────────────────────┘  │ └──────────────────────────────┘   │
│                                    │                                    │
│ ملاحظة: العناوين في الصف 2        │ ملاحظة: العناوين في الصف 9        │
│ والبيانات تبدأ من الصف 3          │ والبيانات تبدأ من الصف 10         │
│ الصفوف أعلاه سيتم الحفاظ عليها    │                                    │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## Button States

### Disabled State (Before Header Selection)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│         [فتح أداة مطابقة الأعمدة] (DISABLED - GRAY)         │
│                                                              │
│  ⚠️ يرجى اختيار الصف الذي يحتوي على العناوين قبل المتابعة │
└─────────────────────────────────────────────────────────────┘
```

### Enabled State (After Header Selection)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│         [فتح أداة مطابقة الأعمدة] (ENABLED - GREEN)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Column Mapper Screen

No visual changes to the column mapper, but it now uses the selected header rows:

```
┌────────────────────────────────────────────────────────────────┐
│ أعمدة الملف الرئيسي          │  أعمدة المنتجات الجديدة        │
├───────────────────────────────┼─────────────────────────────────┤
│ [Headers from selected row]   │  [Headers from selected row]    │
│                               │                                 │
│ رقم المنتج *                 │  • رقم المنتج                   │
│ [Dropdown ▼]                  │  • الاسم                        │
│                               │  • السعر                        │
│ أسم المنتج *                 │  • الكمية                       │
│ [Dropdown ▼]                  │  • الوصف                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Color Coding

Throughout the interface:

- 🔵 **Blue**: Selected/Active header row
- 🟡 **Yellow**: Warning messages (e.g., rows before header preserved)
- 🔴 **Red**: Error messages (e.g., header not selected)
- 🟢 **Green**: Success actions (e.g., enabled buttons)
- ⚫ **Gray**: Disabled states

---

## Responsive Design

The interface adapts to different screen sizes:

### Desktop View (Wide)

```
┌────────────────────────────────────────────────────────────────┐
│  Main File                    │  Products File                 │
│  [Preview with 5+ columns]    │  [Preview with 5+ columns]     │
└────────────────────────────────────────────────────────────────┘
```

### Mobile/Narrow View

```
┌────────────────────────┐
│  Main File             │
│  [Preview 3 columns]   │
├────────────────────────┤
│  Products File         │
│  [Preview 3 columns]   │
└────────────────────────┘
```

---

## Accessibility Features

1. **Labels**: All form elements have proper Arabic labels
2. **Validation**: Clear error messages in Arabic
3. **Visual Feedback**: Highlighted rows show which is selected
4. **Tooltips**: Helpful messages explain what to do
5. **Keyboard Navigation**: Dropdowns are keyboard accessible

---

## User Flow

```
1. Select Main File
   ↓
2. See Preview (15 rows)
   ↓
3. Select Header Row from Dropdown
   ↓ (Selected row highlighted in blue)
4. Select Products File
   ↓
5. See Preview (15 rows)
   ↓
6. Select Header Row from Dropdown
   ↓ (Selected row highlighted in blue)
7. Both header rows selected?
   ├─ No → Button disabled, show warning
   └─ Yes → Button enabled
              ↓
              Click "فتح أداة مطابقة الأعمدة"
              ↓
              Proceed to Column Mapping
```

---

## Edge Cases Handled

### Case 1: File with < 15 Rows

```
┌────────────────────────────────────┐
│ حدد الصف الذي يحتوي على العناوين  │
│ [Dropdown: -- اختر رقم الصف -- ▼] │
│         ├─ الصف 1                  │
│         ├─ الصف 2                  │
│         └─ الصف 8  ← Only 8 rows! │
│                                    │
│ معاينة أول 8 صف:                  │
│ (Shows only available rows)        │
└────────────────────────────────────┘
```

### Case 2: No File Selected

```
┌────────────────────────────────────┐
│ اختيار الملف الرئيسي              │
│ [اختيار ملف]                       │
│                                    │
│ (No preview shown)                 │
└────────────────────────────────────┘
```

### Case 3: Large File (> 15 Rows)

```
┌────────────────────────────────────┐
│ معاينة أول 15 صف:                 │
│ ┌──────────────────────────────┐   │
│ │ 1  │ Data...                 │   │
│ │ 2  │ Data...                 │   │
│ │ ... (rows 3-14)              │   │
│ │ 15 │ Data...                 │   │
│ └──────────────────────────────┘   │
│                                    │
│ عرض أول 15 صف من إجمالي 1000 صف  │
└────────────────────────────────────┘
```

---

## Summary of UI Improvements

| Feature              | Before          | After                |
| -------------------- | --------------- | -------------------- |
| Visual Preview       | ❌ No           | ✅ Yes (15 rows)     |
| Header Selection     | ❌ Manual input | ✅ Dropdown          |
| Main File Header     | ❌ Hardcoded    | ✅ User selects      |
| Products File Header | ⚠️ Manual input | ✅ Dropdown          |
| Validation           | ⚠️ Minimal      | ✅ Comprehensive     |
| Visual Feedback      | ❌ None         | ✅ Highlighted row   |
| Error Prevention     | ⚠️ Limited      | ✅ Strong validation |
| RTL Support          | ✅ Yes          | ✅ Yes (maintained)  |

---

## Conclusion

The new UI provides a much more user-friendly experience for selecting header rows, with visual feedback, validation, and support for both files. Users can now handle Excel files with non-standard header positions with confidence.
