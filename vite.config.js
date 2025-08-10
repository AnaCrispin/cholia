import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        port: 5173,
        open: '/bruja/index.html'
    },
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                inicio: resolve(__dirname, 'bruja/index.html'),
                juego: resolve(__dirname, 'juego.html')
            }
        }
    }
});
