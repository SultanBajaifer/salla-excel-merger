import React from 'react'

interface ManualFieldsFormProps {
  fields: string[]
  values: Record<string, string>
  onChange: (field: string, value: string) => void
}

const ManualFieldsForm: React.FC<ManualFieldsFormProps> = ({ fields, values, onChange }) => {
  if (fields.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Manual Default Values</h3>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-600 mb-2">{field}</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter default value for ${field}`}
              value={values[field] || ''}
              onChange={(e) => onChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ManualFieldsForm
