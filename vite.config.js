import { defineConfig } from 'vite'

export default defineConfig({
    server: { port: 5173, open: '/bruja/inicio.html' },
    build: {
        rollupOptions: {
            input: {
                home: 'index.html',          // ← meta-redirect a /bruja/inicio.html
                juego: 'juego.html',          // el juego
                inicio: 'bruja/inicio.html'    // la portada
            }
        }
    }
})
