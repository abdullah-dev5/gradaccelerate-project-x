---
title: Technical Specifications
date: 2025-09-23
---

## Stack
- AdonisJS 6, Lucid 21, Auth 9, Inertia 3
- React 19 + TypeScript 5.7, Vite 6
- SQLite (dev), Pusher, Nodemailer/Sendgrid

## Coding Standards
- TypeScript strict for frontend/backend
- Controllers thin, Services hold domain logic, Validators for input
- Prefer dependency injection patterns via IoC where applicable
- Avoid breaking changes; small, focused edits

## Database
- Migrations in `database/migrations`
- Core tables: users, notes, todos, projects, reminders
- Use DateTime (Luxon) for timestamps; store ISO with timezone

## Runtime & Env
- `.env` for PUSHER_*, SMTP_*, SCHEDULER_ENABLED
- Scheduler in `start/scheduler.ts` runs every minute when enabled
- Error reporting (optional):
  - Backend: `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE` (0..1, default 0)
  - Frontend: `VITE_SENTRY_DSN`, `VITE_SENTRY_TRACES_SAMPLE_RATE` (0..1, default 0)

## Error Handling & Monitoring
- **Global Exception Handler**: Comprehensive error handling in `app/exceptions/handler.ts`
- **Error Reporter Service**: Enhanced Sentry integration with performance monitoring
- **Frontend Error Boundaries**: React error boundaries with retry mechanisms and user-friendly fallbacks
- **Error Categorization**: Automatic error classification by type and severity
- **Performance Monitoring**: API response times, database queries, and user interactions
- **Security**: Automatic sanitization of sensitive data in error reports
- **User Context**: Rich error context including user information and request details

### Example .env entries
```
NODE_ENV=development

# Sentry (backend)
SENTRY_DSN=https://<key>@sentry.io/<project>
SENTRY_TRACES_SAMPLE_RATE=0

# Sentry (frontend)
VITE_SENTRY_DSN=https://<key>@sentry.io/<project>
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

## Testing
- Frontend Jest + RTL with comprehensive component and API testing
- Backend Japa tests via ace with full API endpoint coverage
- **End-to-End (E2E) testing with Cypress** for complete user journey validation
- Error handling tests for both frontend and backend
- Mocking strategies for external services and database operations
- Commands: `npm run test:frontend`, `npm run test:backend`, `npm run test:e2e`, or `npm run test:all-with-e2e`

### Test Coverage
- **Frontend Tests**: Component rendering, user interactions, error boundaries, API mocking
- **Backend Tests**: API endpoints, validation, authentication, database operations, error handling
- **E2E Tests**: Complete user workflows, cross-browser compatibility, responsive design, API integration
- **Error Handling Tests**: Error boundary recovery, error reporting, validation error handling
- **Integration Tests**: End-to-end API workflows, authentication flows, file uploads

### E2E Testing with Cypress
- **Comprehensive Test Suite**: Authentication, CRUD operations for all modules (Notes, Todos, Projects, Bookmarks)
- **API Integration Testing**: Direct API endpoint testing with proper error handling
- **Cross-Browser Compatibility**: Tests across different viewport sizes and user agents
- **Performance Testing**: Page load time validation and timeout handling
- **Error Scenario Testing**: Network failures, server errors, validation errors
- **Custom Commands**: Reusable commands for login, registration, and data creation
- **Test Fixtures**: Mock data for consistent testing scenarios

### Testing Best Practices
- Mock external dependencies (APIs, databases, file systems)
- Test error scenarios and edge cases
- Verify error reporting and user feedback
- Test accessibility and responsive design
- Use realistic test data and scenarios
- **E2E Testing**: Simulate real user interactions and validate complete workflows
- **API Testing**: Test both success and failure scenarios for all endpoints
- **Cross-Platform Testing**: Ensure compatibility across different devices and browsers


