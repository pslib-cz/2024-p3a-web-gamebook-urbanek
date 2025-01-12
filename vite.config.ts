import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../stinsily.Server/wwwroot', // Ensure this matches your server's static file directory
    emptyOutDir: true,
  },
  server: {
    port: 3000, // Local development port
  },
}); 