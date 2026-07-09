// React 入口 / React entry point
//
// 挂载 React 应用到 #root，并设置全局事件处理
// Mounts the React app to #root and sets up global event handlers

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 阻止默认右键菜单（无边框透明窗口下需要）
// Prevents default context menu (needed for borderless transparent window)
document.addEventListener('contextmenu', (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
