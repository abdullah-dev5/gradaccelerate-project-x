import React from 'react'
import { useToast } from '../hooks/useToast'

export default function TestToast() {
  const { showToast } = useToast()

  const handleSuccessToast = () => {
    showToast('Success!', 'success', 'This is a success message')
  }

  const handleErrorToast = () => {
    showToast('Error!', 'error', 'This is an error message')
  }

  const handleWarningToast = () => {
    showToast('Warning!', 'warning', 'This is a warning message')
  }

  const handleInfoToast = () => {
    showToast('Info!', 'info', 'This is an info message')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Toast Test Page
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={handleSuccessToast}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Success Toast
          </button>
          
          <button
            onClick={handleErrorToast}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Error Toast
          </button>
          
          <button
            onClick={handleWarningToast}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Warning Toast
          </button>
          
          <button
            onClick={handleInfoToast}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Info Toast
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Click any button to test the toast notifications</p>
          <p>Toasts will appear in the top-right corner</p>
        </div>
      </div>
    </div>
  )
}
