import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        port: 5173,
        open: '/bruja/inicio.html'
    },
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                inicio: resolve(__dirname, 'bruja/inicio.html'),
                juego: resolve(__dirname, 'juego.html')
            }
        }
    }
});
