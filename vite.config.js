import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    server: {
        host: true,
        port: 5173,
    },
});
