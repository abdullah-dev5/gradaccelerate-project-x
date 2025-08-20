# 🚀 OAuth Setup Guide

## Quick Setup

### 1. Create `.env` file
Create a `.env` file in your project root with:

```env
# App Configuration
NODE_ENV=development
PORT=3333
APP_KEY=your-app-key-here
HOST=0.0.0.0
LOG_LEVEL=info

# Session Configuration
SESSION_DRIVER=cookie

# Google OAuth Configuration (REQUIRED)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/google/callback
```

### 2. Generate App Key
```bash
node ace generate:key
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs: `http://localhost:3333/google/callback`
5. Copy the credentials to your `.env` file

### 4. Test Configuration
```bash
node scripts/check_oauth.js
```

## ✅ Expected Result
- ✅ OAuth health check: `http://localhost:3333/oauth/health`
- ✅ OAuth test: `http://localhost:3333/oauth/test`
- ✅ Login flow: `http://localhost:3333/login`

## 🔧 Simplified Flow
The new approach uses:
1. **Session-first authentication** (simpler, more reliable)
2. **Optional JWT generation** (for API access when needed)
3. **Better SSR handling** (no more `usePage` errors)
4. **Less strict validation** (focuses on essentials)
