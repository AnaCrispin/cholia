import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    base: '/',                                   // importante en producción
    server: { port: 5173, open: '/bruja/index.html' },
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'bruja/index.html'), // genera dist/index.html
                juego: resolve(__dirname, 'juego.html')        // genera dist/juego.html
            }
        }
    }
})
