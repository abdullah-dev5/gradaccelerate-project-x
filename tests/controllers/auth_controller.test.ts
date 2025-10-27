import { test } from '@japa/runner'
import User from '#models/user'

test.group('Auth Controller', (group) => {
  group.each.setup(async () => {
    // Clean up any existing test users
    await User.query().where('email', 'like', '%test%').delete()
  })

  group.each.teardown(async () => {
    // Clean up test users after each test
    await User.query().where('email', 'like', '%test%').delete()
  })

  test('POST /api/v1/auth/register - should register a new user', async ({ client, assert }) => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordConfirmation: 'password123',
    }

    const response = await client.post('/api/v1/auth/register').json(userData)

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'User registered successfully',
      user: {
        fullName: userData.fullName,
        email: userData.email,
      },
    })

    // Verify user was created in database
    const user = await User.findBy('email', userData.email)
    assert.isNotNull(user)
    assert.equal(user?.fullName, userData.fullName)
  })

  test('POST /api/v1/auth/register - should fail with invalid email', async ({ client }) => {
    const userData = {
      fullName: 'Test User',
      email: 'invalid-email',
      password: 'password123',
      passwordConfirmation: 'password123',
    }

    const response = await client.post('/api/v1/auth/register').json(userData)

    response.assertStatus(422)
    response.assertBodyContains({
      message: 'Validation failed',
      errors: {
        email: ['The email field must be a valid email address'],
      },
    })
  })

  test('POST /api/v1/auth/register - should fail with password mismatch', async ({ client }) => {
    const userData = {
      fullName: 'Test User',
      email: 'test2@example.com',
      password: 'password123',
      passwordConfirmation: 'different123',
    }

    const response = await client.post('/api/v1/auth/register').json(userData)

    response.assertStatus(422)
    response.assertBodyContains({
      message: 'Validation failed',
      errors: {
        passwordConfirmation: ['The password confirmation field must match the password field'],
      },
    })
  })

  test('POST /api/v1/auth/login - should login with valid credentials', async ({ client }) => {
    // First create a user
    const user = await User.create({
      fullName: 'Test User',
      email: 'test3@example.com',
      password: 'password123',
    })

    const loginData = {
      email: 'test3@example.com',
      password: 'password123',
    }

    const response = await client.post('/api/v1/auth/login').json(loginData)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    })
  })

  test('POST /api/v1/auth/login - should fail with invalid credentials', async ({ client }) => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    }

    const response = await client.post('/api/v1/auth/login').json(loginData)

    response.assertStatus(401)
    response.assertBodyContains({
      message: 'Invalid credentials',
    })
  })

  test('POST /api/v1/auth/logout - should logout authenticated user', async ({ client }) => {
    // Create and login user
    await User.create({
      fullName: 'Test User',
      email: 'test4@example.com',
      password: 'password123',
    })

    const loginResponse = await client.post('/api/v1/auth/login').json({
      email: 'test4@example.com',
      password: 'password123',
    })

    const sessionCookie = loginResponse.cookies()[0]

    const response = await client
      .post('/api/v1/auth/logout')
      .cookie(sessionCookie.name, sessionCookie.value)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Logout successful',
    })
  })

  test('GET /api/v1/auth/me - should return current user when authenticated', async ({
    client,
  }) => {
    // Create and login user
    const user = await User.create({
      fullName: 'Test User',
      email: 'test5@example.com',
      password: 'password123',
    })

    const loginResponse = await client.post('/api/v1/auth/login').json({
      email: 'test5@example.com',
      password: 'password123',
    })

    const sessionCookie = loginResponse.cookies()[0]

    const response = await client
      .get('/api/v1/auth/me')
      .cookie(sessionCookie.name, sessionCookie.value)

    response.assertStatus(200)
    response.assertBodyContains({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    })
  })

  test('GET /api/v1/auth/me - should return 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/v1/auth/me')

    response.assertStatus(401)
    response.assertBodyContains({
      message: 'Unauthorized',
    })
  })

  test('POST /api/v1/auth/forgot-password - should send password reset email', async ({
    client,
  }) => {
    await User.create({
      fullName: 'Test User',
      email: 'test6@example.com',
      password: 'password123',
    })

    const response = await client.post('/api/v1/auth/forgot-password').json({
      email: 'test6@example.com',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Password reset email sent',
    })
  })

  test('POST /api/v1/auth/reset-password - should reset password with valid token', async ({
    client,
  }) => {
    await User.create({
      fullName: 'Test User',
      email: 'test7@example.com',
      password: 'password123',
    })

    // Mock a password reset token (in real app, this would be generated)
    const resetData = {
      token: 'valid-reset-token',
      password: 'newpassword123',
      passwordConfirmation: 'newpassword123',
    }

    const response = await client.post('/api/v1/auth/reset-password').json(resetData)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Password reset successful',
    })
  })
})
