import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    base: '/',
    server: { port: 5173, open: '/index.html' },
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),  // ahora en la raíz
                juego: resolve(__dirname, 'juego.html')
            }
        }
    }
})
