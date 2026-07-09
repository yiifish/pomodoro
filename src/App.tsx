// 主应用组件 / Main application component
//
// 结构 / Layout:
// ┌─────────────────────────┐
// │  drag-region (全屏拖拽)  │
// │  glass-bg   (毛玻璃背景) │
// │  ┌─ top-bar ───────────┐│
// │  │              [—] 隐藏││
// │  ├─ ProgressRing ──────┤│
// │  │  状态 · 倒计时 · 圆环 ││
// │  ├─ Controls ──────────┤│
// │  │  [开始] [重置]  🍅 ⚙││
// │  └─────────────────────┘│
// │  Settings (叠加层)       │
// └─────────────────────────┘

import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import ProgressRing from './components/ProgressRing';
import Controls from './components/Controls';
import Settings from './components/Settings';
import { initEventListeners } from './stores/useStore';

function App() {
  // 启动时注册所有 Tauri 事件监听并加载初始数据
  useEffect(() => {
    initEventListeners();
  }, []);

  return (
    <div className="app-container">
      {/* 全局拖拽区域：覆盖整个窗口，按钮元素通过 CSS no-drag 排除 */}
      <div className="drag-region" />

      {/* 毛玻璃半透明背景 / Glassmorphism background */}
      <div className="glass-bg" />

      <div className="content">
        {/* 顶部栏：隐藏到托盘按钮 */}
        <div className="top-bar">
          <button
            className="btn-hide"
            onClick={() => getCurrentWindow().hide()}
            title="隐藏到托盘 / Hide to tray"
          >
            —
          </button>
        </div>

        {/* 环形进度条 + 倒计时 */}
        <ProgressRing />

        {/* 控制按钮：开始/暂停/重置/跳过 + 番茄计数 */}
        <Controls />
      </div>

      {/* 设置面板（绝对定位覆盖） */}
      <Settings />
    </div>
  );
}

export default App;
