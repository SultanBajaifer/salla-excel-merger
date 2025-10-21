import React from 'react'

interface SaveButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

const SaveButton: React.FC<SaveButtonProps> = ({
  onClick,
  disabled = false,
  label = 'Save Main File'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-colors ${
        disabled
          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {label}
    </button>
  )
}

export default SaveButton
