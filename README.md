# GradAccelerate Project

A modern full-stack productivity application built with AdonisJS, React, and Inertia.js. Manage your notes, projects, bookmarks, todos, and reminders all in one place with AI-powered features and real-time updates.

## 🚀 Features

### Core Features

- **📝 Notes Management**: Create, edit, and organize your notes with Markdown support and syntax highlighting
- **📁 Project Tracking**: Organize projects and associate notes, todos, and bookmarks with them
- **🔖 Bookmarks**: Save and manage bookmarks with automatic metadata extraction
  - AI-generated labels and summaries using Google Gemini
  - Automatic Open Graph data extraction
  - Favorite bookmarks
  - Archive and trash functionality
- **✅ Todo Management**: Create and track todos with status management
- **⏰ Reminders**: Set reminders for important tasks and deadlines
- **🏷️ Labels**: Organize content with custom labels and color coding
- **🔍 Advanced Search & Filter**: Search across all content with multiple filter options
- **👤 User Preferences**: Customize your experience with user-specific settings
- **🌤️ Weather Integration**: Weather information integration
- **👨‍💼 Admin Panel**: Administrative features for user and content management

### Technical Features

- **Real-time Updates**: Live notifications and updates using Pusher
- **User Authentication**: Secure authentication with Google OAuth
- **AI Integration**: Google Gemini AI for intelligent content analysis
- **Image Upload**: Cloudinary integration for image management
- **Beautiful UI**: Modern, responsive design with TailwindCSS and Radix UI components
- **Markdown Support**: Rich text editing with Markdown rendering
- **Syntax Highlighting**: Code syntax highlighting in notes

## 🛠️ Tech Stack

### Backend
- **Framework**: AdonisJS 6
- **Database**: SQLite (better-sqlite3)
- **ORM**: Lucid ORM
- **Authentication**: AdonisJS Auth with Google OAuth (Ally)
- **Validation**: VineJS
- **Real-time**: Pusher
- **AI**: Google Gemini API
- **Email**: SendGrid / Nodemailer
- **File Storage**: Cloudinary
- **Error Tracking**: Sentry

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Inertia.js
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Markdown**: React Markdown with syntax highlighting
- **HTTP Client**: Axios

### Development & Testing
- **Build Tool**: Vite
- **Testing**: Jest (Frontend), Japa (Backend), Cypress (E2E)
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **CI/CD**: GitHub Actions
- **Deployment**: Railway

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/abdullah-dev5/gradaccelerate-project-x.git

# Navigate to the project
cd gradaccelerate-project-x

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate app key
node ace generate:key

# Run migrations
node ace migration:run

# Start development server
npm run dev
```

## 🧪 Testing

```bash
# Run all tests (frontend + backend)
npm test

# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend

# Specific test suites
npm run test:unit          # Unit tests
npm run test:controllers   # Controller tests
npm run test:models        # Model tests
npm run test:services      # Service tests
npm run test:validators    # Validator tests
npm run test:middleware    # Middleware tests
npm run test:oauth         # OAuth tests

# E2E tests
npm run test:e2e           # Run Cypress tests
npm run test:e2e:open      # Open Cypress UI
npm run test:e2e:headless  # Run headless

# With coverage (50% threshold required)
npm run test:coverage

# Run all tests including E2E
npm run test:all-with-e2e
```

## 🏗️ Building for Production

```bash
# Build the application (ignores TypeScript errors)
npm run build

# Start production server
npm run start

# Build for deployment (same as build)
npm run build:deploy
```

The build process compiles TypeScript, bundles frontend assets with Vite, and creates optimized production artifacts in the `build/` directory.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory. You can copy from `.env.example` if available:

```env
# Application
NODE_ENV=development
PORT=3333
APP_KEY=your-secret-key  # Generate with: node ace generate:key
HOST=localhost
LOG_LEVEL=info
SESSION_DRIVER=cookie

# Database
DB_CONNECTION=sqlite
DB_DATABASE=./database/app.sqlite

# Google OAuth (Required for authentication)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/auth/google/callback

# Google Gemini AI (Optional - for AI features in bookmarks)
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Pusher (Optional - for real-time features)
PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_CLUSTER=your-cluster

# Sentry (Optional - for error tracking)
SENTRY_DSN=your-sentry-dsn

# Email (Optional - SendGrid or SMTP)
# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# OR SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3333/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

## 📁 Project Structure

```
gradaccelerate-project-x/
├── app/
│   ├── controllers/        # Route controllers (auth, notes, projects, bookmarks, etc.)
│   ├── models/            # Database models (User, Note, Project, Bookmark, Todo, etc.)
│   ├── services/          # Business logic services
│   ├── middleware/        # Custom middleware
│   ├── validators/        # Request validators
│   ├── policies/          # Authorization policies
│   ├── abilities/         # Permission abilities
│   ├── exceptions/        # Custom exceptions
│   ├── events/            # Event definitions
│   ├── listeners/         # Event listeners
│   └── mails/             # Email templates
├── database/
│   ├── migrations/        # Database migrations
│   └── seeders/           # Database seeders
├── inertia/
│   ├── pages/             # React page components
│   ├── components/        # Reusable React components
│   ├── hooks/             # Custom React hooks
│   └── layouts/           # Layout components
├── resources/
│   ├── css/               # Global styles
│   └── js/                # Entry point
├── tests/
│   ├── unit/              # Unit tests
│   ├── functional/        # Functional tests
│   ├── controllers/       # Controller tests
│   ├── models/            # Model tests
│   ├── services/          # Service tests
│   └── validators/        # Validator tests
├── public/                # Static assets
├── config/                # Configuration files
├── start/                 # Application startup files
├── .github/               # CI/CD workflows
└── cypress/               # E2E test files
```

## 🚀 Deployment

The application is deployed on Railway. The deployment is automatically triggered on push to the main branch.

### Railway Configuration

The project uses `railway.toml` for deployment configuration:

```toml
[build]
buildCommand = "npm run build"

[deploy]
startCommand = "node build/bin/server.js"
```

### Deployment Steps

1. Connect your GitHub repository to Railway
2. Configure environment variables in Railway dashboard
3. Railway will automatically build and deploy on push to main branch
4. The application will be available at your Railway-provided URL

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration. See `.github/CICD_README.md` for detailed information about the pipeline.

**Pipeline includes:**
- ✅ Code linting
- ✅ Type checking
- ✅ Frontend tests (Jest)
- ✅ Backend tests (Japa)
- ✅ E2E tests (Cypress) - on release branches and main
- ✅ Build verification
- ✅ Automatic deployment to Railway

## 📚 Available Scripts

```bash
# Development
npm run dev              # Start development server with HMR
npm run start            # Start production server

# Building
npm run build            # Build for production
npm run build:deploy     # Build for deployment

# Code Quality
npm run lint             # Run ESLint
npm run fix              # Fix ESLint issues automatically
npm run typecheck        # Check TypeScript types

# Testing
npm test                 # Run all tests
npm run test:frontend    # Frontend tests only
npm run test:backend     # Backend tests only
npm run test:coverage    # Tests with coverage report
npm run test:e2e         # E2E tests with Cypress
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run tests and ensure they pass (`npm test`)
5. Run linting and fix any issues (`npm run lint`)
6. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
7. Push to the branch (`git push origin feature/AmazingFeature`)
8. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Ensure all tests pass before submitting PR
- Update documentation if needed
- Keep commits atomic and well-described

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Abdullah

## 🙏 Acknowledgments

- AdonisJS Team
- Inertia.js Contributors
- React Team
- TailwindCSS Team
