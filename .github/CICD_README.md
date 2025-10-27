# CI/CD Pipeline Documentation

## Overview

This project uses **GitHub Actions** to automate the Continuous Integration and Continuous Deployment (CI/CD) pipeline. The pipeline ensures code quality, runs tests, builds the application, and deploys it automatically based on branch strategies.

## Pipeline Workflow

### Triggers

The pipeline is triggered on:
- **Push** events to: `main`, `develop`, `staging`, `release/*`, `feature/*` branches
- **Pull Request** events targeting: `main`, `develop`, `staging`, `release/*` branches

### Jobs

#### 1. **Lint Code** 🔍
- **Runtime**: ~2-3 minutes
- **Purpose**: Validates code style and catches potential errors
- **Tools**: ESLint
- **Command**: `npm run lint`
- **Max Warnings**: 0 (fails on any warning)

#### 2. **Type Check** 🎯
- **Runtime**: ~1-2 minutes
- **Purpose**: Ensures TypeScript code is type-safe
- **Command**: `npm run typecheck`

#### 3. **Frontend Tests** 🧪
- **Runtime**: ~3-5 minutes
- **Purpose**: Runs unit tests for frontend components
- **Framework**: Jest
- **Coverage**: Collects and reports code coverage
- **Threshold**: 50% minimum for branches, functions, lines, and statements
- **Command**: `npm run test:frontend`

#### 4. **Backend Tests** 🔧
- **Runtime**: ~2-4 minutes
- **Purpose**: Runs unit and integration tests for backend
- **Framework**: AdonisJS Test Runner (Japa)
- **Database**: Uses SQLite for testing
- **Command**: `npm run test:backend`

#### 5. **Build Application** 🏗️
- **Runtime**: ~3-5 minutes
- **Dependencies**: All previous jobs must pass
- **Purpose**: Compiles and builds the application for production
- **Command**: `npm run build`
- **Output**: Artifacts stored in GitHub Actions

#### 6. **E2E Tests** (Conditional) 🔎
- **Runtime**: ~5-10 minutes
- **Condition**: Only runs on `release/*` branches and `main` branch
- **Purpose**: End-to-end testing with Cypress
- **Framework**: Cypress
- **Command**: `npm run test:e2e:headless`
- **Browser**: Headless Chrome

#### 7. **Deploy to Staging** 🌐
- **Runtime**: ~3-5 minutes
- **Condition**: Only on push to `staging` branch
- **Target**: Staging environment
- **Secrets Required**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- **Deployment**: Vercel

#### 8. **Deploy to Production** 🚀
- **Runtime**: ~3-5 minutes
- **Condition**: Only on push to `main` branch
- **Target**: Production environment
- **Requires**: Successful E2E tests
- **Secrets Required**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- **Deployment**: Vercel

## Branch Strategy

### Feature Branches (`feature/*`)
- ✅ Linting
- ✅ Type checking
- ✅ Frontend tests
- ✅ Backend tests
- ✅ Build
- ❌ E2E tests (skipped)
- ❌ Deployment (skipped)

### Release Branches (`release/*`)
- ✅ All feature branch checks
- ✅ E2E tests (required)
- ⚠️ Manual deployment (optional)

### Main Branch
- ✅ All checks
- ✅ E2E tests
- ✅ Automatic production deployment

### Staging Branch
- ✅ All checks
- ✅ Automatic staging deployment

## Code Coverage

The pipeline enforces minimum coverage thresholds:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

Coverage reports are generated and uploaded to Codecov for tracking.

## Local Testing

Before pushing code, run these commands locally:

```bash
# Run linting
npm run lint

# Fix linting issues
npm run fix

# Run type checking
npm run typecheck

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run all tests
npm test

# Run E2E tests (requires app to be running)
npm run test:e2e

# Build the application
npm run build
```

## Environment Variables

The following secrets need to be configured in GitHub repository settings:

### For Vercel Deployment:
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### How to Set Up Secrets:
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret name and value

## Troubleshooting

### Pipeline Fails on Linting
```bash
# Run locally to see issues
npm run lint

# Auto-fix issues
npm run fix
```

### Pipeline Fails on Tests
```bash
# Run tests locally
npm test

# Check specific test suites
npm run test:frontend
npm run test:backend
```

### Pipeline Fails on Build
```bash
# Test build locally
npm run build

# Check for build errors
npm run typecheck
```

### Pipeline Fails on E2E Tests
```bash
# Run E2E tests locally
npm run test:e2e

# Check Cypress configuration
npx cypress verify
```

## Parallel Execution

Jobs run in parallel when possible:
- Lint, Type Check, Frontend Tests, and Backend Tests run simultaneously
- Build waits for all checks to pass
- E2E Tests wait for build to complete
- Deployments wait for all tests to pass

## Caching

The pipeline uses npm caching to speed up builds:
- Node modules are cached based on `package-lock.json`
- This reduces installation time from ~2 minutes to ~30 seconds

## Notifications

Failed builds automatically trigger notifications via:
- GitHub commit status
- GitHub pull request comments

## Best Practices

1. **Run tests locally** before pushing code
2. **Fix linting issues** before committing
3. **Keep coverage above 50%** threshold
4. **Don't skip CI** - it's there for quality assurance
5. **Review pipeline logs** when build fails
6. **Use feature branches** for all development work
7. **Only push to main** when ready for production

## Performance

Typical pipeline runtimes:
- **Feature branch**: ~5-8 minutes
- **Release branch**: ~10-15 minutes
- **Main branch**: ~10-15 minutes (includes deployment)

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ESLint Configuration](https://eslint.org/docs/latest/)
- [Jest Testing Framework](https://jestjs.io/)
- [Cypress E2E Testing](https://docs.cypress.io/)
- [Vercel Deployment](https://vercel.com/docs)

