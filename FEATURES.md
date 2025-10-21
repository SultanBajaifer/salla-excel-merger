# الميزات المنفذة (Implemented Features)

## نظرة عامة

تم تنفيذ جميع المتطلبات المذكورة في المواصفات الأولية. التطبيق يدعم دمج ملفات Excel مع معالجة خاصة للأعمدة وحساب الأسعار والحفاظ على التنسيق.

---

## 1. معالجة صف العنوان (Title Row Handling)

### المشكلة
الملف الرئيسي يحتوي على صف عنوان في الصف الأول (Row 1) يجب:
- تجاهله أثناء معالجة البيانات
- الحفاظ عليه في الملف النهائي مع كامل التنسيق والألوان

### الحل المنفذ
```typescript
// في ColumnMapper.tsx - handlePreview()
// Add title row from main file (row 0)
if (mainFileData[0]) {
  mergedData.push(mainFileData[0])
}

// Add header row (row 1 from main file)
mergedData.push(mainColumns)

// Add existing data rows from main file (skip title and header rows)
const existingRows = mainFileData.slice(2)
existingRows.forEach((row) => {
  mergedData.push(row)
})
```

### النتيجة
✅ صف العنوان يُحفظ في الملف النهائي بدون معالجة
✅ صف العناوين (Row 2) يُستخدم للمطابقة
✅ البيانات الموجودة تبقى في مكانها

---

## 2. فئات الأعمدة (Column Categories)

### الأنواع المدعومة

#### 2.1 الأعمدة المطلوبة (Required Columns)
- **الأمثلة**: "أسم المنتج"، "باركود"
- **السلوك**: يجب مطابقتها بعمود من ملف المنتجات
- **التحقق**: التطبيق يعرض تنبيه إذا لم تتم المطابقة

```typescript
const requiredColumns = columnConfigs
  .filter((c) => c.category === 'required')
  .map((c) => c.name)

for (const reqCol of requiredColumns) {
  if (mainColumns.includes(reqCol) && !mappings[reqCol]) {
    alert(`يرجى مطابقة العمود المطلوب: ${reqCol}`)
    return
  }
}
```

#### 2.2 أعمدة الأسعار (Price Columns)
- **الأمثلة**: "سعر المنتج"، "سعر التكلفة"، "السعر المخفض"
- **السلوك**: تُحسب تلقائياً من عمود التكلفة
- **المعادلات**:
  ```
  سعر المنتج = التكلفة × الضريبة
  سعر التكلفة = التكلفة
  السعر المخفض = سعر المنتج ÷ التخفيض
  ```

```typescript
if (category === 'price' && costColumn) {
  if (mainCol === 'سعر المنتج') {
    // سعر المنتج = التكلفة × الضريبة
    mergedRow.push(costValue * taxRate)
  } else if (mainCol === 'سعر التكلفة') {
    // سعر التكلفة = التكلفة
    mergedRow.push(costValue)
  } else if (mainCol === 'السعر المخفض') {
    // السعر المخفض = سعر المنتج ÷ التخفيض
    const productPrice = costValue * taxRate
    mergedRow.push(discountRate > 1 ? productPrice / discountRate : productPrice)
  }
}
```

#### 2.3 الأعمدة الأخرى (Other Columns)
- **الأمثلة**: أي عمود آخر غير مطلوب أو سعر
- **الخيارات**:
  1. المطابقة مع عمود من ملف المنتجات
  2. إدخال قيمة يدوياً (تطبق على جميع الصفوف الجديدة)
  3. ترك فارغ

---

## 3. نموذج إعدادات الأسعار (Price Configuration Form)

### المكون: `PriceConfigForm.tsx`

#### الحقول المتاحة

##### 3.1 نسبة الضريبة (Tax Rate)
- **الإدخال**: نسبة مئوية (مثل: 15 لضريبة 15%)
- **التحويل**: يتم تحويلها إلى معامل (1.15)
- **الاستخدام**: ضرب سعر التكلفة لحساب سعر المنتج

```typescript
const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const value = parseFloat(e.target.value) || 0
  setTaxRate(1 + value / 100)
}
```

##### 3.2 نسبة التخفيض (Discount Rate)
- **الإدخال**: نسبة مئوية (مثل: 20 لتخفيض 20%)
- **التحويل**: يتم تحويلها إلى معامل (1.2)
- **الاستخدام**: قسمة سعر المنتج لحساب السعر المخفض

```typescript
const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const value = parseFloat(e.target.value) || 0
  setDiscountRate(value === 0 ? 1.0 : 1 + value / 100)
}
```

### المعاينة المباشرة
النموذج يعرض المعامل النهائي الذي سيتم استخدامه:
- "سيتم ضرب سعر التكلفة بـ 1.15"
- "سيتم قسمة السعر على 1.20"

---

## 4. اختيار عمود التكلفة (Cost Column Selection)

### الغرض
تحديد العمود من ملف المنتجات الذي يحتوي على تكلفة المنتج.

### التنفيذ
```typescript
<select
  className="w-full px-4 py-2 border border-gray-300 rounded-md"
  value={costColumn || ''}
  onChange={(e) => setCostColumn(e.target.value)}
>
  <option value="">-- اختر عمود التكلفة --</option>
  {newColumns.map((col: string, idx: number) => (
    <option key={idx} value={col}>
      {col}
    </option>
  ))}
</select>
```

### التحقق
يطلب التطبيق اختيار عمود التكلفة قبل المعاينة إذا كانت هناك أعمدة أسعار في الملف الرئيسي.

---

## 5. الحفاظ على التنسيق (Format Preservation)

### التحدي
عند حفظ الملف المدمج، يجب الحفاظ على:
- تنسيق صف العنوان (خطوط، ألوان، حدود)
- تنسيق صف العناوين
- عرض الأعمدة
- اتجاه RTL

### الحل المنفذ

#### 5.1 قراءة الملف الأصلي
```typescript
// Read the original main file to preserve formatting
const originalWorkbook = new ExcelJS.Workbook()
await originalWorkbook.xlsx.readFile(mainFilePath)
const originalWorksheet = originalWorkbook.worksheets[0]
```

#### 5.2 نسخ عرض الأعمدة
```typescript
originalWorksheet.columns.forEach((col, index) => {
  if (worksheet.columns[index]) {
    worksheet.columns[index].width = col.width
  }
})
```

#### 5.3 نسخ تنسيق الخلايا
```typescript
// Copy formatting for title row (row 0) and header row (row 1)
if (rowIndex === 0 || rowIndex === 1) {
  const originalRow = originalWorksheet.getRow(rowIndex + 1)
  
  // Copy row height
  newRow.height = originalRow.height
  
  // Copy cell formatting
  newRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const originalCell = originalRow.getCell(colNumber)
    
    // Copy font, fill, border, alignment, numFmt
    if (originalCell.font) cell.font = { ...originalCell.font }
    if (originalCell.fill) cell.fill = { ...originalCell.fill }
    if (originalCell.border) cell.border = { ...originalCell.border }
    if (originalCell.alignment) cell.alignment = { ...originalCell.alignment }
    if (originalCell.numFmt) cell.numFmt = originalCell.numFmt
  })
}
```

#### 5.4 تطبيق RTL
```typescript
// Apply RTL to worksheet
worksheet.views = [{ rightToLeft: true }]
```

---

## 6. منطق الدمج (Merging Logic)

### الترتيب النهائي للصفوف

```
Row 1: [صف العنوان - محفوظ مع التنسيق]
Row 2: [صف العناوين]
Row 3-N: [البيانات الموجودة من الملف الرئيسي]
Row N+1 إلى النهاية: [المنتجات الجديدة مع البيانات المحسوبة]
```

### التنفيذ
```typescript
// 1. Add title row
mergedData.push(mainFileData[0])

// 2. Add header row
mergedData.push(mainColumns)

// 3. Add existing data
const existingRows = mainFileData.slice(2)
existingRows.forEach((row) => mergedData.push(row))

// 4. Add new products with calculations
const newRows = newProductsData.slice(1)
newRows.forEach((newRow) => {
  // Process and add merged row
})
```

---

## 7. واجهة المستخدم (User Interface)

### 7.1 الواجهة الرئيسية
- اختيار الملف الرئيسي
- اختيار ملف المنتجات الجديدة
- معاينة أول 5 صفوف من كل ملف
- ملاحظة حول صف العنوان

### 7.2 واجهة مطابقة الأعمدة
- نموذج إعدادات الأسعار (أزرق فاتح)
- نموذج اختيار عمود التكلفة (أصفر فاتح)
- قائمة الأعمدة الرئيسية مع المؤشرات:
  - ⭐ (نجمة حمراء) للأعمدة المطلوبة
  - 🔵 (علامة زرقاء) للأعمدة المحسوبة تلقائياً
- قائمة الأعمدة الجديدة

### 7.3 واجهة المعاينة
- عرض البيانات المدمجة
- أزرار:
  - العودة إلى أداة المطابقة
  - حفظ الملف الرئيسي

---

## 8. إدارة الحالة (State Management)

تم استخدام Zustand لإدارة الحالة مع الحقول التالية:

```typescript
interface AppState {
  mainFilePath: string | null
  newProductsFilePath: string | null
  mainFileData: CellValue[][]
  newProductsData: CellValue[][]
  columnMappings: ColumnMapping[]
  mergedPreviewData: CellValue[][]
  currentView: 'main' | 'mapper' | 'preview'
  
  // New fields for price calculations
  taxRate: number        // Default: 1.15 (15% tax)
  discountRate: number   // Default: 1.0 (no discount)
  costColumn: string | null
}
```

---

## 9. معالجة الأخطاء (Error Handling)

### التحققات المنفذة

#### 9.1 التحقق من الملفات
```typescript
if (!mainFileData.length || !newProductsData.length) {
  alert('يرجى اختيار كلا الملفين أولاً')
  return
}
```

#### 9.2 التحقق من الأعمدة المطلوبة
```typescript
for (const reqCol of requiredColumns) {
  if (mainColumns.includes(reqCol) && !mappings[reqCol]) {
    alert(`يرجى مطابقة العمود المطلوب: ${reqCol}`)
    return
  }
}
```

#### 9.3 التحقق من عمود التكلفة
```typescript
if (hasPriceColumns && !costColumn) {
  alert('يرجى اختيار عمود التكلفة لحساب الأسعار')
  return
}
```

#### 9.4 معالجة أخطاء القراءة/الكتابة
```typescript
try {
  const data = await window.api.readExcelFile(filePath)
  setMainFileData(data)
} catch (error) {
  console.error('خطأ في اختيار الملف الرئيسي:', error)
  alert('حدث خطأ أثناء قراءة الملف الرئيسي')
}
```

---

## 10. التوافق والأداء (Compatibility & Performance)

### المتطلبات المدعومة
✅ Windows only (حسب المواصفات)
✅ ملفات Excel (.xlsx, .xls)
✅ النصوص العربية مع RTL
✅ الخلايا المدمجة
✅ التنسيقات المعقدة

### الأداء
- معالجة Excel في العملية الرئيسية (Main Process)
- تجنب مشاكل الأداء في واجهة المستخدم
- استخدام ExcelJS لقراءة وكتابة الملفات بكفاءة

---

## 11. الاختبار (Testing)

راجع ملف `TESTING.md` لتعليمات الاختبار الكاملة.

### ملفات الاختبار
يمكن إنشاء ملفات اختبار باستخدام:
```bash
node create-test-files.js
```

### الحالات المختبرة
✅ قراءة الملفات مع النصوص العربية
✅ حفظ صف العنوان مع التنسيق
✅ حساب الأسعار بشكل صحيح
✅ التحقق من الأعمدة المطلوبة
✅ المطابقة اليدوية والتلقائية
✅ الحفاظ على البيانات الموجودة

---

## الملخص

تم تنفيذ جميع المتطلبات المذكورة في المواصفات:

1. ✅ معالجة صف العنوان مع الحفاظ على التنسيق
2. ✅ ثلاثة أنواع من الأعمدة (مطلوبة، أسعار، أخرى)
3. ✅ حساب الأسعار التلقائي مع الضريبة والتخفيض
4. ✅ واجهة عربية كاملة مع RTL
5. ✅ الحفاظ على تنسيق Excel الأصلي
6. ✅ دمج المنتجات بعد البيانات الموجودة
7. ✅ معالجة أخطاء شاملة

التطبيق جاهز للاستخدام في بيئة الإنتاج على Windows.
