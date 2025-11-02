import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

const rootEl = document.getElementById('root')!;
// 将历史上遗留的 /home 路由统一替换为根路径 /
if (location.pathname === '/home') {
  history.replaceState(null, '', '/');
}
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
