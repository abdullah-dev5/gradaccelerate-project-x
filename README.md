# GradAccelerate Project

A modern full-stack application built with AdonisJS, React, and Inertia.js.

## 🚀 Features

- **Notes Management**: Create, edit, and organize your notes efficiently
- **Project Tracking**: Track your projects and associated notes
- **Bookmarks**: Save and manage your bookmarks
- **Search & Filter**: Advanced search capabilities across all content
- **Real-time Updates**: Live notifications for important events
- **User Authentication**: Secure authentication with Google OAuth
- **Beautiful UI**: Modern, responsive design

## 🛠️ Tech Stack

- **Backend**: AdonisJS 6
- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **Database**: SQLite
- **Testing**: Jest, Japa
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
# Run all tests
npm test

# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3333
APP_KEY=your-secret-key
HOST=localhost
LOG_LEVEL=info
SESSION_DRIVER=cookie

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/auth/google/callback

# Optional: Cloudinary for image uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: Pusher for real-time features
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_CLUSTER=

# Optional: Google Gemini AI
GOOGLE_GEMINI_API_KEY=

# Optional: SMTP for emails
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## 📁 Project Structure

```
gradaccelerate-project-x/
├── app/
│   ├── controllers/     # Route controllers
│   ├── models/         # Database models
│   ├── services/       # Business logic services
│   └── ...
├── database/           # Database files and migrations
├── inertia/           # React components
├── resources/         # Frontend resources (JS/CSS)
├── tests/             # Test files
├── public/            # Static assets
└── .github/           # CI/CD workflows
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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Abdullah

## 🙏 Acknowledgments

- AdonisJS Team
- Inertia.js Contributors
- React Team
- TailwindCSS Team
