import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

const rootEl = document.getElementById('root')!;
// 将历史上遗留的 /home 路由统一替换为根路径 /
if (location.pathname === '/home') {
  history.replaceState(null, '', '/');
}

// Dev-only: 彻底清理本地已注册的 Service Worker 与 Cache，避免旧项目占用同端口导致白屏
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  (async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length) {
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        // 注销后刷新一次确保接管页面（仅在首次清理时执行）
        location.reload();
      }
    } catch (err) {
      console.warn('SW cleanup failed', err);
    }
  })();
}
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
