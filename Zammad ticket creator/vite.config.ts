import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/zammad-api': {
          target: env.ZAMMAD_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zammad-api/, ''),
        },
      },
    },
  };
})
