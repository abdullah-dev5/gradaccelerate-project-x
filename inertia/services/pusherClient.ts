import Pusher from 'pusher-js'

let client: Pusher | null = null

export function getPusherClient() {
  if (client) return client
  const key = import.meta.env.VITE_PUSHER_APP_KEY as string
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string
  if (!key || !cluster) {
    console.warn('[Pusher] Missing VITE_PUSHER_APP_KEY or VITE_PUSHER_CLUSTER')
    return null
  }

  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  client = new Pusher(key, {
    cluster,
    authEndpoint: '/pusher/auth',
    auth: {
      headers: {
        ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    },
    enabledTransports: ['ws', 'wss', 'xhr_polling', 'xhr_streaming'],
    disabledTransports: [],
    activityTimeout: 60000,
    pongTimeout: 30000,
  })

  // Add connection event listeners for debugging
  client.connection.bind('connecting', () => {
    console.info('[Pusher] Connecting...')
  })

  client.connection.bind('connected', () => {
    console.info('[Pusher] Connected')
  })

  client.connection.bind('disconnected', () => {
    console.warn('[Pusher] Disconnected')
  })

  client.connection.bind('error', (error: any) => {
    console.error('[Pusher] Connection error:', error)
  })

  client.connection.bind('state_change', (states: any) => {
    console.info('[Pusher] State changed:', states.previous, '->', states.current)
  })

  return client
}
