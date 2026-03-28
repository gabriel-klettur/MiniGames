import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // o el plugin que uses

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 👈 Esto permite acceso desde la red local
    port: 5173  // Puedes cambiarlo si quieres
  }
})
