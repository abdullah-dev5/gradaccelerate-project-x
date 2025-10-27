# GradAccelerate Project X

A full-stack productivity application built with AdonisJS and Inertia.js (React).

## 🚀 Features

- **Authentication**: Secure login and registration with OAuth support
- **Todos**: Manage tasks with labels and priorities
- **Projects**: Organize work by projects
- **Notes**: Rich markdown note-taking
- **Bookmarks**: Save and organize web links
- **Reminders**: Scheduled reminders and notifications
- **Weather**: Real-time weather information
- **AI Integration**: Gemini AI for smart assistance

## 🛠️ Tech Stack

### Backend
- **AdonisJS 6**: Node.js MVC framework
- **SQLite**: Database
- **TypeScript**: Type-safe development
- **Japa**: Testing framework
- **Vite**: Asset bundling

### Frontend
- **React 19**: UI library
- **TypeScript**: Type safety
- **Inertia.js**: SPA framework
- **Tailwind CSS**: Styling
- **Radix UI**: Component library
- **Framer Motion**: Animations

### Testing
- **Jest**: Frontend unit tests
- **Cypress**: E2E testing
- **Japa**: Backend tests

### DevOps
- **GitHub Actions**: CI/CD pipeline
- **ESLint**: Code linting
- **Prettier**: Code formatting

## 📦 Project Structure

```
├── app/
│   ├── controllers/      # API controllers
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── middleware/      # HTTP middleware
│   └── validators/      # Request validation
├── inertia/            # Frontend (React)
│   ├── app/            # App entry points
│   ├── components/     # React components
│   ├── pages/          # Page components
│   └── stores/         # State management
├── database/           # Migrations & seeders
├── config/             # Configuration files
├── tests/              # Test files
└── cypress/           # E2E tests
```

## 🚦 CI/CD Pipeline

[![CI/CD Pipeline](https://github.com/your-username/your-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/your-repo/actions)

This project has an automated CI/CD pipeline that runs on every push and pull request:

- ✅ **Linting**: ESLint code quality checks
- ✅ **Type Checking**: TypeScript type validation
- ✅ **Unit Tests**: Frontend (Jest) and Backend (Japa) tests
- ✅ **E2E Tests**: Cypress end-to-end tests (release branches only)
- ✅ **Build**: Production build verification
- ✅ **Deploy**: Automatic deployment to staging/production

### Branch Strategy

- **feature/***: Lint, type check, unit tests, build
- **release/***: All checks + E2E tests
- **staging**: All checks + auto-deploy to staging
- **main**: All checks + auto-deploy to production

For detailed documentation, see [CI/CD README](.github/CICD_README.md).

## 🏃 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gradaccelerate-project-x.git
   cd gradaccelerate-project-x
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run migrations**
   ```bash
   node ace migration:run
   ```

5. **Seed database (optional)**
   ```bash
   node ace db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3333` in your browser.

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:frontend  # Frontend unit tests
npm run test:backend  # Backend tests
npm run test:e2e      # E2E tests (requires server)
```

### Run with Coverage
```bash
npm run test:coverage
```

## 🔨 Development Commands

```bash
# Development
npm run dev           # Start dev server with HMR
npm start            # Start production server
npm run build        # Build for production

# Code Quality
npm run lint         # Check for linting issues
npm run fix          # Auto-fix linting issues
npm run typecheck    # TypeScript type checking

# Testing
npm test             # Run all tests
npm run test:e2e     # Run E2E tests
npm run test:e2e:open  # Open Cypress UI
```

## 📚 Documentation

- [CI/CD Setup Guide](CICD_SETUP_GUIDE.md) - Complete setup instructions
- [CI/CD Pipeline Documentation](.github/CICD_README.md) - Pipeline details
- [Bookmark Module Readme](BOOKMARK_MODULE_README.md) - Bookmark feature docs
- [E2E Testing Guide](E2E_TESTING_README.md) - E2E testing instructions
- [Reminder Setup Guide](REMINDER_NOTIFICATION_SETUP.md) - Reminders configuration
- [Error Tracking Guide](ERROR_TRACKING_GUIDE.md) - Error monitoring

## 🔐 Environment Variables

Required environment variables:

```env
# App
APP_KEY=
APP_URL=http://localhost:3333

# Database
DB_DATABASE=database/app.sqlite

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gemini AI
GEMINI_API_KEY=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# Other services...
```

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

This project is private and unlicensed.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- AdonisJS team for the amazing framework
- Inertia.js for seamless SPA experience
- All contributors and open-source maintainers

---

**Note**: Update the badge URL in this README with your actual GitHub repository path.

