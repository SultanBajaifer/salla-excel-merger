import ExcelJS from 'exceljs'
import type { CellValue } from '../store/useAppStore'

export class ExcelService {
  /**
   * Read an Excel file and return its data as a 2D array
   * @param filePath - Path to the Excel file
   * @returns Promise with 2D array of data
   */
  async readExcelFile(filePath: string): Promise<CellValue[][]> {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filePath)

      const worksheet = workbook.worksheets[0]
      const data: CellValue[][] = []

      worksheet.eachRow((row) => {
        const rowData: CellValue[] = []
        row.eachCell((cell) => {
          const value = cell.value
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null
          ) {
            rowData.push(value)
          } else {
            rowData.push(String(value))
          }
        })
        data.push(rowData)
      })

      return data
    } catch (error) {
      console.error('Error reading Excel file:', error)
      throw error
    }
  }

  /**
   * Save merged data to an Excel file
   * @param filePath - Path where the file should be saved
   * @param data - 2D array of data to save
   */
  async saveExcelFile(filePath: string, data: CellValue[][]): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Merged Data')

      // Add data to worksheet
      data.forEach((row) => {
        worksheet.addRow(row)
      })

      // Auto-size columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 10
          if (cellLength > maxLength) {
            maxLength = cellLength
          }
        })
        column.width = maxLength < 10 ? 10 : maxLength + 2
      })

      // Save the file
      await workbook.xlsx.writeFile(filePath)
      console.log('File saved successfully:', filePath)
    } catch (error) {
      console.error('Error saving Excel file:', error)
      throw error
    }
  }

  /**
   * Merge two Excel files based on column mappings
   * This is a placeholder for future implementation
   */
  async mergeFiles(
    mainFilePath: string,
    newFilePath: string,
    columnMappings: Record<string, string>[]
  ): Promise<CellValue[][]> {
    // Placeholder implementation - returns mock merged data
    console.log('Merging files:', { mainFilePath, newFilePath, columnMappings })

    return [
      ['ID', 'Name', 'Price', 'Stock', 'Brand'],
      ['1', 'Product A', '100', '50', 'N/A'],
      ['2', 'Product B', '200', '30', 'N/A'],
      ['3', 'Product C', '150', '20', 'N/A'],
      ['4', 'Product D', '300', '10', 'N/A'],
      ['5', 'Product E', '120', '25', 'BrandX']
    ]
  }
}

export const excelService = new ExcelService()
