import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Register CORS
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Register JWT
const jwtSecret = process.env.JWT_SECRET || 'ultraaxo-ai-super-secret-key-12345';
fastify.register(jwt, {
  secret: jwtSecret,
});

// Register Rate Limiting
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Import route plugins
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import chatRoutes from './routes/chat';

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(projectRoutes, { prefix: '/api/projects' });
fastify.register(chatRoutes, { prefix: '/api/chat' });

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'healthy', timestamp: new Date() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
