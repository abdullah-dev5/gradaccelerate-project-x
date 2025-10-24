import React from 'react'

// Component that throws an error to test error boundary
export const ErrorTestComponent: React.FC = () => {
  const [shouldError, setShouldError] = React.useState(false)

  if (shouldError) {
    throw new Error('Test error for Day 15 demo - Error Boundary Test')
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Error Boundary Test Component
      </h3>
      <p className="text-red-600 mb-4">
        Click the button below to trigger an error and test the error boundary.
      </p>
      <button
        onClick={() => setShouldError(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Trigger Error
      </button>
    </div>
  )
}

export default ErrorTestComponent
