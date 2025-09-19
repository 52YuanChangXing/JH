import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'FRONTEND_');
  const port = Number(env.FRONTEND_PORT || 5173);
  return {
    plugins: [react()],
    server: {
      port,
      strictPort: false
    },
    preview: {
      port
    },
    define: {
      'import.meta.env.FRONTEND_API_BASE_URL': JSON.stringify(env.FRONTEND_API_BASE_URL || '')
    }
  };
});
