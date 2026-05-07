import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(() => {
  const mockSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    plugins: [vue()],
    define: {
      'import.meta.env.VITE_MOCK_SESSION_ID': JSON.stringify(mockSessionId),
    },
  }
})
