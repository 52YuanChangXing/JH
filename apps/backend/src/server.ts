import http from 'http';
import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

const port = env.port;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`🚀 Backend ready on http://localhost:${port}`);
  console.log(`📘 API docs at http://localhost:${port}/docs`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please stop the other process or change BACKEND_PORT.`);
    process.exit(1);
  }
  throw error;
});
