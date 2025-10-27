import type { HttpContext } from '@adonisjs/core/http'
import Pusher from 'pusher'

export default class PusherController {
  async auth({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      console.log('Pusher auth: No user found')
      return response.unauthorized()
    }

    const channel_name = request.input('channel_name')
    const socket_id = request.input('socket_id')

    console.log('Pusher auth request:', {
      userId: user.id,
      channel_name,
      socket_id,
      expectedChannel: `private-user.${user.id}`,
    })

    if (!channel_name || !socket_id) {
      console.log('Pusher auth: Missing channel_name or socket_id')
      return response.badRequest({ error: 'Missing channel_name or socket_id' })
    }

    // Only allow user to authenticate to their own private channel
    if (channel_name !== `private-user.${user.id}`) {
      console.log('Pusher auth: Unauthorized channel', {
        channel_name,
        expected: `private-user.${user.id}`,
      })
      return response.forbidden({ error: 'Unauthorized channel' })
    }

    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_APP_KEY!,
      secret: process.env.PUSHER_APP_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })

    const authResponse = pusher.authenticate(socket_id, channel_name)
    console.log('Pusher auth: Success', { userId: user.id, channel_name })
    response.header('Content-Type', 'application/json')
    return response.ok(authResponse)
  }
}
