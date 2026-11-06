import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        target: 'es2020',
        // Bibliotecas em arquivos próprios: um deploy do jogo não obriga a baixar tudo de novo
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/@supabase') || id.includes('node_modules/tslib') || id.includes('node_modules/iceberg-js')) return 'supabase';
                    return undefined;
                }
            }
        }
    }
});
