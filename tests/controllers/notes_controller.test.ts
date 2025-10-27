import { test } from '@japa/runner'
import User from '#models/user'
import Note from '#models/note'

// Helper function to authenticate user
async function authenticateUser(client: any, user: User) {
  const loginResponse = await client.post('/api/v1/auth/login').json({
    email: user.email,
    password: 'password123',
  })
  return loginResponse.cookies()[0]?.value || ''
}

test.group('Notes Controller', (group) => {
  let testUser: User

  group.each.setup(async () => {
    // Create test user
    testUser = await User.create({
      fullName: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
    })
  })

  group.each.teardown(async () => {
    // Clean up test data
    await Note.query().where('userId', testUser.id).delete()
    await testUser.delete()
  })

  test('GET /api/v1/notes - should return user notes when authenticated', async ({
    client,
    assert,
  }) => {
    // Authenticate user
    const authCookie = await authenticateUser(client, testUser)

    // Create test notes
    await Note.createMany([
      {
        title: 'Test Note 1',
        content: 'Content 1',
        userId: testUser.id,
      },
      {
        title: 'Test Note 2',
        content: 'Content 2',
        userId: testUser.id,
      },
    ])

    const response = await client.get('/api/v1/notes').cookie('adonis-session', authCookie)

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.notes)
    assert.equal(body.notes.length, 2)
    assert.equal(body.total, 2)
  })

  test('GET /api/v1/notes - should return 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/v1/notes')

    response.assertStatus(401)
    response.assertBodyContains({
      message: 'Unauthorized',
    })
  })

  test('GET /api/v1/notes - should support pagination', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)

    // Create 15 test notes
    const notes = Array.from({ length: 15 }, (_, i) => ({
      title: `Test Note ${i + 1}`,
      content: `Content ${i + 1}`,
      userId: testUser.id,
    }))
    await Note.createMany(notes)

    const response = await client
      .get('/api/v1/notes?page=2&limit=10')
      .cookie('adonis-session', authCookie)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.notes.length, 5) // Remaining 5 notes on page 2
    assert.equal(body.total, 15)
    assert.equal(body.currentPage, 2)
  })

  test('GET /api/v1/notes - should support search', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)

    await Note.createMany([
      {
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript basics',
        userId: testUser.id,
      },
      {
        title: 'Python Guide',
        content: 'Python programming guide',
        userId: testUser.id,
      },
    ])

    const response = await client
      .get('/api/v1/notes?search=JavaScript')
      .cookie('adonis-session', authCookie)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.notes.length, 1)
    assert.equal(body.notes[0].title, 'JavaScript Tutorial')
  })

  test('POST /api/v1/notes - should create a new note', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)

    const noteData = {
      title: 'New Test Note',
      content: 'This is test content',
      pinned: false,
    }

    const response = await client
      .post('/api/v1/notes')
      .cookie('adonis-session', authCookie)
      .json(noteData)

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Note created successfully',
      note: {
        title: noteData.title,
        content: noteData.content,
        userId: testUser.id,
      },
    })

    // Verify note was created in database
    const note = await Note.findBy('title', noteData.title)
    assert.isNotNull(note)
    assert.equal(note?.userId, testUser.id)
  })

  test('POST /api/v1/notes - should fail with invalid data', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)

    const invalidData = {
      title: '', // Empty title should fail
      content: 'Some content',
    }

    const response = await client
      .post('/api/v1/notes')
      .cookie('adonis-session', authCookie)
      .json(invalidData)

    response.assertStatus(422)
    response.assertBodyContains({
      message: 'Validation failed',
      errors: {
        title: ['The title field is required'],
      },
    })
  })

  test('GET /api/v1/notes/:id - should return specific note', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)

    const note = await Note.create({
      title: 'Specific Note',
      content: 'Specific content',
      userId: testUser.id,
    })

    const response = await client
      .get(`/api/v1/notes/${note.id}`)
      .cookie('adonis-session', authCookie)

    response.assertStatus(200)
    response.assertBodyContains({
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        userId: testUser.id,
      },
    })
  })

  test('GET /api/v1/notes/:id - should return 404 for non-existent note', async ({ client }) => {
    const authCookie = await authenticateUser(client, testUser)

    const response = await client.get('/api/v1/notes/99999').cookie('adonis-session', authCookie)

    response.assertStatus(404)
    response.assertBodyContains({
      message: 'Note not found',
    })
  })

  test('GET /api/v1/notes/:id - should return 403 for note belonging to another user', async ({
    client,
  }) => {
    const authCookie = await authenticateUser(client, testUser)

    // Create another user and their note
    const otherUser = await User.create({
      fullName: 'Other User',
      email: `other-${Date.now()}@example.com`,
      password: 'password123',
    })

    const otherNote = await Note.create({
      title: 'Other User Note',
      content: 'Other user content',
      userId: otherUser.id,
    })

    const response = await client
      .get(`/api/v1/notes/${otherNote.id}`)
      .cookie('adonis-session', authCookie)

    response.assertStatus(403)
    response.assertBodyContains({
      message: 'Access denied',
    })

    // Clean up
    await otherNote.delete()
    await otherUser.delete()
  })

  test('PUT /api/v1/notes/:id - should update note', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)

    const note = await Note.create({
      title: 'Original Title',
      content: 'Original content',
      userId: testUser.id,
    })

    const updateData = {
      title: 'Updated Title',
      content: 'Updated content',
      pinned: true,
    }

    const response = await client
      .put(`/api/v1/notes/${note.id}`)
      .cookie('adonis-session', authCookie)
      .json(updateData)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Note updated successfully',
      note: {
        id: note.id,
        title: updateData.title,
        content: updateData.content,
        pinned: updateData.pinned,
      },
    })

    // Verify note was updated in database
    await note.refresh()
    assert.equal(note.title, updateData.title)
    assert.equal(note.content, updateData.content)
  })

  test('DELETE /api/v1/notes/:id - should delete note', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)

    const note = await Note.create({
      title: 'Note to Delete',
      content: 'This note will be deleted',
      userId: testUser.id,
    })

    const response = await client
      .delete(`/api/v1/notes/${note.id}`)
      .cookie('adonis-session', authCookie)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Note deleted successfully',
    })

    // Verify note was deleted from database
    const deletedNote = await Note.find(note.id)
    assert.isNull(deletedNote)
  })

  test('POST /api/v1/notes/:id/pin - should pin/unpin note', async ({ client, assert }) => {
    const authCookie = await authenticateUser(client, testUser)

    const note = await Note.create({
      title: 'Pin Test Note',
      content: 'Testing pin functionality',
      userId: testUser.id,
      pinned: false,
    })

    // Pin the note
    const pinResponse = await client
      .post(`/api/v1/notes/${note.id}/pin`)
      .cookie('adonis-session', authCookie)

    pinResponse.assertStatus(200)
    pinResponse.assertBodyContains({
      message: 'Note pinned successfully',
    })

    await note.refresh()
    assert.isTrue(note.pinned)

    // Unpin the note
    const unpinResponse = await client
      .post(`/api/v1/notes/${note.id}/pin`)
      .cookie('adonis-session', authCookie)

    unpinResponse.assertStatus(200)
    unpinResponse.assertBodyContains({
      message: 'Note unpinned successfully',
    })

    await note.refresh()
    assert.isFalse(note.pinned)
  })
})
