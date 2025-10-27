# CI/CD Pipeline - Quick Reference

## 🎯 Trigger Conditions

| Branch Type | Lint | Type Check | Tests | E2E | Build | Deploy |
|------------|------|-----------|-------|-----|-------|--------|
| `feature/*` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `release/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `staging` | ✅ | ✅ | ✅ | ✅ | ✅ | 🌐 Staging |
| `main` | ✅ | ✅ | ✅ | ✅ | ✅ | 🚀 Production |

## ⚡ Quick Commands

```bash
# Before pushing, run these locally:
npm run lint          # Check for linting issues
npm run fix           # Auto-fix linting issues
npm run typecheck     # Check TypeScript types
npm test              # Run all tests
npm run build         # Test build process

# For E2E testing:
npm run dev           # Start dev server
npm run test:e2e      # Run Cypress tests
```

## 📝 Job Details

### 1. Lint (2-3 min)
- Validates code style with ESLint
- Fails on warnings
- Auto-fixable with `npm run fix`

### 2. Type Check (1-2 min)
- Validates TypeScript compilation
- No runtime impact

### 3. Frontend Tests (3-5 min)
- Jest + React Testing Library
- Coverage: 50% minimum
- Reports to Codecov

### 4. Backend Tests (2-4 min)
- AdonisJS Japa test runner
- SQLite test database
- API and model tests

### 5. Build (3-5 min)
- Compiles TypeScript
- Bundles frontend assets
- Creates production artifacts

### 6. E2E Tests (5-10 min, conditional)
- Cypress headless tests
- Only on release/* and main
- Validates full user flows

### 7-8. Deploy (3-5 min)
- Automatic to Vercel
- Staging: `staging` branch
- Production: `main` branch

## 🔧 Configuration

### Secrets Required (GitHub Settings)
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Coverage Threshold
```
Branches: 50%
Functions: 50%
Lines: 50%
Statements: 50%
```

## 📊 Pipeline Status Badge

Add to your README.md:
```markdown
![CI/CD Pipeline](https://github.com/your-username/your-repo/actions/workflows/ci.yml/badge.svg)
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Lint fails | `npm run fix` |
| Tests fail | Check test output |
| Build fails | `npm run typecheck` |
| E2E fails | Start server first |
| Deploy fails | Check Vercel secrets |

## 📈 Metrics

Average runtime:
- Feature branch: **5-8 minutes**
- Release branch: **10-15 minutes**
- Main branch (with deploy): **10-15 minutes**

## 🔗 Links

- **Workflow File**: `.github/workflows/ci.yml`
- **Documentation**: `.github/CICD_README.md`
- **Setup Guide**: `CICD_SETUP_GUIDE.md`
- **GitHub Actions**: `https://github.com/your-repo/actions`

