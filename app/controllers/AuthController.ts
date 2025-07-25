import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { loginValidator, registerValidator } from '#validators/auth/auth_validator'
import { errors } from '@vinejs/vine'
import env from '#start/env'
import Role from '#models/role'

export default class AuthController {
    /**
     * Login user and return API token
     */
    async login({ request, response, auth }: HttpContext) {
        try {
            const payload = await request.validateUsing(loginValidator)

            // Find user by email
            const user = await User.findBy('email', payload.email)
            if (!user) {
                return response.status(401).json({
                    message: 'Invalid credentials'
                })
            }

            // Verify password (skip if user has no password - OAuth user)
            if (!user.password) {
                return response.status(401).json({
                    message: 'Invalid credentials - this account uses social login'
                })
            }

            const isValidPassword = await hash.verify(user.password, payload.password)
            if (!isValidPassword) {
                return response.status(401).json({
                    message: 'Invalid credentials'
                })
            }

            // Login user via session (for Inertia.js)
            await auth.use('web').login(user)

            // Generate access token (for API access)
            const token = await User.accessTokens.create(user, ['*'], {
                name: 'API Token',
                expiresIn: '30 days'
            })

            return response.json({
                message: 'Login successful',
                token: token.value!.release(),
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            })
        } catch (error) {
            // Handle validation errors specifically
            if (error instanceof errors.E_VALIDATION_ERROR) {
                return response.status(422).json({
                    message: 'Validation failed',
                    errors: error.messages
                })
            }

            return response.status(500).json({
                message: 'An error occurred during login',
                error: error.message
            })
        }
    }

    /**
     * Register new user and return API token
     */
    // before handling duplicate cases orignal  if anything breal commented out
    // async register({ request, response }: HttpContext) {
    //     try {
    //         const payload = await request.validateUsing(registerValidator)

    //         // Check if user already exists
    //         const existingUser = await User.findBy('email', payload.email)
    //         if (existingUser) {
    //             return response.status(409).json({
    //                 message: 'User already exists with this email'
    //             })
    //         }

    //         // Create new user
    //         const user = await User.create({
    //             fullName: payload.fullName,
    //             email: payload.email,
    //             password: payload.password // Will be automatically hashed by the model
    //         })

    //         // Generate access token
    //         const token = await User.accessTokens.create(user, ['*'], {
    //             name: 'API Token',
    //             expiresIn: '30 days'
    //         })

    //         return response.status(201).json({
    //             message: 'User registered successfully',
    //             token: token.value!.release(),
    //             user: {
    //                 id: user.id,
    //                 fullName: user.fullName,
    //                 email: user.email,
    //                 createdAt: user.createdAt,
    //                 updatedAt: user.updatedAt
    //             }
    //         })
    //     } catch (error) {
    //         // Handle validation errors specifically
    //         if (error instanceof errors.E_VALIDATION_ERROR) {
    //             return response.status(422).json({
    //                 message: 'Validation failed',
    //                 errors: error.messages
    //             })
    //         }

    //         return response.status(500).json({
    //             message: 'An error occurred during registration',
    //             error: error.message
    //         })
    //     }
    // }

    async register({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(registerValidator);
            const normalizedEmail = payload.email.toLowerCase();

            // Check if user already exists (case-insensitive)
            const existingUser = await User.query()
                .where('email', normalizedEmail)
                .first();

            if (existingUser) {
                if (existingUser.provider) {
                    return response.status(409).json({
                        message: 'Account already exists with social login. Please use that method.',
                        provider: existingUser.provider // Optional: Return which provider was used
                    });
                }
                return response.status(409).json({
                    message: 'Email already registered.'
                });
            }

            // Create new user
            const user = await User.create({
                fullName: payload.fullName,
                email: normalizedEmail, // Store normalized email
                password: payload.password // Automatically hashed by the model
            });

            // Assign default role (example - adjust as needed)
            const defaultRole = await Role.findBy('slug', 'user');
            if (defaultRole) {
                await user.related('roles').attach([defaultRole.id]);
            }

            // Generate access token
            const token = await User.accessTokens.create(user, ['*'], {
                name: 'API Token',
                expiresIn: '30 days'
            });

            return response.status(201).json({
                message: 'User registered successfully',
                token: token.value!.release(),
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    isAdmin: await user.isAdmin() // Optional: Include role info
                }
            });

        } catch (error) {
            // Handle validation errors
            if (error instanceof errors.E_VALIDATION_ERROR) {
                return response.status(422).json({
                    message: 'Validation failed',
                    errors: error.messages
                });
            }

            console.error('Registration error:', error);
            return response.status(500).json({
                message: 'An error occurred during registration',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Get authenticated user info (requires API token)
     */
    async me({ auth, response }: HttpContext) {
        try {
            await auth.check()

            const user = auth.user!
            return response.json({
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            })
        } catch (error) {
            return response.status(401).json({
                message: 'Unauthorized'
            })
        }
    }

    /**
     * Logout (revoke current token and clear session)
     */
    async logout({ auth, response }: HttpContext) {
        try {
            // Try to get user from either guard
            let user = null
            try {
                await auth.check()
                user = auth.user
            } catch (error) {
                // User not authenticated, that's ok for logout
            }

            // Clear session if using web guard
            try {
                await auth.use('web').logout()
            } catch (error) {
                // No session to clear
            }

            // Revoke API token if user has one
            if (user) {
                const token = user.currentAccessToken
                if (token) {
                    await User.accessTokens.delete(user, token.identifier.toString())
                }
            }

            return response.json({
                message: 'Logged out successfully'
            })
        } catch (error) {
            return response.status(401).json({
                message: 'Unauthorized'
            })
        }
    }

    /**
     * Redirect to Google OAuth
     */
    async googleRedirect({ ally }: HttpContext) {
        return ally.use('google').redirect()
    }

    /**
     * Handle Google OAuth callback
     */
    //before handling duplicate cases
    async googleCallback({ ally, auth, response, session, request }: HttpContext) {
        try {
            const google = ally.use('google')

            console.log('OAuth callback received:', request.qs())

            // Check if the callback has been denied
            if (google.accessDenied()) {
                console.log('OAuth access denied')
                session.flash('error', 'Google authorization was denied')
                return response.redirect('/login')
            }

            if (google.hasError()) {
                const error = google.getError()
                console.log('OAuth error:', error)
                session.flash('error', `OAuth error: ${error}`)
                return response.redirect('/login')
            }

            // For development, we'll handle state mismatch more gracefully
            let googleUser
            try {
                console.log('Before google.user()');
                googleUser = await google.user();
                console.log('After google.user()', googleUser);

            } catch (error) {
                if (error.message.includes('Unable to verify re-redirect state')) {
                    console.log('State verification failed - trying alternative approach');

                    // Get the authorization code from the callback
                    const code = request.input('code');
                    if (!code) {
                        session.flash('error', 'No authorization code received from Google');
                        return response.redirect('/login');
                    }

                    // Manual token exchange (for development only)
                    const start = Date.now();
                    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            code: code,
                            client_id: env.get('GOOGLE_CLIENT_ID'),
                            client_secret: env.get('GOOGLE_CLIENT_SECRET'),
                            redirect_uri: env.get('GOOGLE_REDIRECT_URI'),
                            grant_type: 'authorization_code',
                        }),
                    });
                    console.log('Token exchange took', Date.now() - start, 'ms');

                    if (!tokenResponse.ok) {
                        throw new Error('Failed to exchange code for token');
                    }

                    const tokenData = await tokenResponse.json();

                    const userStart = Date.now();
                    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: {
                            'Authorization': `Bearer ${tokenData.access_token}`
                        }
                    });
                    console.log('User info fetch took', Date.now() - userStart, 'ms');

                    if (!userResponse.ok) {
                        throw new Error('Failed to fetch user info from Google');
                    }

                    const userData = await userResponse.json();

                    // Transform to match expected format
                    googleUser = {
                        id: userData.id,
                        email: userData.email,
                        name: userData.name,
                        avatarUrl: userData.picture
                    };
                } else {
                    throw error // Re-throw if it's a different error
                }
            }

            console.log('Google user data:', {
                id: googleUser.id,
                email: googleUser.email,
                name: googleUser.name
            })

            // Check if user already exists with this provider ID
            let user = await User.query()
                .where('provider', 'google')
                .where('providerId', googleUser.id)
                .first()

            if (!user) {
                // Check if user exists with same email but different provider
                const existingUser = await User.findBy('email', googleUser.email)

                if (existingUser) {
                    // Only link Google if password exists (i.e., not a Google-only user)
                    if (existingUser.password) {
                        existingUser.provider = 'google'
                        existingUser.providerId = googleUser.id
                        existingUser.avatarUrl = googleUser.avatarUrl
                        await existingUser.save()
                        user = existingUser
                    } else {
                        // Prevent duplicate Google-only accounts
                        user = existingUser
                    }
                } else {
                    // Create new Google-only user
                    user = await User.create({
                        fullName: googleUser.name,
                        email: googleUser.email,
                        provider: 'google',
                        providerId: googleUser.id,
                        avatarUrl: googleUser.avatarUrl,
                        password: null // OAuth users don't have passwords
                    })
                }
            }

            // Login user via session (for Inertia.js)
            await auth.use('web').login(user)

            // Generate access token (for API access)
            const token = await User.accessTokens.create(user, ['*'], {
                name: 'OAuth API Token',
                expiresIn: '30 days'
            })

            // Set success flash message
            session.flash('success', 'Successfully logged in with Google!')

            // Redirect to dashboard with token as query parameter (for frontend use)
            return response.redirect(`/dashboard?token=${token.value!.release()}`)

        } catch (error) {
            console.error('OAuth Error Details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            })

            session.flash('error', 'Authentication failed. Please try again.')
            return response.redirect('/login')
        }
    }


}
