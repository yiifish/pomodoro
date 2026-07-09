// 主应用组件 / Main application component
//
// 结构 / Layout:
// ┌─────────────────────────┐
// │  drag-region (全屏拖拽)  │
// │  glass-bg   (毛玻璃背景) │
// │  ┌─ top-bar ───────────┐│
// │  │              [—] 隐藏││
// │  ├─ ProgressRing ──────┤│
// │  │  状态 · 倒计时 · 圆环  ││
// │  ├─ Controls ──────────┤│
// │  │ [开始] [重置] 🍅 ⚙  ││
// │  └─────────────────────┘│
// │  Settings (叠加层)       │
// └─────────────────────────┘

import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import ProgressRing from './components/ProgressRing';
import Controls from './components/Controls';
import Settings from './components/Settings';
import { initEventListeners } from './stores/useStore';

/** 内联 SVG 图标 — 最小化 / Inline SVG icon — minimize */
function MinimizeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round">
      <path d="M3 8h10" />
    </svg>
  );
}

function App() {
  useEffect(() => {
    initEventListeners();
  }, []);

  return (
    <div className="app-container">
      <div className="drag-region" />
      <div className="glass-bg" />

      <div className="content">
        {/* 顶部栏：隐藏按钮 */}
        <div className="top-bar">
          <button
            className="btn-hide"
            onClick={() => getCurrentWindow().hide()}
            title="隐藏到托盘 / Hide to tray"
            aria-label="隐藏到托盘"
          >
            <MinimizeIcon />
          </button>
        </div>

        <ProgressRing />
        <Controls />
      </div>

      <Settings />
    </div>
  );
}

export default App;
