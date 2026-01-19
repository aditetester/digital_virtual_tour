import { serve } from '@hono/node-server'
import app from './hono'

const port = 4000
console.log(`Backend server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0'
})
