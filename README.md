# Salla Excel Merger

A professional desktop application for merging Excel files, built with Electron, React, and TypeScript.

## 🚀 Features

- **Electron + React + TypeScript** - Modern tech stack
- **TailwindCSS** - Beautiful, responsive UI
- **Zustand** - Lightweight state management
- **ExcelJS** - Excel file processing
- **File Selection** - Easy file picking interface
- **Column Mapping** - Flexible column mapping between files
- **Preview** - See merged data before saving
- **Export** - Save merged files in Excel format

## 📦 Tech Stack

- **Electron 38** - Desktop application framework
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Vite 7** - Fast build tool
- **TailwindCSS 4** - Utility-first CSS
- **Zustand 5** - State management
- **ExcelJS 4** - Excel file handling

## 🛠️ Project Setup

### Prerequisites

- Node.js 18+ and npm

### Install Dependencies

```bash
npm install
```

### Development

Run the app in development mode with hot reload:

```bash
npm run dev
```

### Build

Build the application for production:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

### Other Commands

```bash
# Type check
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format
```

## 📁 Project Structure

```
salla-excel-merger/
├── src/
│   ├── main/                    # Electron main process
│   │   └── index.ts
│   ├── preload/                 # Electron preload scripts
│   │   └── index.ts
│   └── renderer/                # React application
│       ├── index.html
│       └── src/
│           ├── App.tsx          # Main application component
│           ├── main.tsx         # React entry point
│           ├── index.css        # Global styles with TailwindCSS
│           ├── components/      # React components
│           │   ├── FileSelector.tsx
│           │   ├── ColumnMapper.tsx
│           │   ├── ManualFieldsForm.tsx
│           │   ├── PreviewTable.tsx
│           │   └── SaveButton.tsx
│           ├── services/        # Business logic
│           │   └── excelService.ts
│           └── store/           # State management
│               └── useAppStore.ts
├── electron.vite.config.ts      # Vite configuration
├── electron-builder.yml         # Electron builder configuration
└── package.json
```

## 🎯 Current Status

✅ **Project Structure** - Fully set up and organized
✅ **UI Components** - All placeholder components created
✅ **State Management** - Zustand store configured
✅ **Excel Service** - Basic service structure in place
✅ **TailwindCSS** - Fully configured and working
✅ **Development Environment** - Ready for development

🚧 **Next Steps**:

- Implement actual file selection using Electron dialogs
- Add Excel file parsing logic
- Implement column mapping algorithm
- Add data validation
- Implement merge logic
- Add error handling and user feedback

## 🖼️ Views

### Main View

- Select main Excel file
- Select new products Excel file
- Preview both files (first 5 rows)
- Navigate to column mapper

### Column Mapper View

- Map columns from new products to main file
- Set manual default values for unmapped columns
- Preview merge button

### Preview View

- Display merged data preview
- Save merged file to disk

## 📝 License

This project is private and proprietary.

## 👨‍💻 Development

This is a professional desktop application built for Windows. The codebase follows best practices with TypeScript strict mode, modular component architecture, and clear separation of concerns.

### Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)
- [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [TailwindCSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
