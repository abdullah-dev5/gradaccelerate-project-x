# Error Tracking and Monitoring Setup Guide

## Overview

This guide explains how to set up and configure error tracking and monitoring for the GradAccelerate project using Sentry. The implementation includes both backend (AdonisJS) and frontend (React) error tracking with comprehensive error categorization, performance monitoring, and user context.

## Table of Contents

1. [Sentry Setup](#sentry-setup)
2. [Backend Error Tracking](#backend-error-tracking)
3. [Frontend Error Tracking](#frontend-error-tracking)
4. [Error Categories and Severity](#error-categories-and-severity)
5. [Performance Monitoring](#performance-monitoring)
6. [Testing Error Handling](#testing-error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Sentry Setup

### 1. Create Sentry Project

1. Go to [Sentry.io](https://sentry.io) and create an account
2. Create a new project:
   - **Platform**: Node.js (for backend)
   - **Platform**: React (for frontend)
3. Note down your DSN (Data Source Name) for each project

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Backend Sentry Configuration
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENV=development  # or production, staging
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling rate

# Frontend Sentry Configuration
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling rate
```

### 3. Production Configuration

For production environments, adjust the sample rates:

```bash
# Production settings
SENTRY_TRACES_SAMPLE_RATE=0.05  # 5% sampling rate
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05  # 5% sampling rate
```

## Backend Error Tracking

### Implementation Overview

The backend error tracking is implemented in several layers:

1. **Global Exception Handler** (`app/exceptions/handler.ts`)
2. **Error Reporter Service** (`app/services/error_reporter.ts`)
3. **Controller Error Handling**
4. **Database Error Handling**

### Key Features

- **Automatic Error Capture**: All unhandled exceptions are automatically captured
- **Request Context**: Includes user information, request details, and headers
- **Error Categorization**: Errors are categorized by type and severity
- **Performance Monitoring**: Tracks API response times and database queries
- **Security**: Sensitive data is automatically redacted

### Error Types Handled

```typescript
// Validation Errors
if (error instanceof ValidationException) {
  return ctx.response.status(422).json({
    message: 'Validation failed',
    errors: error.messages,
    code: 'VALIDATION_ERROR'
  })
}

// HTTP Exceptions
if (error instanceof HttpException) {
  const statusCode = error.status
  const message = error.message || this.getDefaultMessage(statusCode)
  // ... handle with proper error codes
}

// Database Errors
if (this.isDatabaseError(error)) {
  const dbError = this.formatDatabaseError(error)
  // ... handle with user-friendly messages
}
```

### Usage Examples

#### Manual Error Reporting

```typescript
import { errorReporter } from '#services/error_reporter'

// Report an exception
await errorReporter.captureException(error, {
  user: { id: user.id, email: user.email },
  tags: { component: 'payment-service' },
  extras: { orderId: '12345' }
})

// Report a message
await errorReporter.captureMessage('Payment processed successfully', 'info', {
  tags: { type: 'business-logic' },
  extras: { amount: 100, currency: 'USD' }
})

// Performance monitoring
const transaction = await errorReporter.startTransaction('payment-process', 'payment')
// ... perform operation
await errorReporter.finishTransaction(transaction, 'ok')
```

#### Wrapping Functions

```typescript
// Wrap async functions
const result = await errorReporter.wrapAsync(async () => {
  return await riskyOperation()
}, 'payment-processing')

// Wrap sync functions
const result = errorReporter.wrapSync(() => {
  return riskySyncOperation()
}, 'data-validation')
```

## Frontend Error Tracking

### Implementation Overview

The frontend error tracking includes:

1. **Error Boundary Component** (`inertia/components/ErrorBoundary.tsx`)
2. **Frontend Error Reporter** (`inertia/services/errorReporter.ts`)
3. **API Error Handling**
4. **User Action Tracking**

### Key Features

- **React Error Boundaries**: Catches JavaScript errors in component tree
- **Automatic Retry**: Transient errors are automatically retried
- **User-Friendly Fallbacks**: Graceful error UI with recovery options
- **Performance Monitoring**: Tracks page load times and API calls
- **Session Replay**: Records user sessions for debugging

### Error Boundary Features

```typescript
// Automatic retry for transient errors
if (this.isTransientError(error) && this.state.retryCount < 3) {
  this.resetTimeoutId = window.setTimeout(() => {
    this.handleRetry()
  }, 5000)
}

// Custom fallback UI
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>

// Reset on prop changes
<ErrorBoundary resetKeys={[userId]} resetOnPropsChange={true}>
  <UserProfile userId={userId} />
</ErrorBoundary>
```

### Usage Examples

#### Manual Error Reporting

```typescript
import { frontendErrorReporter } from '../services/errorReporter'

// Report an exception
await frontendErrorReporter.captureException(error, {
  tags: { component: 'PaymentForm' },
  extras: { formData: formData }
})

// Track user actions
await frontendErrorReporter.recordUserAction('button-click', {
  buttonId: 'submit-payment',
  formStep: 'billing'
})

// Track API calls
await frontendErrorReporter.recordApiCall('/api/payments', 'POST', 200, 1500)
```

#### Performance Monitoring

```typescript
// Start performance tracking
const transaction = await frontendErrorReporter.startTransaction('page-load', 'navigation')
// ... page loads
await frontendErrorReporter.finishTransaction(transaction, 'ok')

// Record custom performance metrics
await frontendErrorReporter.recordPerformance('data-processing', 250, {
  recordCount: 1000,
  memoryUsage: '50MB'
})
```

## Error Categories and Severity

### Error Severity Levels

1. **Error**: Critical issues that break functionality
   - Database connection failures
   - Authentication errors
   - Payment processing failures

2. **Warning**: Issues that don't break functionality but should be addressed
   - Validation errors
   - Rate limiting
   - Deprecated API usage

3. **Info**: Informational messages
   - User actions
   - Performance metrics
   - Business logic events

### Error Categories

```typescript
// Backend categories
const backendCategories = {
  'http': 'HTTP request/response errors',
  'database': 'Database operation errors',
  'validation': 'Input validation errors',
  'authentication': 'Auth-related errors',
  'payment': 'Payment processing errors',
  'email': 'Email service errors',
  'file-upload': 'File upload errors'
}

// Frontend categories
const frontendCategories = {
  'react-error-boundary': 'React component errors',
  'api-call': 'API request errors',
  'user-action': 'User interaction tracking',
  'performance': 'Performance metrics',
  'network-error': 'Network connectivity issues',
  'chunk-load-error': 'Code splitting errors'
}
```

## Performance Monitoring

### Backend Performance Tracking

```typescript
// API endpoint performance
const transaction = await errorReporter.startTransaction('GET /api/notes', 'http.server')
// ... handle request
await errorReporter.finishTransaction(transaction, 'ok')

// Database query performance
await errorReporter.recordPerformance('database-query', 150, {
  query: 'SELECT * FROM notes',
  recordCount: 100
})

// External API calls
await errorReporter.recordPerformance('external-api', 2000, {
  endpoint: 'https://api.payment-provider.com',
  status: 200
})
```

### Frontend Performance Tracking

```typescript
// Page load performance
const transaction = await frontendErrorReporter.startTransaction('Notes Page', 'navigation')
// ... page loads
await frontendErrorReporter.finishTransaction(transaction, 'ok')

// Component render performance
await frontendErrorReporter.recordPerformance('component-render', 50, {
  component: 'NotesList',
  itemCount: 25
})

// API call performance
await frontendErrorReporter.recordApiCall('/api/notes', 'GET', 200, 300)
```

## Testing Error Handling

### Backend Testing

```typescript
// Test error reporting
test('should report database errors', async ({ client, assert }) => {
  // Mock database error
  const originalCreate = Note.create
  Note.create = jest.fn().mockRejectedValue(new Error('Database connection failed'))

  const response = await client.post('/api/v1/notes').json({ title: 'Test' })
  
  response.assertStatus(500)
  expect(errorReporter.captureException).toHaveBeenCalled()

  Note.create = originalCreate
})

// Test error categorization
test('should categorize validation errors as warnings', async ({ client }) => {
  const response = await client.post('/api/v1/notes').json({})
  
  response.assertStatus(422)
  // Verify error was reported with 'warning' severity
})
```

### Frontend Testing

```typescript
// Test error boundary
test('renders fallback UI when child throws', () => {
  render(
    <ErrorBoundary>
      <BoomComponent />
    </ErrorBoundary>
  )
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
})

// Test error recovery
test('allows retry after error', () => {
  render(
    <ErrorBoundary>
      <BoomComponent />
    </ErrorBoundary>
  )
  
  const retryButton = screen.getByText('Try Again')
  fireEvent.click(retryButton)
  
  expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
})
```

## Best Practices

### 1. Error Message Guidelines

- **User-Friendly**: Provide clear, actionable error messages
- **Non-Technical**: Avoid exposing internal implementation details
- **Contextual**: Include relevant context for debugging
- **Secure**: Never expose sensitive information

### 2. Error Reporting Guidelines

- **Don't Over-Report**: Avoid reporting the same error multiple times
- **Include Context**: Always include relevant user and request context
- **Use Tags**: Categorize errors with meaningful tags
- **Set Fingerprints**: Group similar errors together

### 3. Performance Monitoring Guidelines

- **Sample Appropriately**: Use appropriate sampling rates for production
- **Monitor Key Metrics**: Focus on critical performance indicators
- **Track Business Metrics**: Monitor user actions and business events
- **Set Alerts**: Configure alerts for critical performance thresholds

### 4. Security Considerations

- **Sanitize Data**: Automatically redact sensitive information
- **Filter Errors**: Don't report development-only errors in production
- **Rate Limiting**: Implement rate limiting for error reporting
- **Access Control**: Ensure only authorized users can access error data

## Troubleshooting

### Common Issues

#### 1. Errors Not Appearing in Sentry

**Symptoms**: Errors are not showing up in Sentry dashboard

**Solutions**:
- Check DSN configuration
- Verify network connectivity
- Check Sentry project settings
- Review error filtering logic

#### 2. Too Many Errors

**Symptoms**: Sentry is flooded with errors

**Solutions**:
- Implement error deduplication
- Add error filtering
- Adjust sampling rates
- Review error categorization

#### 3. Performance Impact

**Symptoms**: Error tracking is affecting application performance

**Solutions**:
- Reduce sampling rates
- Use async error reporting
- Implement error batching
- Optimize error context data

#### 4. Missing Context

**Symptoms**: Errors lack sufficient context for debugging

**Solutions**:
- Add more user context
- Include request details
- Add custom tags
- Implement breadcrumbs

### Debugging Commands

```bash
# Check Sentry configuration
npm run test:error-tracking

# Test error reporting
npm run test:error-handling

# Verify environment variables
echo $SENTRY_DSN
echo $VITE_SENTRY_DSN
```

### Monitoring Commands

```bash
# Run all tests
npm run test:all

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend

# Run error handling tests
npm run test:error-handling
```

## Conclusion

This error tracking and monitoring setup provides comprehensive coverage for both backend and frontend errors, with automatic error capture, performance monitoring, and user-friendly error handling. The implementation follows best practices for security, performance, and maintainability.

For additional support or questions, refer to the [Sentry Documentation](https://docs.sentry.io/) or contact the development team.
