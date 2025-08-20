# Google OAuth Setup Guide

## 🚨 **Issue: Google OAuth Not Working**

The "Continue with Google" button is stuck loading because the **Google OAuth environment variables are not configured**.

## 🔧 **Solution: Configure Environment Variables**

### Step 1: Create `.env` File

Create a `.env` file in your project root with the following variables:

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
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/google/callback

# Optional: Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: GIPHY API Key
GIPHY_API_KEY=
```

### Step 2: Get Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3333/google/callback` (for development)
     - `https://yourdomain.com/google/callback` (for production)
5. **Copy the credentials**:
   - Client ID
   - Client Secret

### Step 3: Update Your `.env` File

Replace the placeholder values with your actual Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3333/google/callback
```

### Step 4: Generate App Key

Run this command to generate a secure app key:

```bash
node ace generate:key
```

Copy the generated key and update your `.env` file:

```env
APP_KEY=generated-app-key-here
```

## 🧪 **Testing the OAuth Flow**

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test the OAuth Flow

1. Go to `http://localhost:3333/login`
2. Click "Continue with Google"
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you'll be redirected back to your app

### 3. Check the Logs

Watch the console for OAuth logging:

```bash
# You should see logs like:
[OAUTH-abc123def456] Starting OAuth request
[OAUTH-abc123def456] Fetching Google user data...
[OAUTH-abc123def456] ✅ SUCCESS: OAuth flow completed successfully
```

## 🔍 **Troubleshooting**

### Issue: "Invalid redirect_uri"
- Make sure the redirect URI in Google Console matches exactly: `http://localhost:3333/google/callback`
- Check that there are no trailing slashes

### Issue: "Client ID not found"
- Verify your `GOOGLE_CLIENT_ID` is correct
- Make sure the `.env` file is in the project root

### Issue: "Redirect URI mismatch"
- The redirect URI in your `.env` file must match exactly what's configured in Google Console
- For development: `http://localhost:3333/google/callback`
- For production: `https://yourdomain.com/google/callback`

### Issue: Still Loading
- Check browser console for errors
- Verify the server is running on port 3333
- Check that all environment variables are set correctly

## 🛡️ **Security Notes**

1. **Never commit `.env` file** to version control
2. **Use different credentials** for development and production
3. **Keep your client secret secure**
4. **Use HTTPS** in production

## 📋 **Complete Setup Checklist**

- [ ] Created `.env` file with required variables
- [ ] Generated Google OAuth credentials
- [ ] Added redirect URI to Google Console
- [ ] Generated app key with `node ace generate:key`
- [ ] Started development server
- [ ] Tested OAuth flow successfully
- [ ] Verified logs show successful authentication

## 🚀 **Next Steps**

Once OAuth is working:

1. **Test account linking** - try logging in with an existing email
2. **Test new user creation** - try with a new Google account
3. **Check the database** - verify users are being created correctly
4. **Test the hybrid auth** - verify both session and JWT work

---

## ✅ **Expected Behavior After Setup**

1. **Click "Continue with Google"** → Button shows "Redirecting to Google..."
2. **Redirect to Google** → Google OAuth consent screen
3. **Authorize** → Redirect back to your app
4. **Success** → Logged in and redirected to dashboard
5. **Logs** → Detailed OAuth flow logging in console

The OAuth flow should work seamlessly once the environment variables are properly configured! 🎉
