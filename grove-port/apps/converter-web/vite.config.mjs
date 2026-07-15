import { defineConfig } from 'vite';

export default defineConfig({
  base: '/move/',
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: [
      '@grove-port/convert-browser',
      '@grove-port/adapter-chatgpt/browser',
      '@grove-port/adapter-claude/browser',
      '@grove-port/adapter-openwebui/browser',
      '@grove-port/adapter-librechat/browser',
      '@grove-port/adapter-gemini/browser',
      '@grove-port/adapter-doubao/browser',
      '@grove-port/adapter-deepseek/browser',
      '@grove-port/adapter-lobechat/browser',
      '@grove-port/adapter-anythingllm/browser',
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
