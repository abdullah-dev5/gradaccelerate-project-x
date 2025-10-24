import { test } from '@japa/runner'
import User from '#models/user'
import Project from '#models/project'

// Helper function to authenticate user
async function authenticateUser(client: any, user: User) {
  const loginResponse = await client.post('/api/v1/auth/login').json({
    email: user.email,
    password: 'password123'
  })
  return loginResponse.cookies()[0]?.value || ''
}

test.group('Projects Controller', (group) => {
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
    await Project.query().where('userId', testUser.id).delete()
    await testUser.delete()
  })

  test('GET /api/v1/projects - should return user projects when authenticated', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Create test projects
    await Project.createMany([
      {
        title: 'Test Project 1',
        description: 'Description 1',
        userId: testUser.id,
        status: 'in_progress'
      },
      {
        title: 'Test Project 2',
        description: 'Description 2',
        userId: testUser.id,
        status: 'completed'
      }
    ])

    const response = await client.get('/api/v1/projects')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.projects)
    assert.equal(body.projects.length, 2)
    assert.equal(body.total, 2)
  })

  test('GET /api/v1/projects - should return 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/v1/projects')
    
    response.assertStatus(401)
    response.assertBodyContains({
      message: 'Unauthorized'
    })
  })

  test('GET /api/v1/projects - should filter by status', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    await Project.createMany([
      {
        title: 'Active Project',
        description: 'This is active',
        userId: testUser.id,
        status: 'in_progress'
      },
      {
        title: 'Completed Project',
        description: 'This is completed',
        userId: testUser.id,
        status: 'completed'
      }
    ])

    const response = await client.get('/api/v1/projects?status=in_progress')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.projects.length, 1)
    assert.equal(body.projects[0].status, 'in_progress')
  })

  test('GET /api/v1/projects - should support search', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    await Project.createMany([
      {
        title: 'Web Development Project',
        description: 'Building a web app',
        userId: testUser.id,
        status: 'in_progress'
      },
      {
        title: 'Mobile App Project',
        description: 'Building a mobile app',
        userId: testUser.id,
        status: 'in_progress'
      }
    ])

    const response = await client.get('/api/v1/projects?search=web')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.projects.length, 1)
    assert.equal(body.projects[0].title, 'Web Development Project')
  })

  test('POST /api/v1/projects - should create a new project', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const projectData = {
      title: 'New Test Project',
      description: 'This is a test project',
      status: 'in_progress',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }

    const response = await client.post('/api/v1/projects')
      .cookie('adonis-session', authCookie)
      .json(projectData)
    
    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Project created successfully',
      project: {
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        userId: testUser.id
      }
    })

    // Verify project was created in database
    const project = await Project.findBy('title', projectData.title)
    assert.isNotNull(project)
    assert.equal(project?.userId, testUser.id)
  })

  test('POST /api/v1/projects - should fail with invalid data', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const invalidData = {
      title: '', // Empty title should fail
      description: 'Some description'
    }

    const response = await client.post('/api/v1/projects')
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

  test('GET /api/v1/projects/:id - should return specific project', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const project = await Project.create({
      title: 'Specific Project',
      description: 'Specific description',
      userId: testUser.id,
      status: 'active'
    })

    const response = await client.get(`/api/v1/projects/${project.id}`)
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    response.assertBodyContains({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        userId: testUser.id
      }
    })
  })

  test('GET /api/v1/projects/:id - should return 404 for non-existent project', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const response = await client.get('/api/v1/projects/99999')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(404)
    response.assertBodyContains({
      message: 'Project not found'
    })
  })

  test('GET /api/v1/projects/:id - should return 403 for project belonging to another user', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    // Create another user and their project
    const otherUser = await User.create({
      fullName: 'Other User',
      email: `other-${Date.now()}@example.com`,
      password: 'password123'
    })

    const otherProject = await Project.create({
      title: 'Other User Project',
      description: 'Other user project',
      userId: otherUser.id,
      status: 'active'
    })

    const response = await client.get(`/api/v1/projects/${otherProject.id}`)
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(403)
    response.assertBodyContains({
      message: 'Access denied'
    })

    // Clean up
    await otherProject.delete()
    await otherUser.delete()
  })

  test('PUT /api/v1/projects/:id - should update project', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const project = await Project.create({
      title: 'Original Title',
      description: 'Original description',
      userId: testUser.id,
      status: 'active'
    })

    const updateData = {
      title: 'Updated Title',
      description: 'Updated description',
      status: 'completed',
      endDate: '2024-06-30'
    }

    const response = await client.put(`/api/v1/projects/${project.id}`)
      .cookie('adonis-session', authCookie)
      .json(updateData)
    
    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Project updated successfully',
      project: {
        id: project.id,
        title: updateData.title,
        description: updateData.description,
        status: updateData.status
      }
    })

    // Verify project was updated in database
    await project.refresh()
    assert.equal(project.title, updateData.title)
    assert.equal(project.status, updateData.status)
  })

  test('DELETE /api/v1/projects/:id - should delete project', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const project = await Project.create({
      title: 'Project to Delete',
      description: 'This project will be deleted',
      userId: testUser.id,
      status: 'active'
    })

    const response = await client.delete(`/api/v1/projects/${project.id}`)
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Project deleted successfully'
    })

    // Verify project was deleted from database
    const deletedProject = await Project.find(project.id)
    assert.isNull(deletedProject)
  })

  test('PATCH /api/v1/projects/:id/status - should update project status', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    const project = await Project.create({
      title: 'Status Test Project',
      description: 'Testing status update',
      userId: testUser.id,
      status: 'active'
    })

    const response = await client.patch(`/api/v1/projects/${project.id}/status`)
      .cookie('adonis-session', authCookie)
      .json({ status: 'completed' })
    
    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Project status updated successfully',
      project: {
        id: project.id,
        status: 'completed'
      }
    })

    // Verify status was updated in database
    await project.refresh()
    assert.equal(project.status, 'completed')
  })

  test('GET /api/v1/projects/stats - should return project statistics', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)
    
    await Project.createMany([
      {
        title: 'Active Project 1',
        description: 'Active',
        userId: testUser.id,
        status: 'in_progress'
      },
      {
        title: 'Active Project 2',
        description: 'Active',
        userId: testUser.id,
        status: 'in_progress'
      },
      {
        title: 'Completed Project',
        description: 'Completed',
        userId: testUser.id,
        status: 'completed'
      }
    ])

    const response = await client.get('/api/v1/projects/stats')
      .cookie('adonis-session', authCookie)
    
    response.assertStatus(200)
    response.assertBodyContains({
      stats: {
        total: 3,
        in_progress: 2,
        completed: 1,
        paused: 0,
        cancelled: 0
      }
    })
  })
})
