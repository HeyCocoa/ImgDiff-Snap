import { defineConfig } from 'vite';

// Vite config kept minimal; React Fast Refresh plugin is optional.
export default defineConfig({
  // 直接以域名根路径为基准，开发环境访问 http://localhost:5173/
  base: '/',
});
