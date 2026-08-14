// Cloudflare Workers entry point for Express app
import { createServer } from 'node:http'
import { httpServerHandler } from 'cloudflare:node'

// Dynamically import the CommonJS Express app
const indexModule = await import('./index.js')
const app = indexModule.default || indexModule

// Create HTTP server from Express app
const server = createServer(app)

// Export the handler for Cloudflare Workers
export default httpServerHandler(server)
