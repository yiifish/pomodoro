import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 阻止默认右键菜单（透明窗口需要）
document.addEventListener('contextmenu', (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
