import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 5173,
        open: '/bruja/inicio.html'   // <- abre tu portada
    },
    build: {
        rollupOptions: {
            input: {
                juego: 'index.html',            // tu juego del raíz
                inicio: 'bruja/inicio.html'     // tu portada en /bruja
            }
        }
    }
})
