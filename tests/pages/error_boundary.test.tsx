import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../../inertia/components/ErrorBoundary.js'

// Mock the frontend error reporter
jest.mock('../../inertia/services/errorReporter.js', () => ({
  frontendErrorReporter: {
    captureException: jest.fn(),
    init: jest.fn()
  }
}))

// Component that throws an error
function BoomComponent(): React.ReactElement {
  throw new Error('Test error')
}

// Component that throws a network error
function NetworkErrorComponent(): React.ReactElement {
  throw new Error('Network Error: Failed to fetch')
}

// Component that throws a chunk load error
function ChunkErrorComponent(): React.ReactElement {
  throw new Error('ChunkLoadError: Loading chunk failed')
}

// Working component
function WorkingComponent() {
  return <div>Working component</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })

  it('renders fallback UI when child throws an error', () => {
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
  })

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('shows retry button and allows retry', () => {
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    
    // After retry, the error boundary should reset
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('shows reload button for transient errors', () => {
    render(
      <ErrorBoundary>
        <NetworkErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
    expect(screen.getByText(/This might be a temporary issue/)).toBeInTheDocument()
  })

  it('shows go back button', () => {
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    const goBackButton = screen.getByText('Go Back')
    expect(goBackButton).toBeInTheDocument()
    
    // Mock window.history.back
    const mockBack = jest.fn()
    Object.defineProperty(window, 'history', {
      value: { back: mockBack },
      writable: true
    })
    
    fireEvent.click(goBackButton)
    expect(mockBack).toHaveBeenCalled()
  })

  it('displays error ID', () => {
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
  })

  it('uses custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('calls onError callback when provided', () => {
    const onError = jest.fn()
    
    render(
      <ErrorBoundary onError={onError}>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('resets error boundary when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Change resetKeys
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <WorkingComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })

  it('resets error boundary when resetOnPropsChange is true', () => {
    const { rerender } = render(
      <ErrorBoundary resetOnPropsChange={true}>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Change any prop
    rerender(
      <ErrorBoundary resetOnPropsChange={true}>
        <WorkingComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Working component')).toBeInTheDocument()
  })

  it('tracks retry count', () => {
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByText('Try Again')
    
    // First retry
    fireEvent.click(retryButton)
    
    // Trigger error again
    render(
      <ErrorBoundary>
        <BoomComponent />
      </ErrorBoundary>
    )
    
    fireEvent.click(screen.getByText('Try Again'))
    
    // Should show retry count
    expect(screen.getByText(/Retry attempt: 1/)).toBeInTheDocument()
  })

  it('handles different error types correctly', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <NetworkErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
    
    rerender(
      <ErrorBoundary>
        <ChunkErrorComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })
})


