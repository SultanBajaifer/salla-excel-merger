# تفاصيل التنفيذ (Implementation Details)

## نظرة عامة

تم تنفيذ تطبيق دمج ملفات Excel لمتجر سلة بالكامل حسب المواصفات المطلوبة. التطبيق مبني باستخدام Electron + React + TypeScript مع واجهة عربية كاملة ودعم RTL.

## المميزات المنفذة

### 1. الواجهة العربية والتخطيط RTL

- **index.html**: تم إضافة `lang="ar"` و `dir="rtl"` إلى عنصر HTML
- **CSS**: تم تحديث الخطوط والتوجيه لدعم RTL
- **جميع النصوص**: تم تحويل جميع النصوص في الواجهة إلى العربية
- **الجداول**: تم إضافة `text-right` للمحاذاة الصحيحة في الجداول

### 2. اتصال IPC لحوارات الملفات

تم تنفيذ معالجات IPC في `src/main/index.ts`:

```typescript
// اختيار ملف
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'ملفات Excel', extensions: ['xlsx', 'xls'] },
      { name: 'جميع الملفات', extensions: ['*'] }
    ]
  })
  return result.canceled ? null : result.filePaths[0]
})

// حفظ ملف
ipcMain.handle('save-file', async (_, defaultPath: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: [{ name: 'ملفات Excel', extensions: ['xlsx'] }]
  })
  return result.canceled ? null : result.filePath
})
```

### 3. قراءة وكتابة ملفات Excel

تم تنفيذ معالجات IPC في العملية الرئيسية باستخدام ExcelJS:

```typescript
// قراءة ملف Excel
ipcMain.handle('read-excel-file', async (_, filePath: string) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]
  // قراءة جميع الصفوف وإرجاع مصفوفة ثنائية الأبعاد
  return data
})

// حفظ ملف Excel
ipcMain.handle('save-excel-file', async (_, filePath: string, data: unknown[][]) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('البيانات المدمجة')
  // إضافة البيانات وحفظ الملف
})
```

### 4. معاينة البيانات

- يتم عرض أول 5 صفوف من كل ملف في جداول منفصلة
- إذا لم يتم تحميل بيانات، يظهر النص: "لم يتم تحميل أي بيانات بعد"
- الجداول تدعم RTL مع محاذاة النص لليمين

### 5. مطابقة الأعمدة

تم تنفيذ أداة مطابقة الأعمدة في `ColumnMapper.tsx`:

- عرض أعمدة الملف الرئيسي على اليمين (في تخطيط RTL)
- عرض أعمدة المنتجات الجديدة على اليسار (في تخطيط RTL)
- لكل عمود رئيسي، يمكن:
  - اختيار عمود مطابق من المنتجات الجديدة
  - أو اختيار "إدخال قيمة يدوياً" وإدخال قيمة افتراضية

### 6. دمج البيانات

منطق الدمج في `ColumnMapper.tsx`:

```typescript
const handlePreview = () => {
  const mergedData: CellValue[][] = []
  mergedData.push(mainColumns) // إضافة صف العناوين
  
  newRows.forEach((newRow) => {
    const mergedRow: CellValue[] = []
    mainColumns.forEach((mainCol) => {
      const mapping = mappings[mainCol]
      if (mapping === 'manual') {
        mergedRow.push(manualValues[mainCol] || '')
      } else if (mapping) {
        const newColIndex = newColumns.indexOf(mapping)
        mergedRow.push(newRow[newColIndex])
      } else {
        mergedRow.push('')
      }
    })
    mergedData.push(mergedRow)
  })
  
  setMergedPreviewData(mergedData)
}
```

### 7. حفظ الملف

- يتم فتح حوار حفظ الملف مع اسم افتراضي عربي: `الملف_الرئيسي_محدث.xlsx`
- يتم حفظ الملف باستخدام ExcelJS في العملية الرئيسية
- عرض رسالة نجاح بالعربية: "تم حفظ الملف بنجاح"

## البنية التقنية

### إدارة الحالة (Zustand)

```typescript
interface AppState {
  mainFilePath: string | null
  newProductsFilePath: string | null
  mainFileData: CellValue[][]
  newProductsData: CellValue[][]
  columnMappings: ColumnMapping[]
  mergedPreviewData: CellValue[][]
  currentView: 'main' | 'mapper' | 'preview'
  // ... setters
}
```

### تدفق البيانات

1. **الواجهة الرئيسية**: اختيار الملفات → قراءة عبر IPC → تخزين في Store → معاينة
2. **أداة المطابقة**: إنشاء المطابقات → دمج البيانات → تخزين في Store
3. **واجهة المعاينة**: عرض البيانات المدمجة → حفظ عبر IPC

### معالجة الأخطاء

جميع رسائل الأخطاء بالعربية:
- "حدث خطأ أثناء قراءة الملف الرئيسي"
- "حدث خطأ أثناء قراءة ملف المنتجات الجديدة"
- "حدث خطأ أثناء حفظ الملف"
- "يرجى اختيار كلا الملفين أولاً"

## الاختبار

تم إنشاء ملفات Excel تجريبية مع محتوى عربي:
- `main-file.xlsx`: يحتوي على أعمدة (رقم المنتج، اسم المنتج، السعر، الكمية)
- `new-products.xlsx`: يحتوي على أعمدة (الرقم، العنوان، التكلفة، العدد، العلامة التجارية)

تم التحقق من:
- ✅ قراءة الملفات مع النص العربي
- ✅ عرض البيانات بشكل صحيح في RTL
- ✅ البناء ينجح بدون أخطاء
- ✅ فحص الأنواع ينجح
- ✅ لا توجد أخطاء في eslint

## البناء والتشغيل

```bash
# التطوير
npm run dev

# البناء لنظام Windows
npm run build:win
```

سيتم إنشاء ملف `.exe` في مجلد `dist/`.

## الملاحظات

1. التطبيق مصمم خصيصاً لنظام Windows كما هو مطلوب
2. جميع النصوص والرسائل بالعربية
3. تخطيط RTL مطبق في كل مكان
4. استخدام ExcelJS في العملية الرئيسية لتجنب مشاكل الأداء
5. الكود نظيف ومكتوب بـ TypeScript مع أنواع صارمة
