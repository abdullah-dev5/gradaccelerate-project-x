import { test } from '@japa/runner'

test.group('Routes Smoke', () => {
  test('GET / returns OK', async ({ client }) => {
    const response = await client.get('/')
    response.assertStatus(200)
  })

  test('GET /__missing__ returns 404 status page', async ({ client }) => {
    const response = await client.get('/__missing__')
    response.assertStatus(404)
  })

  test('GET /api/v1/notes requires auth (redirect to /login)', async ({ client }) => {
    const response = await client.get('/api/v1/notes')
    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})


