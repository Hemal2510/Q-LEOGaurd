// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/celestrak': {
                target: 'https://celestrak.org',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/celestrak/, ''),
            }
        }
    }
})