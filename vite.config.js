import { defineConfig } from 'vite'
export default defineConfig({
    server: { port: 5173, open: '/bruja/inicio.html' },
    build: {
        rollupOptions: {
            input: { juego: 'index.html', inicio: 'bruja/inicio.html' }
        }
    }
})
