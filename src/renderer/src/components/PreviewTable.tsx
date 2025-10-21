import React from 'react'
import type { CellValue } from '../store/useAppStore'

interface PreviewTableProps {
  data: CellValue[][]
  title: string
  maxRows?: number
}

const PreviewTable: React.FC<PreviewTableProps> = ({ data, title, maxRows = 5 }) => {
  const displayData = data.slice(0, maxRows + 1) // +1 for header

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
        <p className="text-gray-500">لم يتم تحميل أي بيانات بعد</p>
      </div>
    )
  }

  const headers = displayData[0]
  const rows = displayData.slice(1)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header: CellValue, idx: number) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {String(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row: CellValue[], rowIdx: number) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {row.map((cell: CellValue, cellIdx: number) => (
                  <td key={cellIdx} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > maxRows + 1 && (
        <p className="text-sm text-gray-500 mt-2">
          عرض أول {maxRows} صفوف من إجمالي {data.length - 1} صف
        </p>
      )}
    </div>
  )
}

export default PreviewTable
