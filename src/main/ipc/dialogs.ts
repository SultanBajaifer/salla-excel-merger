import { dialog } from 'electron'
import { handleProtected } from './access'

export function registerDialogHandlers(): void {
  handleProtected('select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'ملفات Excel', extensions: ['xlsx', 'xls'] },
        { name: 'جميع الملفات', extensions: ['*'] }
      ]
    })

    if (result.canceled) {
      return null
    }

    return result.filePaths[0]
  })

  handleProtected('save-file', async (_, defaultPath: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'ملفات Excel', extensions: ['xlsx'] }]
    })

    if (result.canceled) {
      return null
    }

    return result.filePath
  })
}
