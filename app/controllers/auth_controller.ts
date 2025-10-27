import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { loginValidator, registerValidator } from '#validators/auth/auth_validator'
import { errors } from '@vinejs/vine'

import Role from '#models/role'
import BaseController, { ApiResponse } from '#controllers/base_controller'
import OAuthLogger from '#services/o_auth_logger'

export default class AuthController extends BaseController {
  /**
   * ✅ IMPROVED: Login with hybrid approach (session + JWT)
   */
  async login({ request, response, auth, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(loginValidator)
      
      // Check if this is an Inertia request
      const isInertiaRequest = request.header('x-inertia') === 'true'

      // Find user by email (case-insensitive)
      const user = await User.query().where('email', payload.email.toLowerCase()).first()

      if (!user) {
        if (isInertiaRequest) {
          // For Inertia requests, redirect to login with flash errors
          session.flash('errors', { general: 'User does not exist. Please check your email address or sign up.' })
          return response.redirect('/login')
        }
        return response.status(401).json(ApiResponse.error('User does not exist', 401))
      }

      // Verify password (skip if OAuth user)
      if (!user.password) {
        if (isInertiaRequest) {
          session.flash('errors', { general: 'This account uses social login. Please use Google to sign in.' })
          return response.redirect('/login')
        }
        return response
          .status(401)
          .json(ApiResponse.error('This account uses social login. Please use that method.', 401))
      }

      const isValidPassword = await hash.verify(user.password, payload.password)
      if (!isValidPassword) {
        if (isInertiaRequest) {
          session.flash('errors', { general: 'Invalid password. Please check your password and try again.' })
          return response.redirect('/login')
        }
        return response.status(401).json(ApiResponse.error('Invalid password', 401))
      }

      // ✅ HYBRID APPROACH: Login via session (for Inertia) with remember me support
      const rememberMe = request.input('remember_me', false)
      await auth.use('web').login(user, rememberMe)

      // ✅ HYBRID APPROACH: Generate JWT token (for API/SPA)
      const token = await User.accessTokens.create(user, ['*'], {
        name: 'API Token',
        expiresIn: '30 days',
      })

      // ✅ HYBRID MODEL: Support both session and JWT authentication
      const acceptsJson = request.header('accept')?.includes('application/json')
      const isFormData = request.header('content-type')?.includes('application/x-www-form-urlencoded')

      if (isInertiaRequest || isFormData) {
        // For Inertia requests: Session + redirect with token in session
        session.flash('success', 'Login successful!')
        session.put('jwt_token', token.value!.release()) // Store JWT in session for hybrid access
        return response.redirect('/dashboard')
      } else if (acceptsJson) {
        // For API requests: Return JWT token
        return response.json(
          ApiResponse.success(
            {
              token: token.value!.release(),
              user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
            },
            'Login successful'
          )
        )
      } else {
        // For regular form submissions: Session + redirect
        session.flash('success', 'Login successful!')
        return response.redirect('/dashboard')
      }
    } catch (error) {
      // Check if this is an Inertia request
      const isInertiaRequest = request.header('x-inertia') === 'true'
      
      if (error instanceof errors.E_VALIDATION_ERROR) {
        if (isInertiaRequest) {
          // For Inertia requests, redirect to login with flash errors
          const errorMessages = error.messages
          const formattedErrors: any = {}
          
          // Format validation errors for Inertia
          for (const [field, messages] of Object.entries(errorMessages)) {
            if (Array.isArray(messages) && messages.length > 0) {
              formattedErrors[field] = messages[0].message
            } else if (messages && typeof messages === 'object' && 'message' in messages) {
              formattedErrors[field] = (messages as any).message
            } else {
              formattedErrors[field] = 'Validation failed'
            }
          }
          
          session.flash('errors', formattedErrors)
          return response.redirect('/login')
        }
        
        return response
          .status(422)
          .json(ApiResponse.error('Validation failed', 422, error.messages))
      }

      console.error('Login error:', error)
      
      if (isInertiaRequest) {
        session.flash('errors', { general: 'An error occurred during login. Please try again.' })
        return response.redirect('/login')
      }
      
      return response.status(500).json(ApiResponse.error('An error occurred during login', 500))
    }
  }

  /**
   * ✅ IMPROVED: Register with hybrid approach
   */
  async register({ request, response, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerValidator)
      const normalizedEmail = payload.email.toLowerCase()

      // Check if this is an Inertia request
      const isInertiaRequest = request.header('x-inertia') === 'true'

      // Check if user already exists (case-insensitive)
      const existingUser = await User.query().where('email', normalizedEmail).first()

      if (existingUser) {
        if (existingUser.provider) {
          if (isInertiaRequest) {
            session.flash('errors', { general: 'Account already exists with social login. Please use that method.' })
            return response.redirect('/register')
          }
          return response
            .status(409)
            .json(
              ApiResponse.error(
                'Account already exists with social login. Please use that method.',
                409
              )
            )
        }
        if (isInertiaRequest) {
          session.flash('errors', { email: 'This email is already registered. Please sign in.' })
          return response.redirect('/register')
        }
        return response.status(409).json(ApiResponse.error('Email already registered.', 409))
      }

      // Create new user
      const user = await User.create({
        fullName: payload.fullName,
        email: normalizedEmail,
        password: payload.password,
      })

      // Assign default role
      const defaultRole = await Role.findBy('slug', 'user')
      if (defaultRole) {
        await user.related('roles').attach([defaultRole.id])
      }

      // ✅ HYBRID APPROACH: Login via session (for Inertia)
      // Note: We don't auto-login on register for security
      // User needs to explicitly login after registration

      // ✅ HYBRID APPROACH: Generate JWT token (for API/SPA)
      const token = await User.accessTokens.create(user, ['*'], {
        name: 'API Token',
        expiresIn: '30 days',
      })

      // Set success flash message for Inertia
      if (isInertiaRequest) {
        session.flash('success', 'Registration successful! Please sign in.')
        return response.redirect('/login')
      }

      return response.status(201).json(
        ApiResponse.success(
          {
            token: token.value!.release(),
            user: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
          },
          'User registered successfully'
        )
      )
    } catch (error) {
      // Check if this is an Inertia request
      const isInertiaRequest = request.header('x-inertia') === 'true'
      
      if (error instanceof errors.E_VALIDATION_ERROR) {
        if (isInertiaRequest) {
          // For Inertia requests, redirect to register with flash errors
          const errorMessages = error.messages
          const formattedErrors: any = {}
          
          // Format validation errors for Inertia
          for (const [field, messages] of Object.entries(errorMessages)) {
            if (Array.isArray(messages) && messages.length > 0) {
              formattedErrors[field] = messages[0].message
            } else if (messages && typeof messages === 'object' && 'message' in messages) {
              formattedErrors[field] = (messages as any).message
            } else {
              formattedErrors[field] = 'Validation failed'
            }
          }
          
          session.flash('errors', formattedErrors)
          return response.redirect('/register')
        }
        
        return response
          .status(422)
          .json(ApiResponse.error('Validation failed', 422, error.messages))
      }

      console.error('Registration error:', error)
      
      if (isInertiaRequest) {
        session.flash('errors', { general: 'An error occurred during registration. Please try again.' })
        return response.redirect('/register')
      }
      
      return response
        .status(500)
        .json(ApiResponse.error('An error occurred during registration', 500))
    }
  }

  /**
   * ✅ IMPROVED: Get authenticated user info (supports both guards)
   */
  async me({ auth, response, session, request }: HttpContext) {
    try {
      // Try to authenticate with session guard first (for web requests)
      let user = null

      try {
        await auth.use('web').authenticate()
        user = auth.user!
      } catch (error) {
        // If web guard fails, try API guard
        try {
          await auth.use('api').authenticate()
          user = auth.user!
        } catch (apiError) {
          // Both guards failed - user is not authenticated
          return response.status(401).json(ApiResponse.error('Not authenticated', 401))
        }
      }

      // ✅ HYBRID: Include JWT token from session if available
      const jwtToken = session.get('jwt_token')

      // Always return JSON for API requests (this endpoint is for API)
      return response.json(
        ApiResponse.success({
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            provider: user.provider,
            avatarUrl: user.avatarUrl,
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            webNotificationsEnabled: user.webNotificationsEnabled,
            reminderEmailsEnabled: user.reminderEmailsEnabled,
            reminderWebEnabled: user.reminderWebEnabled,
            createdAt: user.createdAt.toISO ? user.createdAt.toISO() : user.createdAt,
            updatedAt: user.updatedAt?.toISO ? user.updatedAt.toISO() : user.updatedAt,
          },
          token: jwtToken || null, // Include JWT token for hybrid auth
        })
      )
    } catch (error) {
      // Check if it's an Inertia request
      const isInertiaRequest = request.header('x-inertia') === 'true'

      if (isInertiaRequest) {
        // For Inertia requests, redirect to login page
        return response.redirect('/login')
      } else {
        // For API requests, return JSON error
        return response.status(401).json(ApiResponse.error('Invalid credentials', 401))
      }
    }
  }

  /**
   * ✅ IMPROVED: Logout (clears both session and JWT)
   */
  async logout({ auth, response, session, request }: HttpContext) {
    try {
      let user = null

      // Try to get user from either guard
      try {
        await auth.authenticate()
        user = auth.user
      } catch (error) {
        try {
          await auth.use('api').authenticate()
          user = auth.user
        } catch (apiError) {
          // User not authenticated, that's ok for logout
        }
      }

      // ✅ HYBRID APPROACH: Clear session (for Inertia)
      try {
        await auth.use('web').logout()
      } catch (error) {
        // No session to clear
      }

      // ✅ HYBRID APPROACH: Revoke JWT token (for API/SPA)
      if (user) {
        const token = user.currentAccessToken
        if (token) {
          await User.accessTokens.delete(user, token.identifier.toString())
        }
      }

      // ✅ STANDARD: Clear session data
      session.clear()
      session.flash('success', 'Logged out successfully')

      // ✅ CRITICAL: Set response headers to clear cookies and prevent caching
      response.header('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.header('Pragma', 'no-cache')
      response.header('Expires', '0')

      // ✅ CRITICAL: Clear any authentication cookies
      response.cookie('remember_web', null, {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })

      // ✅ CRITICAL: Clear session cookie with multiple approaches
      response.cookie('adonis-session', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      
      // Also try clearing with different cookie names
      response.cookie('adonis-session', '', {
        expires: new Date(0),
        path: '/',
        maxAge: 0,
        httpOnly: true,
      })

      // ✅ STANDARD: Handle response based on request type
      const isInertiaRequest = request.header('x-inertia') === 'true'
      const isApiRequest = request.url().startsWith('/api/')

      if (isInertiaRequest) {
        // For Inertia requests, force a hard redirect with cache-busting
        response.header('Location', '/?logout=success&t=' + Date.now())
        return response.status(307).header('Clear-Site-Data', '"cache", "cookies", "storage"').redirect('/?logout=success&t=' + Date.now())
      } else if (isApiRequest) {
        // For API requests, return JSON
        return response.json(ApiResponse.success(null, 'Logged out successfully'))
      } else {
        // For regular web requests, redirect to home page
        return response.redirect('/')
      }
    } catch (error) {
      console.error('Logout error:', error)

      const isInertiaRequest = request.header('x-inertia') === 'true'
      const isApiRequest = request.url().startsWith('/api/')

      if (isInertiaRequest || !isApiRequest) {
        session.flash('error', 'An error occurred during logout')
        return response.redirect('/')
      } else {
        return response.status(500).json(ApiResponse.error('An error occurred during logout', 500))
      }
    }
  }

  /**
   * ✅ FIXED: Google OAuth redirect without custom state management
   */
  async googleRedirect({ ally, response }: HttpContext) {
    try {
      console.log('🔗 Starting Google OAuth redirect...')

      console.log('🔗 Ally configuration:', {
        clientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
        callbackUrl: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
      })

      console.log('🔗 Creating Ally Google instance...')
      const google = ally.use('google')
      console.log('🔗 Ally Google instance created successfully')

      console.log('🔗 Generating redirect URL...')
      const redirectUrl = google.redirect()
      console.log('🔗 Redirect URL generated:', redirectUrl)
      console.log('🔗 Redirect URL type:', typeof redirectUrl)

      if (typeof redirectUrl === 'string') {
        console.log('🔗 Redirecting to:', redirectUrl)
        return response.redirect(redirectUrl)
      } else {
        console.log('🔗 Redirect URL is not a string, returning as is')
        return redirectUrl
      }
    } catch (error) {
      console.error('❌ Google OAuth redirect error:', error)
      console.error('❌ Error stack:', error.stack)

      // Return a user-friendly error response
      return response.status(500).json({
        success: false,
        message: 'OAuth configuration error. Please check your Google OAuth credentials.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Configuration error',
      })
    }
  }

  /**
   * 🔍 DEBUG: OAuth state checker (development only)
   */
  async oauthDebug({ ally, request, response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      const google = ally.use('google')
      const url = request.url()
      const queryParams = request.qs()

      return response.json({
        success: true,
        debug: {
          url,
          queryParams,
          hasError: google.hasError(),
          accessDenied: google.accessDenied(),
          error: google.hasError() ? google.getError() : null,
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
            GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
          },
          timestamp: new Date().toISOString(),
          serverTime: Date.now(),
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }

  /**
   * 🧪 DEBUG: Simple OAuth configuration test
   */
  async oauthDebugSimple({ ally, response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      const google = ally.use('google')

      return response.json({
        success: true,
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
          redirectUri: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
          nodeEnv: process.env.NODE_ENV,
        },
        ally: {
          hasError: google.hasError(),
          accessDenied: google.accessDenied(),
          error: google.hasError() ? google.getError() : null,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * 🏥 HEALTH: OAuth health check
   */
  async oauthHealth({ response }: HttpContext) {
    try {
      return response.json({
        success: true,
        status: 'healthy',
        oauth: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID ? 'CONFIGURED' : 'MISSING',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURED' : 'MISSING',
            redirectUri: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message,
      })
    }
  }

  /**
   * 🌐 NETWORK: Network connectivity diagnostic
   */
  async networkDiagnostic({ response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      const https = await import('node:https')
      const results = {
        googleOAuth: false,
        googleAPIs: false,
        googleAccounts: false,
        timestamp: new Date().toISOString(),
      }

      // Test Google OAuth endpoint
      try {
        await new Promise((resolve, reject) => {
          const req = https.get('https://oauth2.googleapis.com', { timeout: 5000 }, (res) => {
            results.googleOAuth = res.statusCode === 200
            resolve(true)
          })
          req.on('error', reject)
          req.on('timeout', () => reject(new Error('Timeout')))
        })
      } catch (error) {
        console.error('Google OAuth connectivity test failed:', error.message)
      }

      // Test Google APIs endpoint
      try {
        await new Promise((resolve, reject) => {
          const req = https.get('https://www.googleapis.com', { timeout: 5000 }, (res) => {
            results.googleAPIs = res.statusCode === 200
            resolve(true)
          })
          req.on('error', reject)
          req.on('timeout', () => reject(new Error('Timeout')))
        })
      } catch (error) {
        console.error('Google APIs connectivity test failed:', error.message)
      }

      // Test Google Accounts endpoint
      try {
        await new Promise((resolve, reject) => {
          const req = https.get('https://accounts.google.com', { timeout: 5000 }, (res) => {
            results.googleAccounts = res.statusCode === 200
            resolve(true)
          })
          req.on('error', reject)
          req.on('timeout', () => reject(new Error('Timeout')))
        })
      } catch (error) {
        console.error('Google Accounts connectivity test failed:', error.message)
      }

      return response.json({
        success: true,
        network: results,
        recommendations: {
          allGood: results.googleOAuth && results.googleAPIs && results.googleAccounts,
          checkInternet: !results.googleOAuth && !results.googleAPIs && !results.googleAccounts,
          checkFirewall: results.googleAPIs && !results.googleOAuth,
          checkDNS: results.googleAccounts && !results.googleAPIs,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * 🧪 TEST: Simple OAuth configuration test
   */
  async oauthTest({ response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      // Test basic configuration
      const config = {
        clientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
        nodeEnv: process.env.NODE_ENV,
      }

      // Test network connectivity
      const https = await import('node:https')
      const networkTest = await new Promise<{ status: number | string; connected: boolean }>(
        (resolve) => {
          const req = https.get('https://oauth2.googleapis.com', { timeout: 5000 }, (res) => {
            resolve({ status: res.statusCode || 0, connected: res.statusCode === 200 })
          })
          req.on('error', () => resolve({ status: 'error', connected: false }))
          req.on('timeout', () => resolve({ status: 'timeout', connected: false }))
        }
      )

      return response.json({
        success: true,
        config,
        network: networkTest,
        timestamp: new Date().toISOString(),
        recommendations: {
          allGood:
            config.clientId === 'SET' && config.clientSecret === 'SET' && networkTest.connected,
          checkCredentials: config.clientId === 'MISSING' || config.clientSecret === 'MISSING',
          checkNetwork: !networkTest.connected,
          checkRedirectUri: config.redirectUri === 'MISSING',
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * 🧪 TEST: Direct Google OAuth credentials test
   */
  async testGoogleCredentials({ response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      const redirectUri = process.env.GOOGLE_REDIRECT_URI

      // Test basic credential format
      const clientIdValid = clientId && clientId.includes('.apps.googleusercontent.com')
      const clientSecretValid = clientSecret && clientSecret.length > 10
      const redirectUriValid = redirectUri && redirectUri.includes('localhost:3333')

      return response.json({
        success: true,
        credentials: {
          clientId: clientIdValid ? 'VALID' : 'INVALID',
          clientSecret: clientSecretValid ? 'VALID' : 'INVALID',
          redirectUri: redirectUriValid ? 'VALID' : 'INVALID',
          clientIdPreview: clientId ? clientId.substring(0, 20) + '...' : 'MISSING',
          redirectUriFull: redirectUri || 'MISSING',
        },
        recommendations: {
          checkGoogleConsole: !clientIdValid || !clientSecretValid,
          checkRedirectUri: !redirectUriValid,
          allGood: clientIdValid && clientSecretValid && redirectUriValid,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * 🧪 TEST: Simple redirect test to see Google callback data
   */
  async testRedirect({ request, response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    return response.json({
      success: true,
      url: request.url(),
      queryParams: request.qs(),
      headers: {
        'user-agent': request.header('user-agent'),
        'referer': request.header('referer'),
      },
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * 🌐 TEST: Direct Google OAuth endpoint connectivity
   */
  async testGoogleConnectivity({ response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      const https = await import('node:https')
      const results = {
        oauth2Googleapis: false,
        accountsGoogle: false,
        wwwGoogleapis: false,
      }

      // Test oauth2.googleapis.com
      try {
        await new Promise((resolve, reject) => {
          const req = https.get('https://oauth2.googleapis.com', { timeout: 5000 }, (res) => {
            results.oauth2Googleapis = res.statusCode === 200
            resolve(true)
          })
          req.on('error', reject)
          req.on('timeout', () => reject(new Error('Timeout')))
        })
      } catch (error) {
        console.error('oauth2.googleapis.com test failed:', error.message)
      }

      // Test accounts.google.com
      try {
        await new Promise((resolve, reject) => {
          const req = https.get('https://accounts.google.com', { timeout: 5000 }, (res) => {
            results.accountsGoogle = res.statusCode === 200
            resolve(true)
          })
          req.on('error', reject)
          req.on('timeout', () => reject(new Error('Timeout')))
        })
      } catch (error) {
        console.error('accounts.google.com test failed:', error.message)
      }

      // Test www.googleapis.com
      try {
        await new Promise((resolve, reject) => {
          const req = https.get('https://www.googleapis.com', { timeout: 5000 }, (res) => {
            results.wwwGoogleapis = res.statusCode === 200
            resolve(true)
          })
          req.on('error', reject)
          req.on('timeout', () => reject(new Error('Timeout')))
        })
      } catch (error) {
        console.error('www.googleapis.com test failed:', error.message)
      }

      return response.json({
        success: true,
        connectivity: results,
        timestamp: new Date().toISOString(),
        recommendations: {
          allGood: results.oauth2Googleapis && results.accountsGoogle && results.wwwGoogleapis,
          checkFirewall: !results.oauth2Googleapis && !results.accountsGoogle,
          checkDNS: results.accountsGoogle && !results.oauth2Googleapis,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * 🔧 TEST: Direct HTTPS request to Google OAuth
   */
  async testDirectHttps({ response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      const https = await import('node:https')

      // Test direct HTTPS request to Google OAuth
      const testUrl = 'https://oauth2.googleapis.com/token'

      return new Promise((resolve) => {
        const req = https.get(testUrl, { timeout: 10000 }, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            resolve(
              response.json({
                success: true,
                statusCode: res.statusCode,
                headers: res.headers,
                data: data.substring(0, 200) + '...',
                timestamp: new Date().toISOString(),
              })
            )
          })
        })

        req.on('error', (error) => {
          resolve(
            response.json({
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
            })
          )
        })

        req.on('timeout', () => {
          req.destroy()
          resolve(
            response.json({
              success: false,
              error: 'Request timeout',
              timestamp: new Date().toISOString(),
            })
          )
        })
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }

  /**
   * 🧪 TEST: Ally configuration test
   */
  async testAllyConfig({ ally, response }: HttpContext) {
    if (process.env.NODE_ENV !== 'development') {
      return response.status(404).json({ error: 'Not found' })
    }

    try {
      console.log('🧪 Testing Ally configuration...')

      const google = ally.use('google')
      console.log('🧪 Ally Google instance created')

      // Test redirect URL generation
      console.log('🧪 Testing redirect URL generation...')
      const redirectUrl = google.redirect()
      console.log('🧪 Redirect URL generated:', redirectUrl)

      // Test if we can access Google OAuth endpoints
      console.log('🧪 Testing Google OAuth endpoint accessibility...')

      return response.json({
        success: true,
        ally: {
          hasError: google.hasError(),
          accessDenied: google.accessDenied(),
          error: google.hasError() ? google.getError() : null,
          redirectUrl: typeof redirectUrl === 'string' ? redirectUrl : 'Not a string',
        },
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
          callbackUrl: process.env.GOOGLE_REDIRECT_URI || 'MISSING',
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('🧪 Ally config test error:', error)
      return response.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack,
      })
    }
  }

  /**
   * ✅ REDEFINED: Google OAuth callback with proper hybrid approach
   */
  async googleCallback({ ally, auth, response, session, request }: HttpContext) {
    const startTime = Date.now()
    const requestId = OAuthLogger.startRequest()

    try {
      const google = ally.use('google')

      // Check for OAuth errors
      if (google.accessDenied()) {
        OAuthLogger.logWarning(requestId, 'Google authorization was denied by user')
        session.flash('error', 'Google authorization was denied')
        return response.redirect('/login')
      }

      if (google.hasError()) {
        const error = google.getError()
        OAuthLogger.logError({
          requestId,
          action: 'oauth_google_error',
          error: error || 'Unknown OAuth error',
          ip: request.ip(),
          userAgent: request.header('user-agent'),
          additionalData: { url: request.url() },
        })
        session.flash('error', `OAuth error: ${error}`)
        return response.redirect('/login')
      }

      // ✅ REDEFINED: Try Ally first, then manual fallback
      let googleUser: any
      try {
        OAuthLogger.logStep(requestId, 'Fetching Google user data...')

        // Add detailed debugging
        console.log(`[DEBUG-${requestId}] Starting OAuth token exchange...`)
        console.log(`[DEBUG-${requestId}] Request URL:`, request.url())
        console.log(`[DEBUG-${requestId}] Query params:`, request.qs())
        console.log(`[DEBUG-${requestId}] Ally config:`, {
          hasError: google.hasError(),
          accessDenied: google.accessDenied(),
          error: google.hasError() ? google.getError() : null,
        })

        // Step 1: Try Ally's user() method with longer timeout
        console.log(`[DEBUG-${requestId}] Step 1: Trying Ally user() method...`)
        const allyTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Ally user() timeout after 15 seconds')), 15000)
        })

        const tokenStartTime = Date.now()

        try {
          // Try Ally's built-in method first
          googleUser = await Promise.race([google.user(), allyTimeoutPromise])
          console.log(`[DEBUG-${requestId}] ✅ Ally user() method succeeded!`)
          console.log(`[DEBUG-${requestId}] Ally user data:`, {
            id: googleUser?.id,
            email: googleUser?.email,
            name: googleUser?.name,
          })
        } catch (allyError) {
          console.warn(`[DEBUG-${requestId}] ❌ Ally user() method failed:`, allyError.message)

          // Step 2: Fall back to manual token exchange
          console.log(`[DEBUG-${requestId}] Step 2: Falling back to manual token exchange...`)
          googleUser = await this.performManualTokenExchange(requestId, request)
          console.log(`[DEBUG-${requestId}] ✅ Manual token exchange succeeded!`)
          console.log(`[DEBUG-${requestId}] Manual user data:`, {
            id: googleUser?.id,
            email: googleUser?.email,
            name: googleUser?.name,
          })
        }

        const endTime = Date.now()
        console.log(
          `[DEBUG-${requestId}] Token exchange completed in:`,
          endTime - tokenStartTime,
          'ms'
        )
        OAuthLogger.logGoogleUserReceived(requestId, googleUser)
      } catch (error) {
        const endTime = Date.now()
        console.error(
          `[DEBUG-${requestId}] ❌ All token exchange methods failed after:`,
          endTime - startTime,
          'ms'
        )
        console.error(`[DEBUG-${requestId}] Final error:`, error.message)
        console.error(`[DEBUG-${requestId}] Error stack:`, error.stack)

        OAuthLogger.logError({
          requestId,
          action: 'oauth_google_user_fetch',
          error: error.message,
          stack: error.stack,
          ip: request.ip(),
          userAgent: request.header('user-agent'),
          additionalData: {
            url: request.url(),
            duration: endTime - startTime,
            errorType: error.constructor.name,
          },
        })
        session.flash('error', 'Failed to authenticate with Google. Please try again.')
        return response.redirect('/login')
      }

      // ✅ HYBRID: Find or create user
      let user = await User.query()
        .where((query) => {
          query
            .where('provider', 'google')
            .where('providerId', googleUser.id)
            .orWhere('email', googleUser.email)
        })
        .first()

      if (!user) {
        // Create new Google user
        OAuthLogger.logStep(requestId, 'Creating new Google user...')
        user = await User.create({
          fullName: googleUser.name,
          email: googleUser.email,
          provider: 'google',
          providerId: googleUser.id,
          avatarUrl: googleUser.avatarUrl,
          password: null,
        })
        OAuthLogger.logUserCreation(requestId, user)
      } else if (!user.providerId) {
        // Link Google to existing email account
        OAuthLogger.logAccountLinking(requestId, user, googleUser.id)
        user.provider = 'google'
        user.providerId = googleUser.id
        user.avatarUrl = googleUser.avatarUrl
        // Update fullName if not set or if Google provides a better name
        if (!user.fullName && googleUser.name) {
          user.fullName = googleUser.name
        }
        await user.save()
        OAuthLogger.logStep(requestId, 'Account linking completed')
      } else {
        OAuthLogger.logStep(requestId, 'Existing Google user found')
      }

      // ✅ HYBRID APPROACH: Conditional token exchange based on request type
      OAuthLogger.logStep(requestId, 'Starting conditional authentication...')

      // Determine authentication method based on request type
      const { sessionToken, jwtToken } = await this.handleTokenExchange(
        requestId,
        user,
        request,
        session
      )

      if (sessionToken) {
        // Session login for web/Inertia requests
        await auth.use('web').login(user)
        OAuthLogger.logStep(requestId, 'Session login completed')

        // Store JWT in session for hybrid access if available
        if (jwtToken) {
          session.put('jwt_token', jwtToken)
          OAuthLogger.logStep(requestId, 'JWT token stored in session')
        }
      } else if (jwtToken) {
        // JWT-only for API requests
        OAuthLogger.logStep(requestId, 'JWT-only authentication for API')
        // Don't create session, just return JWT
      } else {
        // Fallback to session if JWT generation failed
        await auth.use('web').login(user)
        OAuthLogger.logStep(requestId, 'Fallback session login completed')
      }

      // ✅ SUCCESS: Log authentication success
      const duration = Date.now() - startTime
      OAuthLogger.logAuthenticationSuccess(requestId, user, duration)

      // ✅ RESPONSE: Handle response based on request type
      return this.handleAuthResponse(request, response, session, user, jwtToken)
    } catch (error) {
      const duration = Date.now() - startTime
      OAuthLogger.logAuthenticationError(requestId, error, duration)

      session.flash('error', 'Authentication failed. Please try again.')
      return response.redirect('/login')
    }
  }

  /**
   * 🔄 IMPROVED: Manual token exchange with better error handling
   */
  private async performManualTokenExchange(requestId: string, request: any) {
    try {
      const https = await import('node:https')
      const querystring = await import('node:querystring')

      const code = request.qs().code
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET
      const redirectUri = process.env.GOOGLE_REDIRECT_URI

      if (!code || !clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing required OAuth parameters')
      }

      console.log(`[DEBUG-${requestId}] Manual token exchange starting...`)
      console.log(`[DEBUG-${requestId}] Authorization code:`, code.substring(0, 20) + '...')
      console.log(`[DEBUG-${requestId}] Redirect URI:`, redirectUri)
      console.log(`[DEBUG-${requestId}] Client ID:`, clientId.substring(0, 20) + '...')

      // Prepare token exchange request
      const postData = querystring.stringify({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      })

      const options = {
        hostname: 'oauth2.googleapis.com',
        port: 443,
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 10000, // 10 second timeout
      }

      console.log(`[DEBUG-${requestId}] Making HTTPS request to Google...`)

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              console.log(`[DEBUG-${requestId}] Token exchange response status:`, res.statusCode)
              console.log(`[DEBUG-${requestId}] Response data:`, data.substring(0, 300) + '...')

              const tokenResponse = JSON.parse(data)

              if (res.statusCode !== 200) {
                const errorMsg =
                  tokenResponse.error_description || tokenResponse.error || 'Unknown error'
                console.error(
                  `[DEBUG-${requestId}] Token exchange failed with status ${res.statusCode}:`,
                  errorMsg
                )

                // Handle specific error types
                if (tokenResponse.error === 'invalid_grant') {
                  console.error(
                    `[DEBUG-${requestId}] Invalid grant error - code may be expired or already used`
                  )
                  reject(new Error('Authorization code expired or already used. Please try again.'))
                } else {
                  reject(new Error(`Token exchange failed (${res.statusCode}): ${errorMsg}`))
                }
                return
              }

              if (tokenResponse.error) {
                reject(
                  new Error(
                    `Token exchange failed: ${tokenResponse.error_description || tokenResponse.error}`
                  )
                )
                return
              }

              console.log(`[DEBUG-${requestId}] ✅ Token exchange successful!`)
              console.log(
                `[DEBUG-${requestId}] Access token received:`,
                tokenResponse.access_token ? 'YES' : 'NO'
              )

              // Now get user info using the access token
              this.getUserInfoWithToken(requestId, tokenResponse.access_token)
                .then(resolve)
                .catch(reject)
            } catch (parseError) {
              reject(new Error(`Failed to parse token response: ${parseError.message}`))
            }
          })
        })

        req.on('error', (error) => {
          console.error(`[DEBUG-${requestId}] Network error during token exchange:`, error.message)
          reject(new Error(`Network error during token exchange: ${error.message}`))
        })

        req.on('timeout', () => {
          console.error(`[DEBUG-${requestId}] Token exchange timeout`)
          req.destroy()
          reject(new Error('Token exchange timeout'))
        })

        console.log(`[DEBUG-${requestId}] Writing request data...`)
        req.write(postData)
        req.end()
      })
    } catch (error) {
      throw new Error(`Manual token exchange failed: ${error.message}`)
    }
  }

  /**
   * 👤 GET_USER: Get user info using access token
   */
  private async getUserInfoWithToken(_requestId: string, accessToken: string) {
    try {
      const https = await import('node:https')

      const options = {
        hostname: 'www.googleapis.com',
        port: 443,
        path: '/oauth2/v2/userinfo',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'AdonisJS-OAuth-Fallback',
        },
        timeout: 10000, // 10 second timeout
      }

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              const userInfo = JSON.parse(data)

              if (userInfo.error) {
                reject(
                  new Error(
                    `Failed to get user info: ${userInfo.error_description || userInfo.error}`
                  )
                )
                return
              }

              // Format user data to match Ally's format
              const googleUser = {
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                avatarUrl: userInfo.picture,
                emailVerified: userInfo.verified_email,
              }

              resolve(googleUser)
            } catch (parseError) {
              reject(new Error(`Failed to parse user info: ${parseError.message}`))
            }
          })
        })

        req.on('error', (error) => {
          reject(new Error(`Network error getting user info: ${error.message}`))
        })

        req.on('timeout', () => {
          req.destroy()
          reject(new Error('User info request timeout'))
        })

        req.end()
      })
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`)
    }
  }

  /**
   * ✅ SIMPLIFIED: Basic OAuth configuration validator
   */
  private _validateOAuthConfig(request: any) {
    const configErrors = []

    // Only check essential environment variables
    if (!process.env.GOOGLE_CLIENT_ID) {
      configErrors.push('GOOGLE_CLIENT_ID is missing')
    }
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      configErrors.push('GOOGLE_CLIENT_SECRET is missing')
    }

    // Check authorization code
    const code = request.qs().code
    if (!code) {
      configErrors.push('Authorization code is missing from callback')
    }

    if (configErrors.length > 0) {
          console.error(`OAuth configuration errors:`, configErrors)
    throw new Error(`OAuth configuration errors: ${configErrors.join(', ')}`)
  }

  console.log(`OAuth configuration validation passed`)
    return true
  }

  /**
   * ✅ CONDITIONAL: Handle token exchange based on request type
   */
  private async handleTokenExchange(requestId: string, user: any, request: any, _session: any) {
    const isApiRequest = request.header('accept')?.includes('application/json')
    const isInertiaRequest = request.header('x-inertia') === 'true'

    // Always do session login for web requests
    if (!isApiRequest || isInertiaRequest) {
      OAuthLogger.logStep(requestId, 'Performing session login for web request')
      return { sessionToken: true, jwtToken: null }
    }

    // For API requests, generate JWT token
    try {
      OAuthLogger.logStep(requestId, 'Generating JWT token for API request')
      const token = await User.accessTokens.create(user, ['*'], {
        name: 'OAuth API Token',
        expiresIn: '30 days',
      })
      const jwtToken = token.value!.release()
      OAuthLogger.logStep(requestId, 'JWT token generated successfully')
      return { sessionToken: false, jwtToken }
    } catch (error) {
      console.warn(`[DEBUG-${requestId}] JWT token generation failed:`, error.message)
      return { sessionToken: false, jwtToken: null }
    }
  }

  /**
   * ✅ RESPONSE: Handle response based on request type
   */
  private handleAuthResponse(
    request: any,
    response: any,
    session: any,
    user: any,
    jwtToken: string | null
  ) {
    const isApiRequest = request.header('accept')?.includes('application/json')
    const isInertiaRequest = request.header('x-inertia') === 'true'

    if (isApiRequest && !isInertiaRequest && jwtToken) {
      // API request with JWT token
      return response.json({
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
        message: 'Authentication successful',
      })
    } else {
      // Web/Inertia request - redirect with session
      session.flash('success', 'Successfully logged in with Google!')
      return response.redirect('/dashboard')
    }
  }
}
