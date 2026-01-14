import 'dotenv/config'
import express, { type Express } from 'express'
import { initDatabase, closeDatabase } from './db/index.js'
import { corsMiddleware, helmetMiddleware } from './middleware/security.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import apiRouter from './api/index.js'

export const app: Express = express()
const PORT = process.env.PORT || 3001

// Initialize database
initDatabase()

// Middleware
app.use(helmetMiddleware)
app.use(corsMiddleware)
app.use(express.json())

// API routes
app.use('/api', apiRouter)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Start server
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
  })

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down gracefully...')
    server.close(() => {
      closeDatabase()
      console.log('Server closed')
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

export default app
