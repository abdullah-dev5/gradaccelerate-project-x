import { test } from '@japa/runner'
import User from '#models/user'
import Todo from '#models/todo'

// Helper function to authenticate user
async function authenticateUser(client: any, user: User) {
  const loginResponse = await client.post('/api/v1/auth/login').json({
    email: user.email,
    password: 'password123'
  })
  return loginResponse.cookies()[0]?.value || ''
}

test.group('Todos Controller', (group) => {
  let testUser: User

  group.each.setup(async () => {
    // Create test user
    testUser = await User.create({
      fullName: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    })
  })

  group.each.teardown(async () => {
    // Clean up test data
    await Todo.query().where('userId', testUser.id).delete()
    await testUser.delete()
  })

  test('GET /api/v1/todos - should return user todos when authenticated', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Create test todos
    await Todo.createMany([
      {
        title: 'Test Todo 1',
        description: 'Description 1',
        userId: testUser.id,
        status: 'pending'
      },
      {
        title: 'Test Todo 2',
        description: 'Description 2',
        userId: testUser.id,
        status: 'completed'
      }
    ])

    const response = await client.get('/api/v1/todos')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.todos)
    assert.equal(body.todos.length, 2)
    assert.equal(body.total, 2)
  })

  test('GET /api/v1/todos - should return 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/v1/todos')
    
    response.assertStatus(401)
    response.assertBodyContains({
      message: 'Unauthorized'
    })
  })

  test('GET /api/v1/todos - should filter by status', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    await Todo.createMany([
      {
        title: 'Pending Todo',
        description: 'This is pending',
        userId: testUser.id,
        status: 'pending'
      },
      {
        title: 'Completed Todo',
        description: 'This is completed',
        userId: testUser.id,
        status: 'completed'
      }
    ])

    const response = await client.get('/api/v1/todos?status=pending')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.todos.length, 1)
    assert.equal(body.todos[0].status, 'pending')
  })

  test('GET /api/v1/todos - should support search', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    await Todo.createMany([
      {
        title: 'Buy groceries',
        description: 'Milk, bread, eggs',
        userId: testUser.id,
        status: 'pending'
      },
      {
        title: 'Walk the dog',
        description: 'Take dog for a walk',
        userId: testUser.id,
        status: 'pending'
      }
    ])

    const response = await client.get('/api/v1/todos?search=groceries')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.todos.length, 1)
    assert.equal(body.todos[0].title, 'Buy groceries')
  })

  test('POST /api/v1/todos - should create a new todo', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const todoData = {
      title: 'New Test Todo',
      description: 'This is a test todo',
      status: 'pending',
      priority: 'medium',
      dueDate: '2024-12-31'
    }

    const response = await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json(todoData)
    
    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Todo created successfully',
      todo: {
        title: todoData.title,
        description: todoData.description,
        status: todoData.status,
        userId: testUser.id
      }
    })

    // Verify todo was created in database
    const todo = await Todo.findBy('title', todoData.title)
    assert.isNotNull(todo)
    assert.equal(todo?.userId, testUser.id)
  })

  test('POST /api/v1/todos - should fail with invalid data', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const invalidData = {
      title: '', // Empty title should fail
      description: 'Some description'
    }

    const response = await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json(invalidData)
    
    response.assertStatus(422)
    response.assertBodyContains({
      message: 'Validation failed',
      errors: {
        title: ['The title field is required']
      }
    })
  })

  test('GET /api/v1/todos/:id - should return specific todo', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const todo = await Todo.create({
      title: 'Specific Todo',
      description: 'Specific description',
      userId: testUser.id,
      status: 'pending'
    })

    const response = await client.get(`/api/v1/todos/${todo.id}`)
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    response.assertBodyContains({
      todo: {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        status: todo.status,
        userId: testUser.id
      }
    })
  })

  test('GET /api/v1/todos/:id - should return 404 for non-existent todo', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const response = await client.get('/api/v1/todos/99999')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(404)
    response.assertBodyContains({
      message: 'Todo not found'
    })
  })

  test('PUT /api/v1/todos/:id - should update todo', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const todo = await Todo.create({
      title: 'Original Title',
      description: 'Original description',
      userId: testUser.id,
      status: 'pending'
    })

    const updateData = {
      title: 'Updated Title',
      description: 'Updated description',
      status: 'completed',
      priority: 'high'
    }

    const response = await client.put(`/api/v1/todos/${todo.id}`)
      .cookie('adonis-session', authCookie)
      .json(updateData)
    
    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Todo updated successfully',
      todo: {
        id: todo.id,
        title: updateData.title,
        description: updateData.description,
        status: updateData.status
      }
    })

    // Verify todo was updated in database
    await todo.refresh()
    assert.equal(todo.title, updateData.title)
    assert.equal(todo.status, updateData.status)
  })

  test('DELETE /api/v1/todos/:id - should delete todo', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const todo = await Todo.create({
      title: 'Todo to Delete',
      description: 'This todo will be deleted',
      userId: testUser.id,
      status: 'pending'
    })

    const response = await client.delete(`/api/v1/todos/${todo.id}`)
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Todo deleted successfully'
    })

    // Verify todo was deleted from database
    const deletedTodo = await Todo.find(todo.id)
    assert.isNull(deletedTodo)
  })

  test('PATCH /api/v1/todos/:id/status - should update todo status', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const todo = await Todo.create({
      title: 'Status Test Todo',
      description: 'Testing status update',
      userId: testUser.id,
      status: 'pending'
    })

    const response = await client.patch(`/api/v1/todos/${todo.id}/status`)
      .cookie('adonis-session', authCookie)
      .json({ status: 'completed' })
    
    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Todo status updated successfully',
      todo: {
        id: todo.id,
        status: 'completed'
      }
    })

    // Verify status was updated in database
    await todo.refresh()
    assert.equal(todo.status, 'completed')
  })

  test('PATCH /api/v1/todos/:id/status - should fail with invalid status', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const todo = await Todo.create({
      title: 'Invalid Status Test',
      description: 'Testing invalid status',
      userId: testUser.id,
      status: 'pending'
    })

    const response = await client.patch(`/api/v1/todos/${todo.id}/status`)
      .cookie('adonis-session', authCookie)
      .json({ status: 'invalid-status' })
    
    response.assertStatus(422)
    response.assertBodyContains({
      message: 'Validation failed',
      errors: {
        status: ['The status field must be one of: pending, in_progress, completed, cancelled']
      }
    })
  })

  test('GET /api/v1/todos/stats - should return todo statistics', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    await Todo.createMany([
      {
        title: 'Pending Todo 1',
        description: 'Pending',
        userId: testUser.id,
        status: 'pending'
      },
      {
        title: 'Pending Todo 2',
        description: 'Pending',
        userId: testUser.id,
        status: 'pending'
      },
      {
        title: 'Completed Todo',
        description: 'Completed',
        userId: testUser.id,
        status: 'completed'
      }
    ])

    const response = await client.get('/api/v1/todos/stats')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    response.assertBodyContains({
      stats: {
        total: 3,
        pending: 2,
        completed: 1,
        inProgress: 0,
        cancelled: 0
      }
    })
  })
})
