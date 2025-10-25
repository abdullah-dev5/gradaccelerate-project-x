import { test } from '@japa/runner'
import User from '#models/user'
import Note from '#models/note'
import Todo from '#models/todo'
import Project from '#models/project'

// Helper function to authenticate user
async function authenticateUser(client: any, user: User) {
  const loginResponse = await client.post('/api/v1/auth/login').json({
    email: user.email,
    password: 'password123'
  })
  return loginResponse.cookies()[0]?.value || ''
}

test.group('API Integration Tests', (group) => {
  let testUser: User

  group.each.setup(async () => {
    // Create test user
    testUser = await User.create({
      fullName: 'Integration Test User',
      email: `integration-${Date.now()}@example.com`,
      password: 'password123'
    })
  })

  group.each.teardown(async () => {
    // Clean up all test data
    await Note.query().where('userId', testUser.id).delete()
    await Todo.query().where('userId', testUser.id).delete()
    await Project.query().where('userId', testUser.id).delete()
    await testUser.delete()
  })

  test('Complete Notes CRUD workflow', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // CREATE
    const createResponse = await client.post('/api/v1/notes')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Integration Test Note',
        content: 'This is a test note for integration testing',
        pinned: false
      })

    createResponse.assertStatus(201)
    const createdNote = createResponse.body().note
    assert.equal(createdNote.title, 'Integration Test Note')

    // READ
    const readResponse = await client.get(`/api/v1/notes/${createdNote.id}`)
      .cookie('adonis-session', authCookie)

    readResponse.assertStatus(200)
    assert.equal(readResponse.body().note.id, createdNote.id)

    // UPDATE
    const updateResponse = await client.put(`/api/v1/notes/${createdNote.id}`)
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Updated Integration Test Note',
        content: 'Updated content',
        pinned: true
      })

    updateResponse.assertStatus(200)
    assert.equal(updateResponse.body().note.title, 'Updated Integration Test Note')
    assert.isTrue(updateResponse.body().note.pinned)

    // DELETE
    const deleteResponse = await client.delete(`/api/v1/notes/${createdNote.id}`)
      .cookie('adonis-session', authCookie)

    deleteResponse.assertStatus(200)

    // Verify deletion
    const verifyResponse = await client.get(`/api/v1/notes/${createdNote.id}`)
      .cookie('adonis-session', authCookie)

    verifyResponse.assertStatus(404)
  })

  test('Complete Todos CRUD workflow', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // CREATE
    const createResponse = await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Integration Test Todo',
        description: 'This is a test todo for integration testing',
        status: 'pending',
        priority: 'medium'
      })

    createResponse.assertStatus(201)
    const createdTodo = createResponse.body().todo
    assert.equal(createdTodo.title, 'Integration Test Todo')

    // READ
    const readResponse = await client.get(`/api/v1/todos/${createdTodo.id}`)
      .cookie('adonis-session', authCookie)

    readResponse.assertStatus(200)
    assert.equal(readResponse.body().todo.id, createdTodo.id)

    // UPDATE STATUS
    const statusResponse = await client.patch(`/api/v1/todos/${createdTodo.id}/status`)
      .cookie('adonis-session', authCookie)
      .json({ status: 'completed' })

    statusResponse.assertStatus(200)
    assert.equal(statusResponse.body().todo.status, 'completed')

    // UPDATE
    const updateResponse = await client.put(`/api/v1/todos/${createdTodo.id}`)
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Updated Integration Test Todo',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high'
      })

    updateResponse.assertStatus(200)
    assert.equal(updateResponse.body().todo.title, 'Updated Integration Test Todo')

    // DELETE
    const deleteResponse = await client.delete(`/api/v1/todos/${createdTodo.id}`)
      .cookie('adonis-session', authCookie)

    deleteResponse.assertStatus(200)

    // Verify deletion
    const verifyResponse = await client.get(`/api/v1/todos/${createdTodo.id}`)
      .cookie('adonis-session', authCookie)

    verifyResponse.assertStatus(404)
  })

  test('Complete Projects CRUD workflow', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // CREATE
    const createResponse = await client.post('/api/v1/projects')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Integration Test Project',
        description: 'This is a test project for integration testing',
        status: 'in_progress',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })

    createResponse.assertStatus(201)
    const createdProject = createResponse.body().project
    assert.equal(createdProject.title, 'Integration Test Project')

    // READ
    const readResponse = await client.get(`/api/v1/projects/${createdProject.id}`)
      .cookie('adonis-session', authCookie)

    readResponse.assertStatus(200)
    assert.equal(readResponse.body().project.id, createdProject.id)

    // UPDATE STATUS
    const statusResponse = await client.patch(`/api/v1/projects/${createdProject.id}/status`)
      .cookie('adonis-session', authCookie)
      .json({ status: 'completed' })

    statusResponse.assertStatus(200)
    assert.equal(statusResponse.body().project.status, 'completed')

    // UPDATE
    const updateResponse = await client.put(`/api/v1/projects/${createdProject.id}`)
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Updated Integration Test Project',
        description: 'Updated description',
        status: 'paused',
        endDate: '2024-06-30'
      })

    updateResponse.assertStatus(200)
    assert.equal(updateResponse.body().project.title, 'Updated Integration Test Project')

    // DELETE
    const deleteResponse = await client.delete(`/api/v1/projects/${createdProject.id}`)
      .cookie('adonis-session', authCookie)

    deleteResponse.assertStatus(200)

    // Verify deletion
    const verifyResponse = await client.get(`/api/v1/projects/${createdProject.id}`)
      .cookie('adonis-session', authCookie)

    verifyResponse.assertStatus(404)
  })

  test('Cross-entity data relationships', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Create a project
    const projectResponse = await client.post('/api/v1/projects')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Test Project for Relationships',
        description: 'Testing data relationships',
        status: 'in_progress'
      })

    const project = projectResponse.body().project

    // Create notes related to the project
    const noteResponse = await client.post('/api/v1/notes')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Project Note',
        content: 'Note related to the project',
        projectId: project.id
      })

    assert.equal(noteResponse.body().note.projectId, project.id)

    // Create todos related to the project
    const todoResponse = await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Project Todo',
        description: 'Todo related to the project',
        projectId: project.id,
        status: 'pending'
      })

    assert.equal(todoResponse.body().todo.projectId, project.id)

    // Verify relationships in list endpoints
    const notesListResponse = await client.get('/api/v1/notes')
      .cookie('adonis-session', authCookie)

    const notesList = notesListResponse.body().notes
    const projectNote = notesList.find((note: any) => note.projectId === project.id)
    assert.isNotNull(projectNote)

    const todosListResponse = await client.get('/api/v1/todos')
      .cookie('adonis-session', authCookie)

    const todosList = todosListResponse.body().todos
    const projectTodo = todosList.find((todo: any) => todo.projectId === project.id)
    assert.isNotNull(projectTodo)
  })

  test('Pagination across all entities', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Create multiple notes
    const notes = []
    for (let i = 1; i <= 15; i++) {
      const response = await client.post('/api/v1/notes')
        .cookie('adonis-session', authCookie)
        .json({
          title: `Test Note ${i}`,
          content: `Content for note ${i}`
        })
      notes.push(response.body().note)
    }

    // Test pagination
    const page1Response = await client.get('/api/v1/notes?page=1&limit=10')
      .cookie('adonis-session', authCookie)

    page1Response.assertStatus(200)
    assert.equal(page1Response.body().notes.length, 10)
    assert.equal(page1Response.body().currentPage, 1)
    assert.equal(page1Response.body().total, 15)

    const page2Response = await client.get('/api/v1/notes?page=2&limit=10')
      .cookie('adonis-session', authCookie)

    page2Response.assertStatus(200)
    assert.equal(page2Response.body().notes.length, 5)
    assert.equal(page2Response.body().currentPage, 2)
  })

  test('Search functionality across entities', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Create test data
    await client.post('/api/v1/notes')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript programming'
      })

    await client.post('/api/v1/notes')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Python Guide',
        content: 'Learn Python programming'
      })

    await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Learn JavaScript',
        description: 'Study JavaScript fundamentals',
        status: 'pending'
      })

    await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Learn Python',
        description: 'Study Python fundamentals',
        status: 'pending'
      })

    // Test search in notes
    const notesSearchResponse = await client.get('/api/v1/notes?search=JavaScript')
      .cookie('adonis-session', authCookie)

    notesSearchResponse.assertStatus(200)
    assert.equal(notesSearchResponse.body().notes.length, 1)
    assert.equal(notesSearchResponse.body().notes[0].title, 'JavaScript Tutorial')

    // Test search in todos
    const todosSearchResponse = await client.get('/api/v1/todos?search=Python')
      .cookie('adonis-session', authCookie)

    todosSearchResponse.assertStatus(200)
    assert.equal(todosSearchResponse.body().todos.length, 1)
    assert.equal(todosSearchResponse.body().todos[0].title, 'Learn Python')
  })

  test('Statistics endpoints', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Create test data
    await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Pending Todo',
        description: 'This is pending',
        status: 'pending'
      })

    await client.post('/api/v1/todos')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Completed Todo',
        description: 'This is completed',
        status: 'completed'
      })

    await client.post('/api/v1/projects')
      .cookie('adonis-session', authCookie)
      .json({
        title: 'Active Project',
        description: 'This is active',
        status: 'in_progress'
      })

    // Test todos stats
    const todosStatsResponse = await client.get('/api/v1/todos/stats')
      .cookie('adonis-session', authCookie)

    todosStatsResponse.assertStatus(200)
    const todosStats = todosStatsResponse.body().stats
    assert.equal(todosStats.total, 2)
    assert.equal(todosStats.pending, 1)
    assert.equal(todosStats.completed, 1)

    // Test projects stats
    const projectsStatsResponse = await client.get('/api/v1/projects/stats')
      .cookie('adonis-session', authCookie)

    projectsStatsResponse.assertStatus(200)
    const projectsStats = projectsStatsResponse.body().stats
    assert.equal(projectsStats.total, 1)
    assert.equal(projectsStats.active, 1)
  })

  test('Authentication flow integration', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Test logout
    const logoutResponse = await client.post('/api/v1/auth/logout')
      .cookie('adonis-session', authCookie)

    logoutResponse.assertStatus(200)

    // Verify user is logged out
    const meResponse = await client.get('/api/v1/auth/me')
      .cookie('adonis-session', authCookie)

    meResponse.assertStatus(401)

    // Test protected endpoint access
    const protectedResponse = await client.get('/api/v1/notes')
      .cookie('adonis-session', authCookie)

    protectedResponse.assertStatus(401)
  })

  test('Error handling across all endpoints', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Test invalid note ID
    const invalidNoteResponse = await client.get('/api/v1/notes/invalid-id')
      .cookie('adonis-session', authCookie)

    invalidNoteResponse.assertStatus(404)

    // Test invalid todo ID
    const invalidTodoResponse = await client.get('/api/v1/todos/invalid-id')
      .cookie('adonis-session', authCookie)

    invalidTodoResponse.assertStatus(404)

    // Test invalid project ID
    const invalidProjectResponse = await client.get('/api/v1/projects/invalid-id')
      .cookie('adonis-session', authCookie)

    invalidProjectResponse.assertStatus(404)

    // Test validation errors
    const invalidDataResponse = await client.post('/api/v1/notes')
      .cookie('adonis-session', authCookie)
      .json({
        title: '', // Invalid empty title
        content: 'Some content'
      })

    invalidDataResponse.assertStatus(422)
    assert.isTrue(invalidDataResponse.body().errors.hasOwnProperty('title'))
  })
})
