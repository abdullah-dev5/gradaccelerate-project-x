import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { loginValidator, registerValidator } from '#validators/auth/auth_validator'
import { errors } from '@vinejs/vine'

export default class AuthController {
    /**
     * Login user and return API token
     */
    async login({ request, response, auth, session }: HttpContext) {
        try {
            const payload = await request.validateUsing(loginValidator)

            // Find user by email
            const user = await User.findBy('email', payload.email)
            if (!user) {
                return response.status(401).json({
                    message: 'Invalid credentials'
                })
            }

            // Verify password
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
    async register({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(registerValidator)

            // Check if user already exists
            const existingUser = await User.findBy('email', payload.email)
            if (existingUser) {
                return response.status(409).json({
                    message: 'User already exists with this email'
                })
            }

            // Create new user
            const user = await User.create({
                fullName: payload.fullName,
                email: payload.email,
                password: payload.password // Will be automatically hashed by the model
            })

            // Generate access token
            const token = await User.accessTokens.create(user, ['*'], {
                name: 'API Token',
                expiresIn: '30 days'
            })

            return response.status(201).json({
                message: 'User registered successfully',
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
                message: 'An error occurred during registration',
                error: error.message
            })
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
}
