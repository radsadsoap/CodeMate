import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiTarget = env.DEV_API_TARGET || 'http://localhost:5000';

    return {
        plugins: [react(), tailwindcss()],
        server: {
            port: 5173,
            // Mirrors the production rewrite so cookies stay first-party in development too.
            proxy: {
                '/api': { target: apiTarget },
                '/socket.io': { target: apiTarget, ws: true },
            },
        },
    };
});
