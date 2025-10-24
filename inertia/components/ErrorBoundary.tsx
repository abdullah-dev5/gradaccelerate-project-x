import React from 'react'
import { frontendErrorReporter } from '../services/errorReporter'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
}

type State = { 
  hasError: boolean
  error: Error | null
  errorId: string | null
  retryCount: number
}

export class ErrorBoundary extends React.Component<Props, State> {
  private resetTimeoutId: number | null = null

  state: State = { 
    hasError: false, 
    error: null, 
    errorId: null,
    retryCount: 0
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report error to monitoring service
    await frontendErrorReporter.captureException(error, { 
      extras: { 
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount
      },
      tags: {
        type: 'react-error-boundary',
        errorId: this.state.errorId || 'unknown'
      }
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Auto-retry after 5 seconds for transient errors
    if (this.isTransientError(error) && this.state.retryCount < 3) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.handleRetry()
      }, 5000)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && resetKeys.length > 0) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          key !== prevProps.resetKeys?.[index]
        )
        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      }
    }

    if (hasError && resetOnPropsChange) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private isTransientError(error: Error): boolean {
    const transientPatterns = [
      'Network Error',
      'Failed to fetch',
      'Connection refused',
      'Timeout',
      'ECONNRESET',
      'ENOTFOUND'
    ]
    
    return transientPatterns.some(pattern => 
      error.message.includes(pattern)
    )
  }

  private resetErrorBoundary = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorId: null,
      retryCount: 0
    })
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI with retry options
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg 
                className="w-6 h-6 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. 
                {this.isTransientError(this.state.error!) && ' This might be a temporary issue.'}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.resetErrorBoundary}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                
                {this.isTransientError(this.state.error!) && (
                  <button
                    onClick={this.handleReload}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Reload Page
                  </button>
                )}
                
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Go Back
                </button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}

              <p className="mt-6 text-xs text-gray-400">
                Error ID: {this.state.errorId}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary


